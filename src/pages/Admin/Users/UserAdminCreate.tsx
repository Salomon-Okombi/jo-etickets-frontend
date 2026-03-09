import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "@/api/users.api";
import "@/styles/admin.css";

export default function UserAdminCreate() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [type_compte, setTypeCompte] = useState<"CLIENT" | "ADMIN">("CLIENT");
  const [statut, setStatut] = useState<"ACTIF" | "INACTIF">("ACTIF");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Username, email et mot de passe sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      await createUser({ username, email, password, type_compte });
      // statut est géré dans serializer admin create (si tu veux l’envoyer, ajoute dans payload type)
      // Ici on le met en update après création si besoin (optionnel)

      navigate("/admin/utilisateurs", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Données invalides (400). Vérifie email/username/password.");
      else if (status === 401) setError("Non authentifié (401).");
      else if (status === 403) setError("Accès refusé (403). Admin requis.");
      else setError("Création impossible.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Créer un utilisateur</div>
        <div className="admin-subtitle">Création admin (username, email, type_compte, statut, mot de passe).</div>
      </div>

      {error ? <div className="admin-alert" role="alert">{error}</div> : null}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.9rem", maxWidth: 560 }}>
          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Username</div>
            <input className="admin-input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Email</div>
            <input className="admin-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Mot de passe</div>
            <input className="admin-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Type compte</div>
              <select className="admin-select" value={type_compte} onChange={(e) => setTypeCompte(e.target.value as any)}>
                <option value="CLIENT">CLIENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Statut</div>
              <select className="admin-select" value={statut} onChange={(e) => setStatut(e.target.value as any)}>
                <option value="ACTIF">ACTIF</option>
                <option value="INACTIF">INACTIF</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button className="admin-btn" disabled={loading} type="submit">
              {loading ? "Création…" : "Créer"}
            </button>
            <button className="admin-btn admin-btn--ghost" type="button" onClick={() => navigate(-1)}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}