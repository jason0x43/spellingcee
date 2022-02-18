export default function initReloader() {
  let socket: WebSocket | undefined;
  let reconnectTimer: number | undefined;
  const url = `${window.location.origin.replace("http", "ws")}/livereload`;

  function connect() {
    if (socket) {
      socket.close();
    }

    socket = new WebSocket(url);
    console.log(`opening websocket ${Date.now()}`);

    socket.addEventListener("open", () => {
      console.log("live-reload socket connected");
    });

    socket.addEventListener("message", (event) => {
      if (event.data === "reloadStyles") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/styles.css";
        const existing = document.head.querySelector('link[rel="stylesheet"]')!;
        existing.replaceWith(link);
      } else if (event.data === "reload") {
        window.location.reload();
      }
    });

    socket.addEventListener("close", () => {
      console.log("reconnecting live-reload socket...");
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        console.log(`starting reconnect timer ${Date.now()}`);
        connect();
      }, 1000);
    });
  }

  connect();
}
