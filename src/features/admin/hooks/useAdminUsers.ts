// src/features/admin/hooks/useAdminUsers.ts
import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/axiosClient";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  type_compte?: string;
  statut?: string;
  derniere_connexion?: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function useAdminUsers() {
  const [list, setList] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Paginated<AdminUser>>("/admin/users/");
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
