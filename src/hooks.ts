import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, appStateKey, init } from './state';

const storage = window.localStorage;
const listeners: { [key: string]: Dispatch<AppState> | undefined } = {};

function updateAppState(newState: AppState) {
  for (const id of Object.keys(listeners)) {
    const listener = listeners[id];
    if (listener) {
      listener(newState);
    }
  }
}

export function useAppState(): [AppState, Dispatch<AppState>] {
  const [state, setState] = useState<AppState>(init());

  // Create an ID for this listener
  const idRef = useRef<string>();
  if (idRef.current == null) {
    idRef.current = `${Math.random()}`;
  }
  const id = idRef.current!;

  // Create a state updater that, when called, will update local storage and
  // notify any other registered components
  const setAppState = useCallback((newState: AppState) => {
    updateAppState(newState);
    storage.setItem(appStateKey, JSON.stringify(newState));
  }, []);

  // Keep track of this component's real state update method
  useEffect(() => {
    listeners[id] = setState;
    return () => listeners[id] = undefined;
  }, [id, setState]);

  return [state, setAppState];
}
