import { Provider, React, ReactDOM } from "./deps.ts";
import App from "./App.tsx";
import { createStore } from "./store/mod.ts";

const store = createStore(globalThis.__PRELOADED_STATE__);

ReactDOM.hydrate(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);

delete globalThis.__PRELOADED_STATE__;
