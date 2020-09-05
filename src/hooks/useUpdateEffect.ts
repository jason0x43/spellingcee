import { EffectCallback, DependencyList, useEffect, useRef } from 'react';

export default function useUpdateEffect(callback: EffectCallback, deps: DependencyList) {
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    return callback();
  }, deps);
}
