// src/pages/Admin/Events/EventAdminCreate.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "@/api/events.api";

export default function EventAdminCreate() {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [discipline_sportive, setDiscipline] = useState("");
  const [date_evenement, setDate] = useState("");
  const [lieu_evenement, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const canSubmit = nom && discipline_sportive && date_evenement && lieu_evenement;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await createEvent({
        nom,
        discipline_sportive,
        date_evenement, // format YYYY-MM-DD (ou datetime selon ton backend)
        lieu_evenement,
        description,
      });
      navigate("/admin/events");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Créer un événement</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="form-control">
          <span className="label-text">Nom</span>
          <input
            className="input input-bordered"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Finale 100m"
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Discipline</span>
          <input
            className="input input-bordered"
            value={discipline_sportive}
            onChange={(e) => setDiscipline(e.target.value)}
            placeholder="Athlétisme"
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Date</span>
          <input
            type="date"
            className="input input-bordered"
            value={date_evenement}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Lieu</span>
          <input
            className="input input-bordered"
            value={lieu_evenement}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Stade de France"
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Description</span>
          <textarea
            className="textarea textarea-bordered"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails de l’événement…"
            rows={4}
          />
        </label>

        <div className="flex gap-3">
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
