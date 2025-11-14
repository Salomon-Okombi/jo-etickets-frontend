// src/pages/Auth/LoginPage.tsx (ou ton chemin réel)
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { ROUTES } from "@/config";
import Spinner from "@/components/ui/Spinner";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form.username, form.password);
      navigate(ROUTES.home);
    } catch {
      setError("Identifiants invalides. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-lg bg-base-100 p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Connexion</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">
              <span className="label-text">Nom d’utilisateur</span>
            </label>
            <input
              type="text"
              name="username"
              className="input input-bordered w-full"
              placeholder="Nom d’utilisateur"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Mot de passe</span>
            </label>
            <input
              type="password"
              name="password"
              className="input input-bordered w-full"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Se connecter"}
          </button>

          <p className="text-center text-sm mt-3">
            Pas encore de compte ?{" "}
            <Link className="link link-primary" to={ROUTES.register}>
              Inscrivez-vous
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
