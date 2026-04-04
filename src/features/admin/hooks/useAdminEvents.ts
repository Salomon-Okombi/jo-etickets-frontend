// src/features/admin/hooks/useAdminEvents.ts
import { useCallback, useEffect, useState } from "react";
import  api  from "@/api/axiosClient";

export interface AdminEvent {
  id: number;
  nom_evenement: string;
  date_evenement: string;
  lieu: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function useAdminEvents() {
  const [list, setList] = useState<Paginated<AdminEvent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Paginated<AdminEvent>>("/admin/events/");
      setList(data);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, loading, error, reload };
}
