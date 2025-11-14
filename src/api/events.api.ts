// src/api/events.api.ts
import { api } from "./axiosClient";

/* ------------------------------------------------------------------
   🧱 Types
------------------------------------------------------------------ */
export interface Event {
  id: number;
  nom: string;
  discipline_sportive: string;
  date_evenement: string; // ISO (YYYY-MM-DD ou datetime selon ton modèle)
  lieu_evenement: string;
  description: string | null;
}

export type CreateEventPayload = Omit<Event, "id">;
export type UpdateEventPayload = Partial<CreateEventPayload>;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ------------------------------------------------------------------
   ⚙️ Endpoints : /api/evenements/
   - GET    /evenements/              -> listEvents
   - GET    /evenements/:id/          -> getEvent
   - POST   /evenements/              -> createEvent (auth admin)
   - PUT    /evenements/:id/          -> replaceEvent (admin)
   - PATCH  /evenements/:id/          -> updateEvent (admin)
   - DELETE /evenements/:id/          -> deleteEvent (admin)
------------------------------------------------------------------ */

/** Liste paginée des événements (publique) */
export async function listEvents(params?: {
  page?: number;
  search?: string;   // si tu ajoutes un SearchFilter côté DRF
  ordering?: string; // si tu ajoutes OrderingFilter côté DRF
}): Promise<Paginated<Event>> {
  const { data } = await api.get<Paginated<Event>>("/evenements/", { params });
  return data;
}

/** Détail d'un événement (public) */
export async function getEvent(id: number): Promise<Event> {
  const { data } = await api.get<Event>(`/evenements/${id}/`);
  return data;
}

/** Création d'un événement (requiert un admin authentifié) */
export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const { data } = await api.post<Event>("/evenements/", payload);
  return data;
}

/** Mise à jour complète (remplace tout l’objet — admin) */
export async function replaceEvent(id: number, payload: CreateEventPayload): Promise<Event> {
  const { data } = await api.put<Event>(`/evenements/${id}/`, payload);
  return data;
}

/** Mise à jour partielle (modifie uniquement les champs transmis — admin) */
export async function updateEvent(id: number, payload: UpdateEventPayload): Promise<Event> {
  const { data } = await api.patch<Event>(`/evenements/${id}/`, payload);
  return data;
}

/** Suppression d'un événement (admin) */
export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/evenements/${id}/`);
}
