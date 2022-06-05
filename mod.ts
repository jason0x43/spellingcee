import { Arguments, log, Yargs, yargs } from "./deps.ts";
import { serve } from "./server/mod.ts";
import {
  addUser,
  getUserIdFromUsername,
  isUserPassword,
  openDatabase,
  updateUserPassword,
} from "./server/database/mod.ts";
import { promptSecret } from "./util.ts";
import { User } from "./server/database/types.ts";
import { setUserIsAdmin } from "./server/database/users.ts";

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
  .scriptName("spellingcee")
  .option("v", {
    alias: "verbose",
    describe: "Enable more verbose output",
    type: "boolean",
  })
  .option("h", {
    alias: "help",
  })
  .middleware([configureLogger])
  .command("serve", "Start the RSS aggregator server", {}, async () => {
    await serve(port);
  })
  .command(
    "adduser <username> <email> [role]",
    "Add a new user",
    (yargs: Yargs) => {
      yargs.positional("username", {
        describe: "The user's name, or a username",
        type: "string",
      });
      yargs.positional("email", {
        describe: "An email address for the new account",
        type: "string",
      });
      yargs.positional("role", {
        describe: "The user's role, 'admin' or 'user'",
        type: "string",
      });
    },
    async (
      args: Arguments & { email: string; username: string; role?: string },
    ) => {
      const password = await promptSecret("Password: ");
      if (password) {
        let user: User;
        const userData = {
          email: args.email,
          username: args.username,
          isAdmin: args.role === "admin",
          password,
        };
        try {
          const response = await fetch(`http://localhost:${port}/users`, {
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
    "resetpw <username>",
    "Reset a user password",
    (yargs: Yargs) => {
      yargs.positional("username", {
        describe: "An existing account username",
        type: "string",
      });
    },
    async (args: Arguments & { username: string }) => {
      openDatabase();
      const userId = getUserIdFromUsername(args.username);
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
    "setrole <username> <role>",
    "Set a user's role",
    (yargs: Yargs) => {
      yargs.positional("username", {
        describe: "An existing account username",
        type: "string",
      });
      yargs.positional("role", {
        describe: "A user role, 'admin' or 'user'",
        type: "string",
      });
    },
    async (args: Arguments & { username: string; role: string }) => {
      const role = args.role;

      try {
        const params = new URLSearchParams();
        params.set("username", args.username);

        const userResp = await fetch(
          `http://localhost:${port}/users?${params}`,
        );
        if (userResp.status !== 200) {
          console.warn(`Response: ${userResp.status}`);
          throw new Error(`Unknown user "${args.username}"`);
        }
        const user = await userResp.json();

        const response = await fetch(
          `http://localhost:${port}/users/${user.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isAdmin: role === "admin" }),
          },
        );
        if (response.status !== 200) {
          throw new Error("Couldn't add user through server");
        }
      } catch (error) {
        console.log(error);
        openDatabase();
        const userId = getUserIdFromUsername(args.username);
        setUserIsAdmin(userId, role === "admin");
        console.log(`Updated role for user ${userId}`);
      }
    },
  )
  .command(
    "login <username>",
    "Authenticate as a given user",
    (yargs: Yargs) => {
      yargs.positional("username", {
        describe: "An existing account username",
        type: "string",
      });
    },
    async (args: Arguments & { username: string }) => {
      openDatabase();
      const userId = getUserIdFromUsername(args.username);
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
  .command(
    "session [-r] <username>",
    "Get or remove a user session",
    (yargs: Yargs) => {
      yargs.option("remove", {
        alias: "r",
        describe: "Remove the session",
        type: "boolean",
      });
      yargs.positional("username", {
        describe: "An existing account username",
        type: "string",
      });
    },
    async (args: Arguments & { username: string; remove?: boolean }) => {
      try {
        const params = new URLSearchParams();
        params.set("username", args.username);

        const resp = await fetch(
          `http://localhost:${port}/sessions?${params}`,
        );
        if (resp.status !== 200) {
          console.warn(`Response: ${resp.status}`);
          throw new Error(`No session for "${args.username}"`);
        }
        const session = await resp.json();

        if (!args.remove) {
          console.log(session);
        } else {
          const response = await fetch(
            `http://localhost:${port}/sessions?${params}`,
            { method: "DELETE" },
          );

          if (response.status !== 200) {
            throw new Error(`Couldn't remove session for ${args.username}`);
          }
        }
      } catch (error) {
        console.log(error);
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
