// src/api/events.api.ts
import api from "./axiosClient";

export interface Event {
  id: number;
  nom_evenement: string;
  discipline: string;
  date_evenement: string;
  lieu: string;
  description_courte: string;
  description_longue: string;
  image_url: string;
  statut: "BROUILLON" | "PUBLIE" | "ARCHIVE";
}

export type CreateEventPayload = Omit<Event, "id" | "image_url">;
export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ===== PUBLIC ===== */

export async function listEvents(params?: any): Promise<Paginated<Event>> {
  const { data } = await api.get("/evenements/", { params });
  return data;
}

export async function getEvent(id: number): Promise<Event> {
  const { data } = await api.get(`/evenements/${id}/`);
  return data;
}

/* ===== ADMIN ===== */

export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const { data } = await api.post("/admin/evenements/", payload);
  return data;
}

export async function updateEvent(id: number, payload: UpdateEventPayload): Promise<Event> {
  const { data } = await api.patch(`/admin/evenements/${id}/`, payload);
  return data;
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/admin/evenements/${id}/`);
}
