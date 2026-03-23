export type EventStatus = "A_VENIR" | "EN_COURS" | "TERMINE";

export type PublicEvenementListItem = {
  id: number;
  titre: string;
  slug: string;
  lieu: string;
  date_debut: string;
  date_fin?: string | null;
  statut: EventStatus;
  image_url?: string | null;
};

export type PublicOffre = {
  id: number;
  nom: string;
  description?: string;
  prix: string; // decimal Django -> string
  devise: string;
  statut: "DISPONIBLE" | "INDISPONIBLE" | "DESACTIVE";
  restant: number;
  est_disponible: boolean;
};

export type PublicEvenementDetail = {
  id: number;
  titre: string;
  slug: string;
  description?: string;
  lieu: string;
  date_debut: string;
  date_fin?: string | null;
  statut: EventStatus;
  image_url?: string | null;
  offres: PublicOffre[];
};