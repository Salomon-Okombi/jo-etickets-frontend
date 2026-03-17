import { api } from "@/api/axiosClient";

export type ServerCartLine = {
  id: number;
  offre: number;
  quantite: number;
  prix_unitaire: string;
  sous_total: string;
};

export type ServerCart = {
  id: number;
  statut: string;
  montant_total: string;
  lignes: ServerCartLine[];
};

function unwrapList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function getActiveServerCart(): Promise<ServerCart | null> {
  const { data } = await api.get("/paniers/");
  const carts = unwrapList(data);
  const actif = carts.find((c) => String(c.statut).toUpperCase() === "ACTIF");
  return actif ?? null;
}