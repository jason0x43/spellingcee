import { Dispatch, useCallback, useState } from 'react';
import { AppState, appStateKey, init } from './state';

const storage = window.localStorage;

export function useAppState(): [AppState, Dispatch<AppState>] {
  const [state, setState] = useState<AppState>(init());
  const setAppState = useCallback((newState: AppState) => {
    storage.setItem(appStateKey, JSON.stringify(newState));
    setState(newState);
  }, [setState]);
  return [state, setAppState];
}
