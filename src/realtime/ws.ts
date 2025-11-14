// src/realtime/ws.ts
import { eventBus, type RealtimeEvent } from "./events";

export interface WSClientOptions {
  url: string;             // ex: `wss://domain.tld/ws/`
  token?: string | null;   // JWT si nécessaire (query)
  maxDelayMs?: number;     // backoff max (par défaut 15s)
  pingIntervalMs?: number; // ping périodique (par défaut 25s)
}

export function createWSClient({
  url,
  token,
  maxDelayMs = 15000,
  pingIntervalMs = 25000,
}: WSClientOptions) {
  let ws: WebSocket | null = null;
  let closed = false;
  let retries = 0;
  let pingTimer: number | null = null;

  const connect = () => {
    if (closed) return;

    const q = new URL(url);
    if (token) q.searchParams.set("token", token);

    ws = new WebSocket(q.toString());

    ws.onopen = () => {
      retries = 0;
      eventBus.emit({ type: "connection:open" });
      startPing();
    };

    ws.onclose = (ev) => {
      stopPing();
      eventBus.emit({ type: "connection:close", payload: { code: ev.code, reason: ev.reason } });
      if (!closed) scheduleReconnect();
    };

    ws.onerror = () => {
      eventBus.emit({ type: "connection:error" });
    };

    ws.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        const evt: RealtimeEvent =
          typeof parsed?.type === "string"
            ? { type: parsed.type, payload: parsed.payload }
            : { type: "message", payload: parsed };
        eventBus.emit(evt);
      } catch {
        eventBus.emit({ type: "message", payload: msg.data });
      }
    };
  };

  const scheduleReconnect = () => {
    retries += 1;
    const delay = Math.min(maxDelayMs, 500 * 2 ** (retries - 1));
    setTimeout(() => {
      if (!closed) connect();
    }, delay);
  };

  const startPing = () => {
    stopPing();
    pingTimer = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
      }
    }, pingIntervalMs);
  };

  const stopPing = () => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  };

  const send = (event: RealtimeEvent) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
      return true;
    }
    return false;
  };

  const disconnect = () => {
    closed = true;
    stopPing();
    if (ws) {
      ws.close();
      ws = null;
    }
    eventBus.emit({ type: "connection:close" });
  };

  connect();

  return { send, disconnect };
}
