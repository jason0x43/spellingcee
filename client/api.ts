export async function setActiveGame(
  request: { userId: number; gameId: number },
) {
  const response = await fetch("/user", {
    method: "PATCH",
    body: JSON.stringify({ currentGame: request.gameId }),
  });
  if (response.status >= 400) {
    throw new Error(`Error setting active game: ${response.statusText}`);
  }
}

export async function getWords(gameId: number) {
  const response = await fetch(`/games/${gameId}/words`);
  return response.json();
}
