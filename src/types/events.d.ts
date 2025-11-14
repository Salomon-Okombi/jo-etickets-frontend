export interface Event {
  id: number;
  nom: string;
  discipline_sportive: string;
  date_evenement: string;       // ISO date/datetime
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
