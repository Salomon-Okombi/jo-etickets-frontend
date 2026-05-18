// src/api/events.api.ts
import api from "@/api/axiosClient";

/* =========================
   TYPES
========================= */

export type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

export interface Event {
  id: number;
  nom_evenement: string;
  discipline?: string;
  lieu?: string;
  date_debut: string;   // ISO datetime
  date_fin: string;     // ISO datetime
  description_courte?: string;
  description_longue?: string;
  image_url?: string | null;
  prix_base?: string;
  statut: EventStatus;
}

/* =========================
   PAGINATION DRF
========================= */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* =========================
   PUBLIC API (LECTURE SEULE)
========================= */

export async function listEvents(
  params?: Record<string, any>
): Promise<Paginated<Event>> {
  const { data } = await api.get<Paginated<Event>>(
    "/evenements/",
    { params }
  );
  return data;
}

export async function getEvent(id: number): Promise<Event> {
  const { data } = await api.get<Event>(`/evenements/${id}/`);
  return data;
}

/* =========================
   ADMIN API (CRUD)
========================= */

export async function listAdminEvents(
  params?: Record<string, any>
): Promise<Paginated<Event>> {
  const { data } = await api.get<Paginated<Event>>(
    "/evenements/admin/",
    { params }
  );
  return data;
}

export async function getAdminEvent(id: number): Promise<Event> {
  const { data } = await api.get<Event>(
    `/evenements/admin/${id}/`
  );
  return data;
}

export async function createEvent(
  formData: FormData
): Promise<Event> {
  const { data } = await api.post<Event>(
    "/evenements/admin/",
    formData
  );
  return data;
}

export async function updateEvent(
  id: number,
  formData: FormData
): Promise<Event> {
  const { data } = await api.patch<Event>(
    `/evenements/admin/${id}/`,
    formData
  );
  return data;
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/evenements/admin/${id}/`);
}