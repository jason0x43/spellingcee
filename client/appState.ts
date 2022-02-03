import { Game, GameWord, OtherUser, User } from "../types.ts";
import { Words as WordsType } from "./types.ts";
import { permute } from "../shared/util.ts";

export type AppState = {
  user: User;
  otherUsers: OtherUser[];
  words: WordsType;
  games: Game[];
  game: Game;
  inputDisabled: boolean;
  wordListExpanded: boolean;
  inputValue: string[];
  validWords: string[];
  error: Error | undefined;
  warning: string | undefined;
  letters: string[];
  letterMessage:
    | { type: "normal" | "good" | "bad"; message: string }
    | undefined;
  toastMessage:
    | { type: "normal" | "good" | "bad"; message: string }
    | undefined;
};

type InitProps = {
  user: User;
  otherUsers: OtherUser[];
  words: GameWord[];
  games: Game[];
  game: Game;
};

export function initState(props: InitProps): AppState {
  return {
    user: props.user,
    otherUsers: props.otherUsers,
    inputDisabled: false,
    error: undefined,
    warning: undefined,
    letters: [...props.game.key],
    letterMessage: undefined,
    wordListExpanded: false,
    toastMessage: undefined,
    inputValue: [],
    words: props.words.reduce((allWords, word) => {
      allWords[word.word] = word;
      return allWords;
    }, {} as WordsType) ?? {},
    validWords: [],
    games: props.games,
    game: props.game,
  };
}

export type AppStateAction =
  | { type: "scrambleLetters" }
  | {
    type: "setLetterMessage";
    payload: NonNullable<AppState["letterMessage"]>;
  }
  | { type: "clearLetterMessage" }
  | { type: "clearWarning" }
  | { type: "clearInput" }
  | { type: "setWordListExpanded"; payload: boolean }
  | { type: "enableInput" }
  | { type: "disableInput" }
  | { type: "addInput"; payload: string }
  | { type: "addWord"; payload: GameWord }
  | { type: "addGame"; payload: Game }
  | { type: "activateGame"; payload: { game: Game; words: WordsType } }
  | { type: "deleteInput" };

export function updateState(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case "scrambleLetters":
      return {
        ...state,
        letters: [state.letters[0], ...permute(state.letters.slice(1))],
      };
    case "setLetterMessage":
      return {
        ...state,
        letterMessage: action.payload,
        inputDisabled: true,
      };
    case "clearLetterMessage":
      return { ...state, letterMessage: undefined };
    case "clearWarning":
      return { ...state, warning: undefined };
    case "setWordListExpanded":
      return { ...state, wordListExpanded: action.payload };
    case "addInput":
      return {
        ...state,
        inputValue: [...state.inputValue, action.payload],
      };
    case "enableInput":
      return { ...state, inputDisabled: false };
    case "disableInput":
      return { ...state, inputDisabled: true };
    case "deleteInput":
      return {
        ...state,
        inputValue: state.inputValue.slice(0, state.inputValue.length - 1),
      };
    case "clearInput":
      return { ...state, inputValue: [] };
    case "addWord":
      return {
        ...state,
        words: {
          ...state.words,
          [action.payload.word]: action.payload,
        },
      };
    case "addGame":
      return {
        ...state,
        games: [
          ...state.games,
          action.payload,
        ],
      };
    case "activateGame": {
      const { game, words } = action.payload;
      if (game) {
        return {
          ...state,
          game,
          letters: [...game.key],
          words,
        };
      }
      return state;
    }
    default:
      return state;
  }
}
