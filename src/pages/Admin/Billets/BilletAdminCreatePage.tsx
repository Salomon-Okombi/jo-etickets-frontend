import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createBillet } from "@/api/billets.api";
import type { EBilletCreatePayload } from "@/types/billets";
import "@/styles/admin.css";

export default function BilletAdminCreatePage() {
  const navigate = useNavigate();

  const [utilisateur, setUtilisateur] = useState<number | "">("");
  const [offre, setOffre] = useState<number | "">("");
  const [prix_paye, setPrixPaye] = useState<number | "">("");
  const [statut, setStatut] = useState<string>("VALIDE");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = utilisateur !== "" && offre !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      const payload: EBilletCreatePayload = {
        utilisateur: Number(utilisateur),
        offre: Number(offre),
        prix_paye: prix_paye === "" ? undefined : Number(prix_paye),
        statut,
      };

      await createBillet(payload);
      navigate("/admin/billets");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Données invalides.");
      else if (status === 401) setError("Session expirée.");
      else if (status === 403) setError("Accès refusé.");
      else setError("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1rem" }}>
        <div className="admin-title">Créer un billet</div>
        <div className="admin-subtitle">Création manuelle (admin).</div>
      </div>

      {error && <div className="admin-alert" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ marginBottom: "1rem" }}>
        <Link className="admin-btn admin-btn--ghost" to="/admin/billets">← Retour</Link>
      </div>

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 720 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Utilisateur (ID) *</div>
              <input
                className="admin-input"
                type="number"
                min={1}
                value={utilisateur}
                onChange={(e) => setUtilisateur(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <div className="admin-text-muted">Offre (ID) *</div>
              <input
                className="admin-input"
                type="number"
                min={1}
                value={offre}
                onChange={(e) => setOffre(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className="admin-text-muted">Prix payé (optionnel)</div>
            <input
              className="admin-input"
              type="number"
              min={0}
              step="0.01"
              value={prix_paye}
              onChange={(e) => setPrixPaye(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div>
            <div className="admin-text-muted">Statut</div>
            <select className="admin-select" value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="VALIDE">VALIDE</option>
              <option value="UTILISE">UTILISE</option>
              <option value="ANNULE">ANNULE</option>
              <option value="EXPIRE">EXPIRE</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(-1)}>Annuler</button>
            <button type="submit" className="admin-btn" disabled={!canSubmit || saving}>
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}