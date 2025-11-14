// src/pages/Admin/Events/EventAdminEdit.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent, updateEvent, deleteEvent } from "@/api/events.api";
import type { Event } from "@/api/events.api";

export default function EventAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();

  const [initial, setInitial] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form fields
  const [nom, setNom] = useState("");
  const [discipline_sportive, setDiscipline] = useState("");
  const [date_evenement, setDate] = useState("");
  const [lieu_evenement, setLieu] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ev = await getEvent(eventId);
        setInitial(ev);
        setNom(ev.nom);
        setDiscipline(ev.discipline_sportive);
        setDate(ev.date_evenement);
        setLieu(ev.lieu_evenement);
        setDescription(ev.description ?? "");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  const canSubmit = nom && discipline_sportive && date_evenement && lieu_evenement;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await updateEvent(eventId, {
        nom,
        discipline_sportive,
        date_evenement,
        lieu_evenement,
        description,
      });
      navigate("/admin/events");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm("Supprimer définitivement cet événement ?");
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteEvent(eventId);
      navigate("/admin/events");
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
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Modifier l’événement</h1>
        <button
          className="btn btn-error"
          onClick={onDelete}
          disabled={deleting}
          title="Supprimer l’événement"
        >
          {deleting ? <span className="loading loading-spinner" /> : "Supprimer"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="form-control">
          <span className="label-text">Nom</span>
          <input
            className="input input-bordered"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Discipline</span>
          <input
            className="input input-bordered"
            value={discipline_sportive}
            onChange={(e) => setDiscipline(e.target.value)}
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
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Description</span>
          <textarea
            className="textarea textarea-bordered"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>

        <div className="flex gap-3">
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
