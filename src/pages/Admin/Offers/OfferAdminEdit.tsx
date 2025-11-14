// src/pages/Admin/Offers/OfferAdminEdit.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getOffer,
  updateOffer,
  deleteOffer,
  type Offer,
} from "@/api/offers.api";
import { listEvents, type Event } from "@/api/events.api";

export default function OfferAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const offerId = Number(id);
  const navigate = useNavigate();

  const [initial, setInitial] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form fields
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

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [evRes, ofRes] = await Promise.all([listEvents(), getOffer(offerId)]);
        const rows: Event[] = Array.isArray(evRes) ? evRes : (evRes as any).results;
        setEvents(rows);

        setInitial(ofRes);
        setEvenement(ofRes.evenement);
        setNom(ofRes.nom_offre);
        setDescription(ofRes.description ?? "");
        setPrix(Number(ofRes.prix));
        setNbPersonnes(Number(ofRes.nb_personnes));
        setTypeOffre(ofRes.type_offre ?? "STANDARD");
        setStockTotal(Number(ofRes.stock_total));
        setStockDisponible(Number(ofRes.stock_disponible));
        setDebut(ofRes.date_debut_vente ? new Date(ofRes.date_debut_vente).toISOString().slice(0, 16) : "");
        setFin(ofRes.date_fin_vente ? new Date(ofRes.date_fin_vente).toISOString().slice(0, 16) : "");
        setStatut((ofRes as any).statut ?? "DISPONIBLE");
      } finally {
        setLoading(false);
        setLoadingEvents(false);
      }
    }
    init();
  }, [offerId]);

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
      await updateOffer(offerId, {
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
      });
      navigate("/admin/offers");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Supprimer définitivement cette offre ?")) return;
    setDeleting(true);
    try {
      await deleteOffer(offerId);
      navigate("/admin/offers");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !initial) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Modifier l’offre</h1>
        <button className="btn btn-error" onClick={onDelete} disabled={deleting}>
          {deleting ? <span className="loading loading-spinner" /> : "Supprimer"}
        </button>
      </div>

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
            {saving ? <span className="loading loading-spinner" /> : "Enregistrer"}
          </button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
