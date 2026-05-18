// src/pages/Users/UserAdminCreate.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "@/api/users.api";
import "@/styles/admin.css";

export default function UserAdminCreate() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"UTILISATEUR" | "ADMIN">("UTILISATEUR");
  const [estBloque, setEstBloque] = useState(false);
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    try {
      setLoading(true);

      await createUser({
        username,
        email,
        password,
        role,
      });

      navigate("/admin/utilisateurs", { replace: true });
    } catch (err) {
      setError("Création impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-title">Créer un utilisateur</div>

      {error && <div className="admin-alert">{error}</div>}

      <form onSubmit={onSubmit} className="admin-form">
        <input className="admin-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="admin-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="admin-input" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />

        <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value as any)}>
          <option value="UTILISATEUR">UTILISATEUR</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <label>
          <input type="checkbox" checked={estBloque} onChange={(e) => setEstBloque(e.target.checked)} />
          Compte bloqué
        </label>

        <button className="admin-btn" disabled={loading}>
          {loading ? "Création…" : "Créer"}
        </button>
      </form>
    </div>
  );
}