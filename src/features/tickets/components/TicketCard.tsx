import React from "react";
import { formatDateTime, formatTicketStatus, ticketStatusColor } from "@/features/orders/utils/format";

export interface Ticket {
  id: number;
  numero_billet: string;
  offre_nom: string;
  prix_paye: number;
  statut: "VALIDE" | "UTILISE" | "EXPIRE" | string;
  qr_code?: string; // Base64 string venant du backend
  date_creation?: string;
}

/**
 * 🎫 TicketCard — Affiche un e-billet individuel
 */
export default function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white shadow-sm p-4 hover:shadow-md transition">
      <div className="flex flex-col gap-1 w-full md:w-3/4">
        <h3 className="text-lg font-semibold text-gray-800">
          {ticket.offre_nom}
        </h3>
        <p className="text-sm text-gray-600">Numéro : {ticket.numero_billet}</p>
        {ticket.date_creation && (
          <p className="text-sm text-gray-500">
            Émis le : {formatDateTime(ticket.date_creation)}
          </p>
        )}
        <p className="text-sm text-gray-700 font-medium">
          Prix payé : {ticket.prix_paye.toFixed(2)} €
        </p>

        {/* Statut avec badge coloré */}
        <span
          className={`inline-flex items-center justify-center px-3 py-1 mt-2 text-xs font-semibold rounded-full w-fit ${ticketStatusColor(
            ticket.statut
          )}`}
        >
          {formatTicketStatus(ticket.statut)}
        </span>
      </div>

      {/* QR code */}
      {ticket.qr_code && (
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <img
            src={`data:image/png;base64,${ticket.qr_code}`}
            alt="QR Code billet"
            className="w-32 h-32 object-contain border rounded-lg p-2 bg-white"
          />
        </div>
      )}
    </div>
  );
}
