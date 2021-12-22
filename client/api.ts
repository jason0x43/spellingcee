import { GameWord, User } from "../types.ts";

export async function setActiveGame(
  data: { userId: number; gameId: number },
) {
  const response = await fetch("/user", {
    method: "PATCH",
    body: JSON.stringify({ currentGame: data.gameId }),
  });
  if (response.status >= 400) {
    throw new Error(`Error setting active game: ${response.statusText}`);
  }
}

export async function getWords(gameId: number) {
  const response = await fetch(`/games/${gameId}/words`);
  if (response.status >= 400) {
    throw new Error(`Error getting words: ${response.statusText}`);
  }

  return response.json();
}

export async function addWord(
  data: { word: string; gameId: number; userId: number },
): Promise<GameWord> {
  const response = await fetch(`/games/${data.gameId}/words`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ word: data.word, user: data.userId }),
  });

  if (response.status >= 400) {
    throw new Error(`Error setting active game: ${response.statusText}`);
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<User> {
  console.trace("logging in...");
  const response = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  console.log("got response:", response);

  if (response.status >= 400) {
    throw new Error(`Error logging in: ${response.statusText}`);
  }

  return await response.json();
}

export async function getDefinition(word: string): Promise<string[]> {
  const params = new URLSearchParams();
  params.set("word", word);
  const response = await fetch(`/definition?${params}`);
  const body = await response.json();

  if (response.status >= 400) {
    throw new Error(body.error);
  }

  return body;
}
