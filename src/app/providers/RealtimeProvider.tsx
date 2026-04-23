// src/app/providers/RealtimeProvider.tsx
/* eslint react-refresh/only-export-components: "off" */
import  {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type RealtimeStatus = "disconnected" | "connecting" | "connected";

type Message = Record<string, unknown> & {
  type?: string;
};

type Subscriber = (payload: any, raw: MessageEvent) => void;

interface RealtimeContextType {
  status: RealtimeStatus;
  connectedAt: number | null;
  lastMessage: Message | null;
  error: string | null;
  send: (payload: Message) => boolean;
  subscribe: (type: string, handler: Subscriber) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

type Props = {
  children: ReactNode;
  /**
   * URL WebSocket complète ou chemin.
   * Exemples :
   *   - "ws://127.0.0.1:8000/ws/"
   *   - "/ws/"
   *   - si rien n’est passé : on utilise VITE_WS_URL ou "/ws/"
   */
  url?: string;
  heartbeatMs?: number;
  autoReconnect?: boolean;
  maxReconnectDelayMs?: number;
};

const DEFAULT_WS_PATH = "/ws/"; // 👈 même route que dans notifications.routing

export default function RealtimeProvider({
  children,
  url,
  heartbeatMs = 25000,
  autoReconnect = true,
  maxReconnectDelayMs = 15000,
}: Props) {
  // 🔸 Pour l’instant, on n’utilise pas de token dans l’URL
  // const { token } = useAuth();

  /**
   * Construction de l’URL WebSocket :
   * 1. prop `url`
   * 2. VITE_WS_URL
   * 3. fallback "/ws/"
   */
  const wsUrl = useMemo(() => {
    const base =
      url ??
      import.meta.env.VITE_WS_URL ??
      DEFAULT_WS_PATH;

    try {
      // Si base est déjà une URL absolue (ws://, wss://, http://...), on la garde
      const u = new URL(base);
      return u.toString();
    } catch {
      // Sinon, on la considère comme un chemin sur le même host
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.host;
      const path = base.startsWith("/") ? base : `/${base}`;
      return `${proto}://${host}${path}`;
    }
  }, [url]);

  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Bus d’événements : type -> Set<handlers>
  const subsRef = useRef<Map<string, Set<Subscriber>>>(new Map());

  const clearHeartbeat = () => {
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const startHeartbeat = () => {
    clearHeartbeat();
    if (!heartbeatMs || heartbeatMs <= 0) return;

    heartbeatRef.current = window.setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      try {
        ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));
      } catch {
        // ignore
      }
    }, heartbeatMs) as unknown as number;
  };

  const cleanupSocket = useCallback(() => {
    clearHeartbeat();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  const dispatchMessage = useCallback((evt: MessageEvent) => {
    let data: Message | null = null;
    try {
      data = JSON.parse(evt.data);
    } catch {
      data = {
        type: "message",
        raw: evt.data as unknown as string,
      } as unknown as Message;
    }

    setLastMessage(data);

    const type = (data && data.type) || "*";

    const typed = subsRef.current.get(type);
    const all = subsRef.current.get("*");

    if (typed) {
      typed.forEach((fn) => {
        try {
          fn(data, evt);
        } catch {
          // ignore
        }
      });
    }

    if (all) {
      all.forEach((fn) => {
        try {
          fn(data, evt);
        } catch {
          // ignore
        }
      });
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!autoReconnect) return;
    if (isUnmountedRef.current) return;

    const attempt = reconnectAttemptRef.current++;
    const delay = Math.min(1000 * 2 ** attempt, maxReconnectDelayMs);

    if (reconnectRef.current !== null) {
      window.clearTimeout(reconnectRef.current);
    }

    reconnectRef.current = window.setTimeout(() => {
      openSocket();
    }, delay) as unknown as number;
  }, [autoReconnect, maxReconnectDelayMs]);

  const openSocket = useCallback(() => {
    if (!wsUrl) {
      setStatus("disconnected");
      setError("Aucune URL WebSocket valide.");
      return;
    }

    cleanupSocket();
    setStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) return;
        setStatus("connected");
        setConnectedAt(Date.now());
        reconnectAttemptRef.current = 0;
        startHeartbeat();
      };

      ws.onmessage = (evt) => {
        if (isUnmountedRef.current) return;
        dispatchMessage(evt);
      };

      ws.onerror = () => {
        if (isUnmountedRef.current) return;
        setError("Erreur WebSocket");
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        setStatus("disconnected");
        clearHeartbeat();
        scheduleReconnect();
      };
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setStatus("disconnected");
      scheduleReconnect();
    }
  }, [cleanupSocket, dispatchMessage, scheduleReconnect, wsUrl]);

  const send = useCallback<RealtimeContextType["send"]>((payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, []);

  const subscribe = useCallback<RealtimeContextType["subscribe"]>(
    (type, handler) => {
      const map = subsRef.current;
      if (!map.has(type)) {
        map.set(type, new Set());
      }
      const set = map.get(type)!;
      set.add(handler);

      return () => {
        const s = map.get(type);
        if (!s) return;
        s.delete(handler);
        if (s.size === 0) map.delete(type);
      };
    },
    []
  );

  // (Re)connexion quand l’URL WS change
  useEffect(() => {
    if (!wsUrl) {
      setStatus("disconnected");
      return;
    }

    openSocket();

    return () => {
      if (reconnectRef.current !== null) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      cleanupSocket();
    };
  }, [wsUrl, openSocket, cleanupSocket]);

  // Cleanup global à l’unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      if (reconnectRef.current !== null) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      cleanupSocket();
      clearHeartbeat();
      subsRef.current.clear();
    };
  }, [cleanupSocket]);

  const value = useMemo<RealtimeContextType>(
    () => ({
      status,
      connectedAt,
      lastMessage,
      error,
      send,
      subscribe,
    }),
    [status, connectedAt, lastMessage, error, send, subscribe]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

/** Hook pratique pour consommer le contexte */
export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime() must be used within <RealtimeProvider>");
  }
  return ctx;
}
