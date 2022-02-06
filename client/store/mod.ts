import {
  combineReducers,
  configureStore,
  Middleware,
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "../deps.ts";
import user from "./user.ts";
import game from "./game.ts";
import ui from "./ui.ts";

export const rootReducer = combineReducers({
  user,
  game,
  ui,
});

export type AppState = ReturnType<typeof rootReducer>;

const errorLogoutMiddlware: Middleware<void, AppState> = () =>
  (next) =>
    (action) => {
      console.log("handling", action);
      next(action);
    };

export function createStore(preloadedState?: Partial<AppState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(errorLogoutMiddlware),
    preloadedState: preloadedState,
  });
}

type StoreType = ReturnType<typeof createStore>;
export type AppDispatch = StoreType["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

declare global {
  // deno-lint-ignore no-var
  var __PRELOADED_STATE__: AppState | undefined;
  // deno-lint-ignore no-var
  var __DEV__: boolean | undefined;
}
