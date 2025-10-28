let socket;
const listeners = new Set();

export function connectWS() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }
  socket = new WebSocket("ws://localhost:8000/ws/comments/");
  socket.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      listeners.forEach((fn) => fn(data));
    } catch {}
  };
  socket.onclose = () => setTimeout(connectWS, 2000); 
  return socket;
}
export function onWS(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
