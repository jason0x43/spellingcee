export interface Game {
  id: string;
  letters: string[];
  words: string[];
  totalWords: number;
  score: number;
  maxScore: number;
  difficulty: number;
  lastUpdated: number;
  lastPlayed?: number;
}

export interface Games {
  [id: string]: Game;
}

export interface Profile {
  userId: string;
  name: string;
}

export interface User extends Profile {
  email: string;
}
