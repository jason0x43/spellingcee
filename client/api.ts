import { Game, GameWord, User } from "../types.ts";

/**
 * An error thrown when a response indicates failure
 */
export class ResponseError<T = unknown> extends Error {
  private _status: number;
  private _body: T;

  static async create<B = unknown>(
    response: Response,
    action?: string,
  ): Promise<ResponseError<B>> {
    let body: unknown;
    try {
      body = await response.text();
      body = JSON.parse(body as string);
    } catch (error) {
      console.warn("Error readin body", error);
      // ignore, just use the original text
    }

    return new ResponseError(
      action,
      response.status,
      response.statusText,
      body as B,
    );
  }

  constructor(
    action: string | undefined,
    status: number,
    statusText: string,
    body: T,
  ) {
    super(action ? `Error while ${action}` : statusText);
    this._status = status;
    this._body = body;
  }

  get status() {
    return this._status;
  }

  get body() {
    return this._body;
  }
}

/**
 * Throw an error if a response has a failing status
 */
async function assertSuccess(response: Response, action?: string) {
  if (response.status >= 400) {
    throw await ResponseError.create(response, action);
  }
}

/**
 * Indicate if the given object is a ResponseError
 */
export function isResponseError(error: unknown): error is ResponseError {
  return error !== undefined && error !== null && typeof error === "object" &&
    error instanceof ResponseError;
}

export async function setActiveGame(
  data: { userId: number; gameId: number },
) {
  const response = await fetch("/user", {
    method: "PATCH",
    body: JSON.stringify({ currentGame: data.gameId }),
  });
  assertSuccess(response, "setting active game");
}

export async function getWords(gameId: number) {
  const response = await fetch(`/games/${gameId}/words`);
  assertSuccess(response, "getting words");
  return response.json();
}

export async function addWord(
  data: { word: string; gameId: number; userId: number },
): Promise<GameWord> {
  const response = await fetch(`/games/${data.gameId}/words`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: data.word, user: data.userId }),
  });
  assertSuccess(response, "adding word");
  return response.json();
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assertSuccess(response, "logging in");
  return response.json();
}

export async function getDefinition(word: string): Promise<string[]> {
  const params = new URLSearchParams();
  params.set("word", word);
  const response = await fetch(`/definition?${params}`);
  assertSuccess(response, "getting definition");
  return response.json();
}

export async function createGame(): Promise<Game> {
  const response = await fetch("/create-game");
  assertSuccess(response, "creating game");
  return response.json();
}
