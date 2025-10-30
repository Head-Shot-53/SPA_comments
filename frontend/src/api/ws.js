let socket = null;
let reconnectAttempts = 0;
let heartbeatTimer = null;
const listeners = new Set();

function makeWsUrl(path = "/ws/comments/") {
  const proto = location.protocol === "https:" ? "wss://" : "ws://";
  return proto + location.host + path;
}

function startHeartbeat() {
  stopHeartbeat();
  // daphne/nginx , коли є активність — пінгуємо раз на 25с
  heartbeatTimer = setInterval(() => {
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping", t: Date.now() }));
      }
    } catch {}
  }, 25000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function connectWS() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  const url = makeWsUrl();
  socket = new WebSocket(url);

  socket.onopen = () => {
    reconnectAttempts = 0;
    startHeartbeat();
    // console.debug("WS connected:", url);
  };

  socket.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      // ігноруємо наші ping-и, якщо бек віддзеркалює їх
      if (data?.type === "pong" || data?.type === "ping") return;
      listeners.forEach(fn => fn(data));
    } catch {
      // некоректний JSON — пропускаємо
    }
  };

  socket.onerror = () => {
    // console.warn("WS error");
  };

  socket.onclose = () => {
    stopHeartbeat();
    // експоненційний backoff із максимумом 5с
    const delay = Math.min(5000, 500 * Math.pow(2, reconnectAttempts++));
    setTimeout(connectWS, delay);
  };

  // авто-reconnect після повернення у фокус/онлайн
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") connectWS();
  });
  window.addEventListener("online", connectWS);

  // акуратне закриття при закритті вкладки
  window.addEventListener("beforeunload", () => {
    try { socket?.close(1000, "unload"); } catch {}
  });

  return socket;
}

export function onWS(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// якщо десь потрібно відправити власне повідомлення
export function sendWS(payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(typeof payload === "string" ? payload : JSON.stringify(payload));
  }
}
