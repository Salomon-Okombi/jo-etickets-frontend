// src/realtime/events.ts
export type RealtimeEvent =
  | { type: "tickets:update"; payload: unknown }
  | { type: "offers:update"; payload: unknown }
  | { type: "orders:update"; payload: unknown }
  | { type: "stats:update"; payload: unknown }
  | { type: "connection:open" }
  | { type: "connection:close"; payload?: { code?: number; reason?: string } }
  | { type: "connection:error"; payload?: unknown }
  | { type: string; payload?: unknown }; // extensible

type Listener = (event: RealtimeEvent) => void;

class EventBus {
  private listeners = new Set<Listener>();

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.off(fn);
  }

  off(fn: Listener) {
    this.listeners.delete(fn);
  }

  emit(event: RealtimeEvent) {
    for (const fn of this.listeners) {
      try {
        fn(event);
      } catch {
        // on isole les erreurs d'un listener
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
