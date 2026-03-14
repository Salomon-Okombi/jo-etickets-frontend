// src/api/billets.api.ts
import { api } from "./axiosClient";
import type { EBillet, Paginated, EBilletCreatePayload, EBilletUpdatePayload } from "@/types/billets";

export async function listBillets(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  statut?: string;
}): Promise<Paginated<EBillet> | EBillet[]> {
  const { data } = await api.get("/billets/", { params });
  return data;
}

export async function getBillet(id: number): Promise<EBillet> {
  const { data } = await api.get<EBillet>(`/billets/${id}/`);
  return data;
}

export async function createBillet(payload: EBilletCreatePayload): Promise<EBillet> {
  const { data } = await api.post<EBillet>("/billets/", payload);
  return data;
}

export async function updateBillet(id: number, payload: EBilletUpdatePayload): Promise<EBillet> {
  const { data } = await api.patch<EBillet>(`/billets/${id}/`, payload);
  return data;
}

export async function deleteBillet(id: number): Promise<void> {
  await api.delete(`/billets/${id}/`);
}

export async function annulerBillet(id: number): Promise<void> {
  await api.post(`/billets/${id}/annuler/`);
}

export async function validerBillet(id: number, payload?: { lieu_utilisation?: string }): Promise<void> {
  await api.post(`/billets/${id}/valider/`, payload ?? {});
}

export async function validerBilletParCle(payload: { cle_finale: string; lieu_utilisation?: string }): Promise<void> {
  await api.post(`/billets/valider-par-cle/`, payload);
}



/* ===========================
   ✅ Téléchargements (JWT OK)
   =========================== */

export async function downloadBilletPdf(id: number): Promise<Blob> {
  const res = await api.get(`/billets/${id}/pdf/`, { responseType: "blob" });
  return res.data as Blob;
}

export async function downloadBilletPng(id: number): Promise<Blob> {
  const res = await api.get(`/billets/${id}/telecharger/`, { responseType: "blob" });
  return res.data as Blob;
}