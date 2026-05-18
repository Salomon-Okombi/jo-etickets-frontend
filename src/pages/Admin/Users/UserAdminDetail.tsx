// src/pages/Users/UserAdminDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, updateUser, deleteUser } from "@/api/users.api";
import "@/styles/admin.css";

export default function UserAdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"UTILISATEUR" | "ADMIN">("UTILISATEUR");
  const [estBloque, setEstBloque] = useState<boolean>(false);
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const u = await getUser(userId);

        setUsername(u.username ?? "");
        setEmail(u.email ?? "");
        setRole((u.role as "UTILISATEUR" | "ADMIN") ?? "UTILISATEUR");

        // ✅ CORRECTION ICI
        setEstBloque(u.est_bloque ?? false);
      } catch {
        setError("Impossible de charger l’utilisateur.");
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(userId)) {
      loadUser();
    }
  }, [userId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateUser(userId, {
        username,
        email,
        role,
        est_bloque: estBloque,
        ...(password.trim() ? { password: password.trim() } : {}),
      });

      alert("Utilisateur mis à jour avec succès.");
      setPassword("");
    } catch {
      setError("Erreur lors de la sauvegarde.");
    }
  }

  async function onDelete() {
    const ok = window.confirm("Supprimer cet utilisateur ? Action irréversible.");
    if (!ok) return;

    try {
      await deleteUser(userId);
      navigate("/admin/utilisateurs");
    } catch {
      setError("Suppression impossible.");
    }
  }

  if (loading) {
    return <div className="admin-table-state">Chargement…</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-title">Modifier utilisateur</div>

      {error && <div className="admin-alert">{error}</div>}

      <form onSubmit={onSave} className="admin-form">
        <input
          className="admin-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />

        <input
          className="admin-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <select
          className="admin-select"
          value={role}
          onChange={(e) => setRole(e.target.value as "UTILISATEUR" | "ADMIN")}
        >
          <option value="UTILISATEUR">UTILISATEUR</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={estBloque}
            onChange={(e) => setEstBloque(e.target.checked)}
          />
          Compte bloqué
        </label>

        <input
          className="admin-input"
          type="password"
          placeholder="Nouveau mot de passe (optionnel)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="admin-actions">
          <button className="admin-btn" type="submit">
            Sauvegarder
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={onDelete}
          >
            Supprimer
          </button>
        </div>
      </form>
    </div>
  );
}