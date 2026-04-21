//paiements.api.ts
import  api  from "@/api/axiosClient";

export type Paiement = {
  id: number;
  reference: string;
  commande: number;
  montant: string;
  statut: string;
  provider: string;
  date_creation: string;
  date_confirmation: string | null;
};

export async function initPaiement(payload: { commande: number; provider?: string; raw_payload?: any }) {
  const { data } = await api.post<Paiement>("/paiements/", { provider: "MOCK", ...payload });
  return data;
}

export async function confirmPaiement(id: number, payload: { success: boolean; reference_paiement?: string; raw_payload?: any }) {
  const { data } = await api.post<Paiement>(`/paiements/${id}/confirmer/`, payload);
  return data;
}