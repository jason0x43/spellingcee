import { Dispatch, useCallback, useEffect, useState } from 'react';

export interface SharedStateFactory {
  <T>(initialValue: T): {
    useSharedState(): [T, Dispatch<T>];
    current: T;
  };
  <T>(): {
    useSharedState(initialValue: T): [T, Dispatch<T>];
    current: T;
  };
}

export const createSharedState: SharedStateFactory = <T>(initialValue?: T) => {
  const listeners: Dispatch<T>[] = [];
  let sharedState = initialValue;
  let stateInitialized = typeof initialValue !== 'undefined';

  return {
    useSharedState(initialValue?: T): [T, Dispatch<T>] {
      // The first consumer initializes the state for everyone. Initial values
      // from later consumers are ignored.
      const [state, setState] = useState<T>(
        (stateInitialized ? sharedState : initialValue)!
      );

      if (!stateInitialized) {
        stateInitialized = true;
        sharedState = state;
      }

      useEffect(() => {
        listeners.push(setState);
        return () => {
          listeners.splice(listeners.indexOf(setState), 1);
        };
      }, [setState]);

      const setSharedState = useCallback((newState: T) => {
        listeners.forEach((listener) => listener(newState));
        sharedState = newState;
      }, []);

      return [state, setSharedState];
    },

    get current() {
      return sharedState;
    },
  };
};
