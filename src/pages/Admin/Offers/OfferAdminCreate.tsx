// src/pages/Admin/Offers/OfferAdminCreate.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOffer,
  type CreateOfferPayload,
} from "@/api/offers.api";
import { listEvents, type Event } from "@/api/events.api";

export default function OfferAdminCreate() {
  const navigate = useNavigate();

  // Champs principaux
  const [evenement, setEvenement] = useState<number | "">("");
  const [nom_offre, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState<number | "">("");
  const [nb_personnes, setNbPersonnes] = useState<number | "">("");
  const [type_offre, setTypeOffre] = useState("STANDARD");
  const [stock_total, setStockTotal] = useState<number | "">("");
  const [stock_disponible, setStockDisponible] = useState<number | "">("");
  const [date_debut_vente, setDebut] = useState("");
  const [date_fin_vente, setFin] = useState("");
  const [statut, setStatut] = useState<"DISPONIBLE" | "INDISPONIBLE" | "EPUISEE">("DISPONIBLE");

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);
      try {
        const data = await listEvents();
        const rows: Event[] = Array.isArray(data) ? data : (data as any).results;
        setEvents(rows);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  const canSubmit =
    evenement &&
    nom_offre &&
    prix !== "" &&
    stock_total !== "" &&
    stock_disponible !== "" &&
    nb_personnes !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload: CreateOfferPayload = {
        evenement: Number(evenement),
        nom_offre,
        description,
        prix: Number(prix),
        nb_personnes: Number(nb_personnes),
        type_offre,
        stock_total: Number(stock_total),
        stock_disponible: Number(stock_disponible),
        date_debut_vente: date_debut_vente ? new Date(date_debut_vente).toISOString() : null,
        date_fin_vente: date_fin_vente ? new Date(date_fin_vente).toISOString() : null,
        statut,
      };
      await createOffer(payload);
      navigate("/admin/offers");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Créer une offre</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="form-control md:col-span-2">
          <span className="label-text">Événement</span>
          <select
            className="select select-bordered"
            value={evenement}
            onChange={(e) => setEvenement(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="" disabled>
              {loadingEvents ? "Chargement…" : "Sélectionner un événement"}
            </option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                #{ev.id} — {ev.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control md:col-span-2">
          <span className="label-text">Nom de l’offre</span>
          <input
            className="input input-bordered"
            value={nom_offre}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </label>

        <label className="form-control md:col-span-2">
          <span className="label-text">Description</span>
          <textarea
            className="textarea textarea-bordered"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Détails, avantages…"
          />
        </label>

        <label className="form-control">
          <span className="label-text">Prix (€)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className="input input-bordered"
            value={prix}
            onChange={(e) => setPrix(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Nombre de personnes</span>
          <input
            type="number"
            min={1}
            className="input input-bordered"
            value={nb_personnes}
            onChange={(e) => setNbPersonnes(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Type d’offre</span>
          <select
            className="select select-bordered"
            value={type_offre}
            onChange={(e) => setTypeOffre(e.target.value)}
          >
            <option value="STANDARD">STANDARD</option>
            <option value="DUO">DUO</option>
            <option value="FAMILLE">FAMILLE</option>
            <option value="VIP">VIP</option>
          </select>
        </label>

        <label className="form-control">
          <span className="label-text">Stock total</span>
          <input
            type="number"
            min={0}
            className="input input-bordered"
            value={stock_total}
            onChange={(e) => setStockTotal(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Stock disponible</span>
          <input
            type="number"
            min={0}
            className="input input-bordered"
            value={stock_disponible}
            onChange={(e) => setStockDisponible(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Début de vente</span>
          <input
            type="datetime-local"
            className="input input-bordered"
            value={date_debut_vente}
            onChange={(e) => setDebut(e.target.value)}
          />
        </label>

        <label className="form-control">
          <span className="label-text">Fin de vente</span>
          <input
            type="datetime-local"
            className="input input-bordered"
            value={date_fin_vente}
            onChange={(e) => setFin(e.target.value)}
          />
        </label>

        <label className="form-control">
          <span className="label-text">Statut</span>
          <select
            className="select select-bordered"
            value={statut}
            onChange={(e) => setStatut(e.target.value as typeof statut)}
          >
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="INDISPONIBLE">INDISPONIBLE</option>
            <option value="EPUISEE">ÉPUISÉE</option>
          </select>
        </label>

        <div className="md:col-span-2 flex gap-3 pt-2">
          <button className="btn btn-primary" type="submit" disabled={!canSubmit || saving}>
            {saving ? <span className="loading loading-spinner" /> : "Créer"}
          </button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
