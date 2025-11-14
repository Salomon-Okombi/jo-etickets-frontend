// src/realtime/sse.ts
import { eventBus, type RealtimeEvent } from "./events";

export interface SSEClientOptions {
  url: string;              // ex: `${API_BASE}/realtime/sse/`
  token?: string | null;    // JWT si nécessaire
  maxDelayMs?: number;      // backoff max (par défaut 15s)
}

export function createSSEClient({ url, token, maxDelayMs = 15000 }: SSEClientOptions) {
  let es: EventSource | null = null;
  let closed = false;
  let retries = 0;

  const connect = () => {
    if (closed) return;

    // Auth via header SSE n’est pas standard : on passe le token en query
    const q = new URL(url);
    if (token) q.searchParams.set("token", token);

    es = new EventSource(q.toString(), { withCredentials: false });

    es.onopen = () => {
      retries = 0;
      eventBus.emit({ type: "connection:open" });
    };

    es.onerror = () => {
      eventBus.emit({ type: "connection:error" });
      if (!closed) {
        es?.close();
        es = null;
        scheduleReconnect();
      }
    };

    es.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        // On attend un objet { type, payload }
        const evt: RealtimeEvent =
          typeof parsed?.type === "string"
            ? { type: parsed.type, payload: parsed.payload }
            : { type: "message", payload: parsed };
        eventBus.emit(evt);
      } catch {
        // message texte brut
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

  const disconnect = () => {
    closed = true;
    if (es) {
      es.close();
      es = null;
    }
    eventBus.emit({ type: "connection:close" });
  };

  connect();

  return { disconnect };
}
