// src/api/orders.api.ts
import { api } from "./axiosClient";

/* ------------------------------------------------------------------
   🧱 Types
------------------------------------------------------------------ */
export type OrderPaymentStatus = "ATTENTE" | "PAYE" | "ECHOUE" | "REMBOURSE";

export interface CartLineLight {
  id: number;
  offre: number | null;     // peut être null si ligne invalide (sécurité)
  offre_nom?: string;
  offre_prix?: string;      // Decimal en string
  quantite: number;
  prix_unitaire: string;    // Decimal en string
  sous_total: string;       // Decimal en string
  date_ajout: string;
}

export interface CartSnapshot {
  id: number;
  statut: "ACTIF" | "VALIDE" | "ABANDONNE" | "EXPIRE";
  montant_total: string;    // Decimal en string
  lignes: CartLineLight[];
  date_creation: string;
  date_expiration: string | null;
}

export interface Order {
  id: number;
  utilisateur: number;
  panier: number;
  // Certains serializers exposent un snapshot du panier
  panier_detail?: CartSnapshot;

  numero_commande: string;
  date_commande: string;
  montant_total: string;        // Decimal en string
  statut_paiement: OrderPaymentStatus;
  methode_paiement: string | null;
  reference_paiement: string | null;
  date_paiement: string | null;
}

export interface CreateOrderPayload {
  panier: number;               // ID du panier à convertir en commande
}

export type UpdateOrderPayload = Partial<{
  // on ne permet pas d’éditer les champs de paiement ici (géré par /payer)
  panier: number;
}>;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TicketLight {
  id: number;
  numero_billet: string;
  qr_code: string;              // base64 png
  statut: "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE";
}

export interface PayOrderResponse {
  message: string;
  commande: string;             // numero_commande
  billets: TicketLight[];
}

export interface GenerateTicketsResponse {
  message: string;
  commande: string;             // numero_commande
  billets: TicketLight[];
}

/* ------------------------------------------------------------------
   ⚙️ Endpoints : /api/commandes/
   - GET    /commandes/                  -> listOrders
   - GET    /commandes/:id/              -> getOrder
   - POST   /commandes/                  -> createOrder (depuis un panier)
   - PUT    /commandes/:id/              -> replaceOrder (tant que non PAYE)
   - PATCH  /commandes/:id/              -> updateOrder  (tant que non PAYE)
   - DELETE /commandes/:id/              -> deleteOrder  (tant que non PAYE)
   - POST   /commandes/:id/payer/        -> payOrder
   - POST   /commandes/:id/generer-billets/ -> generateTickets
------------------------------------------------------------------ */

/** Liste des commandes (auth requise ; admin voit tout) */
export async function listOrders(params?: {
  page?: number;
}): Promise<Paginated<Order>> {
  const { data } = await api.get<Paginated<Order>>("/commandes/", { params });
  return data;
}

/** Détail d’une commande (auth requise) */
export async function getOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`/commandes/${id}/`);
  return data;
}

/** Créer une commande à partir d’un panier (auth requise) */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<Order>("/commandes/", payload);
  return data;
}

/** Remplacer complètement une commande (tant que non PAYE) */
export async function replaceOrder(id: number, payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.put<Order>(`/commandes/${id}/`, payload);
  return data;
}

/** Mise à jour partielle d’une commande (tant que non PAYE) */
export async function updateOrder(id: number, payload: UpdateOrderPayload): Promise<Order> {
  const { data } = await api.patch<Order>(`/commandes/${id}/`, payload);
  return data;
}

/** Supprimer une commande (tant que non PAYE) */
export async function deleteOrder(id: number): Promise<void> {
  await api.delete(`/commandes/${id}/`);
}

/** Payer une commande : génère les e-billets et décrémente le stock (auth requise) */
export async function payOrder(
  id: number,
  payload?: { methode_paiement?: string; reference_paiement?: string }
): Promise<PayOrderResponse> {
  const { data } = await api.post<PayOrderResponse>(`/commandes/${id}/payer/`, payload ?? {});
  return data;
}

/** Générer manuellement les e-billets (commande déjà PAYE) */
export async function generateTickets(id: number): Promise<GenerateTicketsResponse> {
  const { data } = await api.post<GenerateTicketsResponse>(`/commandes/${id}/generer-billets/`);
  return data;
}
