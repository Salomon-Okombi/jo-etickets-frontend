// src/app/providers/RealtimeProvider.tsx
/*import {
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
  url?: string;
  heartbeatMs?: number;
  autoReconnect?: boolean;
  maxReconnectDelayMs?: number;
};

const DEFAULT_WS_PATH = "/ws/";

// FLAG GLOBAL
const REALTIME_ENABLED = import.meta.env.VITE_REALTIME_ENABLED !== "false";

export default function RealtimeProvider({
  children,
  url,
  heartbeatMs = 25000,
  autoReconnect = true,
  maxReconnectDelayMs = 15000,
}: Props) {

  const wsUrl = useMemo(() => {
    if (!REALTIME_ENABLED) return null;

    const base =
      url ??
      import.meta.env.VITE_WS_URL ??
      DEFAULT_WS_PATH;

    try {
      const u = new URL(base);
      return u.toString();
    } catch {
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
      ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));
    }, heartbeatMs) as unknown as number;
  };

  const cleanupSocket = useCallback(() => {
    clearHeartbeat();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const dispatchMessage = useCallback((evt: MessageEvent) => {
    let data: Message | null;

    try {
      data = JSON.parse(evt.data);
    } catch {
      data = { type: "message", raw: evt.data } as Message;
    }

    setLastMessage(data);

    const type = data?.type || "*";

    subsRef.current.get(type)?.forEach((fn) => fn(data, evt));
    subsRef.current.get("*")?.forEach((fn) => fn(data, evt));
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!autoReconnect || !REALTIME_ENABLED) return;
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
    if (!REALTIME_ENABLED || !wsUrl) {
      setStatus("disconnected");
      return;
    }

    cleanupSocket();

    setStatus("connecting");
    setError(null);

    try {
      /*const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) return;
        setStatus("connected");
        setConnectedAt(Date.now());
        reconnectAttemptRef.current = 0;
        startHeartbeat();
      };

      ws.onmessage = dispatchMessage;

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

  const send = useCallback((payload: Message) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const subscribe = useCallback((type: string, handler: Subscriber) => {
    const map = subsRef.current;
    if (!map.has(type)) map.set(type, new Set());

    const set = map.get(type)!;
    set.add(handler);

    return () => {
      set.delete(handler);
      if (set.size === 0) map.delete(type);
    };
  }, []);

  useEffect(() => {
    if (!REALTIME_ENABLED) {
      setStatus("disconnected");
      return;
    }

    openSocket();

    return () => {
      if (reconnectRef.current !== null) {
        window.clearTimeout(reconnectRef.current);
      }
      cleanupSocket();
    };
  }, [openSocket, cleanupSocket]);

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      cleanupSocket();
      clearHeartbeat();
      subsRef.current.clear();
    };
  }, [cleanupSocket]);

  const value = useMemo(
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

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}*/
