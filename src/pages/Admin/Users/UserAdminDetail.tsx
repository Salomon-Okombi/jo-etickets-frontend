import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteUser, getUser, updateUser } from "@/api/users.api";
import type { User } from "@/types/users";
import "@/styles/admin.css";

export default function UserAdminDetail() {
  const { id } = useParams();
  const userId = Number(id);
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setTypeCompte] = useState<string>("CLIENT");
  const [statut, setStatut] = useState<string>("ACTIF");
  const [password, setPassword] = useState(""); // optionnel

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getUser(userId);
        if (controller.signal.aborted) return;

        setUser(data);
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setTypeCompte(data.role ?? "UTILISATEUR");
        setStatut(data.statut ?? "ACTIF");
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) setError("Utilisateur introuvable (404).");
        else if (status === 401) setError("Non authentifié (401).");
        else if (status === 403) setError("Accès refusé (403).");
        else setError("Chargement impossible.");
        console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (Number.isFinite(userId)) load();
    return () => controller.abort();
  }, [userId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);

      const payload: any = {
        username,
        email,
        role,
        statut,
      };
      if (password.trim()) payload.password = password.trim();

      const updated = await updateUser(userId, payload);
      setUser(updated);
      setPassword("");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Données invalides (400).");
      else if (status === 401) setError("Non authentifié (401).");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Sauvegarde impossible.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm("Supprimer cet utilisateur ? Action irréversible.");
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteUser(userId);
      navigate("/admin/utilisateurs", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Suppression refusée (ex: suppression de soi-même/superadmin).");
      else if (status === 401) setError("Non authentifié (401).");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Suppression impossible.");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="admin-table-state">Chargement…</div>;

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Détails utilisateur</div>
        <div className="admin-subtitle">
          Modifier / supprimer un utilisateur.
          {user ? (
            <span className="admin-text-muted" style={{ marginLeft: 8, fontSize: "0.85rem" }}>
              ID #{user.id}
            </span>
          ) : null}
        </div>
      </div>

      {error ? <div className="admin-alert" role="alert">{error}</div> : null}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSave} style={{ display: "grid", gap: "0.9rem", maxWidth: 560 }}>
          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Username</div>
            <input className="admin-input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Email</div>
            <input className="admin-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Type compte</div>
              <select className="admin-select" value={role} onChange={(e) => setTypeCompte(e.target.value)}>
                <option value="CLIENT">CLIENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Statut</div>
              <select className="admin-select" value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="ACTIF">ACTIF</option>
                <option value="INACTIF">INACTIF</option>
              </select>
            </div>
          </div>

          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Nouveau mot de passe (optionnel)
            </div>
            <input className="admin-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button className="admin-btn" disabled={saving} type="submit">
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </button>

            <button className="admin-btn admin-btn--ghost" type="button" onClick={() => navigate(-1)}>
              Retour
            </button>

            <button
              className="admin-btn admin-btn--sm"
              type="button"
              onClick={onDelete}
              disabled={deleting}
              style={{ marginLeft: "auto" }}
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}