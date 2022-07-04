import { getContext, setContext } from 'svelte';

type AppContext = {
  getRoot(): HTMLElement;
};

const appContext = Symbol('app');

export function getAppContext() {
  return getContext<AppContext>(appContext);
}

export function setAppContext(value: AppContext) {
  return setContext<AppContext>(appContext, value);
}
