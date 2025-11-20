// src/pages/Auth/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  loginUser,
  type JwtPair,
  storeTokens,
  getProfile,
} from "@/api/auth.api";
import { useAuth } from "@/hooks/useAuth";

interface LocationState {
  from?: string;
  eventId?: number;
  selectedOfferId?: number;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as LocationState | undefined)?.from ||
    "/mon-espace/commandes";

  // Si déjà connecté → on redirige tout de suite
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Merci de renseigner vos identifiants.");
      return;
    }

    try {
      setLoading(true);

      // 1. Récupérer les tokens
      const tokens: JwtPair = await loginUser(username.trim(), password);

      // 2. Stocker les tokens + poser le header Authorization
      storeTokens(tokens);

      // 3. Charger le profil utilisateur et le mettre dans le contexte
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (profileError) {
        console.error("Impossible de charger le profil après login :", profileError);
      }

      // 4. Redirection vers la page d’origine ou l’espace client
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        "Échec de la connexion. Vérifiez votre nom d’utilisateur et votre mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__inner">
        {/* Bloc gauche : texte / branding */}
        <section className="auth-page__intro">
          <div className="auth-page__logo">
            <div className="auth-page__logo-mark">JO</div>
            <div className="auth-page__logo-text">
              <span className="auth-page__logo-title">Paris 2024</span>
              <span className="auth-page__logo-subtitle">
                Billetterie e-Tickets
              </span>
            </div>
          </div>

          <h1 className="auth-page__title">
            Connexion à votre espace
            <span>billetterie JO Paris 2024</span>
          </h1>

          <p className="auth-page__text">
            Accédez à vos paniers, commandes et e-billets sécurisés. Votre
            compte vous permet de retrouver toutes vos réservations pour les
            Jeux Olympiques Paris 2024.
          </p>

          <ul className="auth-page__bullets">
            <li>Suivi de vos commandes et paiements</li>
            <li>Consultation et téléchargement de vos e-billets</li>
            <li>Accès rapide à vos informations personnelles</li>
          </ul>
        </section>

        {/* Bloc droit : formulaire de login */}
        <section className="auth-page__panel">
          <div className="auth-card">
            <h2 className="auth-card__title">Se connecter</h2>
            <p className="auth-card__subtitle">
              Identifiez-vous avec votre nom d’utilisateur et votre mot de
              passe choisis lors de la création du compte.
            </p>

            {error && (
              <div className="auth-card__alert">
                <p>{error}</p>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form__field">
                <label htmlFor="username" className="auth-form__label">
                  Nom d’utilisateur
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="auth-form__input"
                  placeholder="ex : jean.dupont"
                />
              </div>

              <div className="auth-form__field">
                <label htmlFor="password" className="auth-form__label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-form__input"
                  placeholder="Votre mot de passe sécurisé"
                />
              </div>

              <div className="auth-form__footer">
                <button
                  type="submit"
                  className="auth-form__submit"
                  disabled={loading}
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </button>
              </div>
            </form>

            <div className="auth-card__bottom">
              <p>
                Pas encore de compte ?{" "}
                <Link to="/register" className="auth-card__link">
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          <p className="auth-page__security">
            🔐 Sécurité : votre accès est protégé. Pour toute connexion
            suspecte, changez immédiatement votre mot de passe.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
