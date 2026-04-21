//src/hooks/useRealtimes.ts
import { useContext } from "react";
import { RealtimeContext } from "@/app/providers/RealtimeProvider";

/**
 * Hook d’accès au bus temps réel (publish/subscribe).
 */
export default function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime() doit être utilisé dans <RealtimeProvider>.");
  }
  return ctx;
}
