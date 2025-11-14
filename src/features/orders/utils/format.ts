// src/features/orders/utils/format.ts

/* ------------------------------------------------------------------
   💰 Formatage des montants / totaux
------------------------------------------------------------------ */

export function formatPrice(value: number | string | null | undefined): string {
  if (value == null || isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

/* ------------------------------------------------------------------
   🕒 Formatage des dates et heures
------------------------------------------------------------------ */

export function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date?: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(date?: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const abs = Math.abs(minutes);

  if (abs < 1) return "à l’instant";
  if (abs < 60) return minutes < 0 ? `il y a ${abs} min` : `dans ${abs} min`;

  const hours = Math.round(abs / 60);
  if (hours < 24) return minutes < 0 ? `il y a ${hours} h` : `dans ${hours} h`;

  const days = Math.round(hours / 24);
  return minutes < 0 ? `il y a ${days} j` : `dans ${days} j`;
}

/* ------------------------------------------------------------------
   🧾 Formatage des statuts de commande / paiement
------------------------------------------------------------------ */

export function formatPaymentStatus(status?: string | null): string {
  switch (status) {
    case "ATTENTE":
      return "En attente";
    case "PAYE":
      return "Payée";
    case "ECHEC":
      return "Échec du paiement";
    case "REMBOURSE":
      return "Remboursée";
    default:
      return "Inconnu";
  }
}

export function paymentStatusColor(status?: string | null): string {
  switch (status) {
    case "ATTENTE":
      return "text-yellow-700 bg-yellow-100";
    case "PAYE":
      return "text-green-700 bg-green-100";
    case "ECHEC":
      return "text-red-700 bg-red-100";
    case "REMBOURSE":
      return "text-blue-700 bg-blue-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/* ------------------------------------------------------------------
   🛒 Formatage du statut de panier (lié à la commande)
------------------------------------------------------------------ */

export function formatCartStatus(status?: string | null): string {
  switch (status) {
    case "ACTIF":
      return "Actif";
    case "VALIDE":
      return "Validé";
    case "ABANDONNE":
      return "Abandonné";
    case "EXPIRE":
      return "Expiré";
    default:
      return "Inconnu";
  }
}

export function cartStatusColor(status?: string | null): string {
  switch (status) {
    case "ACTIF":
      return "text-blue-700 bg-blue-100";
    case "VALIDE":
      return "text-green-700 bg-green-100";
    case "ABANDONNE":
      return "text-orange-700 bg-orange-100";
    case "EXPIRE":
      return "text-gray-600 bg-gray-100";
    default:
      return "text-gray-500 bg-gray-100";
  }
}

/* ------------------------------------------------------------------
   🎫 Formatage des e-billets
------------------------------------------------------------------ */

export function formatTicketStatus(status?: string | null): string {
  switch (status) {
    case "VALIDE":
      return "Valide";
    case "UTILISE":
      return "Utilisé";
    case "EXPIRE":
      return "Expiré";
    default:
      return "Inconnu";
  }
}

export function ticketStatusColor(status?: string | null): string {
  switch (status) {
    case "VALIDE":
      return "text-green-700 bg-green-100";
    case "UTILISE":
      return "text-blue-700 bg-blue-100";
    case "EXPIRE":
      return "text-gray-600 bg-gray-100";
    default:
      return "text-gray-500 bg-gray-100";
  }
}

/* ------------------------------------------------------------------
   🧩 Autres utilitaires
------------------------------------------------------------------ */

export function truncate(text: string, max = 60): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function formatReference(ref?: string | null): string {
  if (!ref) return "—";
  return ref.startsWith("REF-") ? ref : `REF-${ref}`;
}
