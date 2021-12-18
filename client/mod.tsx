/// <reference lib="dom" />

import { Provider, React, ReactDOM } from "./deps.ts";
import App from "./App.tsx";
import store, { loadUser } from "./store.ts";

store.dispatch(loadUser());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);
