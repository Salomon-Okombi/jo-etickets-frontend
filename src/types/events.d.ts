export type EventStatus = "A_VENIR" | "EN_COURS" | "TERMINE" | string;

export interface Event {
  id: number;
  nom: string;
  discipline_sportive: string;
  date_evenement: string;      // ISO "YYYY-MM-DD"
  lieu_evenement: string;
  description?: string | null;
  statut: EventStatus;
  date_creation?: string;      // ISO datetime
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EventListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export type EventCreatePayload = Omit<Event, "id" | "date_creation">;
export type EventUpdatePayload = Partial<EventCreatePayload>;