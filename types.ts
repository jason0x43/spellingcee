export interface AppState {
  userId: number;
}

export interface UserConfig {
  latestGame: number;
}

export interface User {
  /** A unique ID */
  id: number;
  /** The user's name */
  name: string;
  /** The user's email address */
  email: string;
  /** User settings */
  config?: UserConfig;
}

export interface LoginRequest {
  email: string;
  password: string;
}
