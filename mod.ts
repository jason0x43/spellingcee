import { Arguments, log, Yargs, yargs } from "./deps.ts";
import { serve } from "./server/mod.ts";
import {
  addUser,
  getUserIdFromEmail,
  isUserPassword,
  openDatabase,
  updateUserPassword,
} from "./server/database/mod.ts";
import { promptSecret } from "./util.ts";
import { User } from "./server/database/types.ts";

const defaultPort = 8084;
const envPort = Deno.env.get("SC_PORT");
const port = envPort ? Number(envPort) : defaultPort;

async function configureLogger(args: Arguments) {
  await log.setup({
    handlers: {
      default: new log.handlers.ConsoleHandler("DEBUG"),
    },
    loggers: {
      default: {
        level: args.verbose ? "DEBUG" : "INFO",
        handlers: ["default"],
      },
    },
  });
}

const parser = yargs(Deno.args)
  .strict()
  .version("0.1.0")
  .option("v", {
    alias: "verbose",
    describe: "Enable more verbose output",
    type: "boolean",
  })
  .option("h", {
    alias: "help",
  })
  .command("serve", "Start the RSS aggregator server", {}, async () => {
    await serve(port);
  })
  .command(
    "adduser <email> <name>",
    "Add a new user",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "An email address for the new account",
        type: "string",
      });
      yargs.positional("name", {
        describe: "The user's name, or a username",
        type: "string",
      });
    },
    async (args: Arguments & { email: string; name: string }) => {
      const password = await promptSecret("Password: ");
      if (password) {
        let user: User;
        const userData = { email: args.email, name: args.name, password };
        try {
          const response = await fetch(`http://localhost:${port}/user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });
          if (response.status !== 200) {
            throw new Error("Couldn't add user through server");
          }
          user = await response.json();
        } catch {
          openDatabase();
          user = addUser(userData);
        }
        console.log(`Created user ${user.id}`);
      } else {
        console.log("Add cancelled");
      }
    },
  )
  .command(
    "resetpw <email>",
    "Reset a user password",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "An existing account email address",
        type: "string",
      });
    },
    async (args: Arguments & { email: string }) => {
      openDatabase();
      const userId = getUserIdFromEmail(args.email);
      const password = await promptSecret("Password: ");
      if (password) {
        updateUserPassword(userId, password);
        console.log(`Updated password for user ${userId}`);
      } else {
        console.log("Update cancelled");
      }
    },
  )
  .command(
    "login <email>",
    "Authenticate as a given user",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "An existing account email address",
        type: "string",
      });
    },
    async (args: Arguments & { email: string }) => {
      openDatabase();
      const userId = getUserIdFromEmail(args.email);
      const password = await promptSecret("Password: ");
      if (password) {
        if (isUserPassword(userId, password)) {
          console.log("Login successful");
        } else {
          console.log("Invalid password");
        }
      }
    },
  )
  .demandCommand(1, "");

let code = 0;

try {
  await parser.parse();
} catch {
  // ignore errors here; they're handled in .fail
  code = 1;
}

// Forcibly exit because something keeps the process open
Deno.exit(code);
