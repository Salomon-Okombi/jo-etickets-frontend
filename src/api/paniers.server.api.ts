import api from "@/api/axiosClient";

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

export async function getActiveServerCart(): Promise<ServerCart | null> {
  try {
    const { data } = await api.get<ServerCart>("/paniers/actif/");
    return data ?? null;
  } catch {
    return null;
  }
}
``