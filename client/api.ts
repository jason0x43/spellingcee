import { Game, GameWord, OtherUser, User, Words } from "../types.ts";

/**
 * An error thrown when a response indicates failure
 */
export class ResponseError extends Error {
  private _status: number;
  private _error: string | undefined;
  private _details: Record<string, unknown> | undefined;

  static async create(
    response: Response,
    action?: string,
  ): Promise<ResponseError> {
    try {
      const text = await response.text();
      const obj = JSON.parse(text);
      const { error, ...details } = obj;
      return new ResponseError(
        action,
        response.status,
        response.statusText,
        error,
        details
      );
    } catch {
      return new ResponseError(
        action,
        response.status,
        response.statusText,
        undefined
      );
    }
  }

  constructor(
    action: string | undefined,
    status: number,
    statusText: string,
    error: string | undefined,
    details?: Record<string, unknown>,
  ) {
    super(action ? `Error while ${action}` : statusText);
    this._status = status;
    this._error = error;
    this._details = details;
  }

  get status() {
    return this._status;
  }

  get error() {
    return this._error;
  }

  get details() {
    return this._details;
  }
}

/**
 * Throw an error if a response has a failing status
 */
async function assertSuccess(response: Response, action?: string) {
  if (response.status >= 400) {
    console.log('response status was bad');
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

/**
 * Create a RequestInit object for a given body and init options
 */
function createRequest(body: unknown, options: RequestInit): RequestInit {
  return {
    ...options,
    headers: {
      "Content-Type": typeof body === "string"
        ? "text/plain"
        : "application/json",
      ...options.headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

/**
 * GET data from a given path
 */
async function get<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, options);
  await assertSuccess(response, `GETting ${path}`);
  return await response.json() as T;
}

/**
 * PATCH a given path
 */
async function patch<T = unknown>(
  path: string,
  body: unknown,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    path,
    createRequest(body, {
      ...options,
      method: "PATCH",
    }),
  );
  await assertSuccess(response, `PATCHing ${path}`);
  return await response.json() as T;
}

/**
 * POST some data to a given path
 */
async function post<T = unknown>(
  path: string,
  body: unknown,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    path,
    createRequest(body, {
      ...options,
      method: "POST",
    }),
  );
  await assertSuccess(response, `POSTing to ${path}`);
  return await response.json() as T;
}

/**
 * Get the games for the current user
 */
export async function getGames(): Promise<Game[]> {
  return await get<Game[]>(`/games`);
}

/**
 * Get the other users
 */
export async function getOtherUsers(): Promise<OtherUser[]> {
  return await get<OtherUser[]>(`/users`);
}

/**
 * Get the words for a given game
 */
export async function getWords(gameId: number): Promise<Words> {
  return await get<Words>(`/games/${gameId}/words`);
}

/**
 * Add a new word to a game for the current user
 */
export async function addWord(
  data: { word: string; gameId: number },
): Promise<GameWord> {
  return await post<GameWord>(`/games/${data.gameId}/words`, {
    word: data.word,
  });
}

/**
 * Login a user by username
 */
export async function login(username: string, password: string): Promise<User> {
  return await post<User>("/login", { username, password });
}

/**
 * Logout the currently logged in user
 */
export async function logout(): Promise<void> {
  return await get("/logout");
}

/**
 * Get the definition for a word
 */
export async function getDefinition(word: string): Promise<string[]> {
  const params = new URLSearchParams();
  params.set("word", word);
  return await get<string[]>(`/definition?${params}`);
}

/**
 * Create a new game for the current user
 */
export async function createGame(): Promise<Game> {
  return await get<Game>("/create-game");
}

/**
 * Set the active game for the current user
 */
export async function setActiveGame(gameId: number): Promise<User> {
  return await patch<User>("/user", { currentGame: gameId });
}

