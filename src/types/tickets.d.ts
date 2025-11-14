export type TicketStatus = "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE";

export interface Ticket {
  id: number;
  utilisateur: number;
  offre: number;
  numero_billet: string;
  date_achat: string;              // ISO datetime
  cle_achat?: string;
  cle_finale: string;
  qr_code: string;                 // base64 PNG
  prix_paye: string | number;      // selon sérialiseur
  statut: TicketStatus;
  date_utilisation: string | null; // ISO datetime
  lieu_utilisation: string | null;
}

export interface ValidateByKeyPayload {
  cle_finale: string;
  lieu_utilisation?: string;
  date_utilisation?: string;       // ISO datetime
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
