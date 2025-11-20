// src/pages/Auth/RegisterPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  registerUser,
  type RegisterPayload,
  loginUser,
  storeTokens,
  getProfile,
} from "@/api/auth.api";
import { useAuth } from "@/hooks/useAuth";

interface LocationState {
  from?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as LocationState | undefined)?.from ||
    "/mon-espace/commandes";

  // Si déjà connecté → inutile d'afficher la page d'inscription
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const validate = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Merci de renseigner tous les champs obligatoires.");
      return false;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return false;
    }
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      setLoading(true);

      const payload: RegisterPayload = {
        username: username.trim(),
        email: email.trim(),
        password,
      };

      // 1. Création du compte
      await registerUser(payload);

      // 2. Connexion automatique
      const tokens = await loginUser(payload.username, payload.password);
      storeTokens(tokens);

      // 3. Chargement du profil
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (profileError) {
        console.error(
          "Impossible de charger le profil après inscription :",
          profileError
        );
      }

      // 4. Redirection vers la page d'origine ou mon espace
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        "Impossible de créer votre compte. Vérifiez les informations ou essayez avec un autre email / nom d’utilisateur."
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
            Créez votre compte
            <span>billetterie JO Paris 2024</span>
          </h1>

          <p className="auth-page__text">
            En créant un compte, vous pourrez réserver vos e-billets, suivre vos
            commandes et retrouver à tout moment vos accès aux sites
            olympiques.
          </p>

          <ul className="auth-page__bullets">
            <li>Un compte unique pour toutes vos réservations</li>
            <li>E-billets sécurisés, accessibles en ligne</li>
            <li>Historique des commandes et paiements</li>
          </ul>
        </section>

        {/* Bloc droit : formulaire d'inscription */}
        <section className="auth-page__panel">
          <div className="auth-card">
            <h2 className="auth-card__title">Créer un compte</h2>
            <p className="auth-card__subtitle">
              Renseignez un nom d&apos;utilisateur, un email valide et un mot de
              passe sécurisé. Vous serez automatiquement connecté après
              l&apos;inscription.
            </p>

            {error && (
              <div className="auth-card__alert">
                <p>{error}</p>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form__field">
                <label htmlFor="username" className="auth-form__label">
                  Nom d&apos;utilisateur
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
                <label htmlFor="email" className="auth-form__label">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-form__input"
                  placeholder="vous@example.com"
                />
              </div>

              <div className="auth-form__field">
                <label htmlFor="password" className="auth-form__label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-form__input"
                  placeholder="Au moins 8 caractères"
                />
              </div>

              <div className="auth-form__field">
                <label
                  htmlFor="passwordConfirm"
                  className="auth-form__label"
                >
                  Confirmation du mot de passe
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="auth-form__input"
                  placeholder="Retapez votre mot de passe"
                />
              </div>

              <div className="auth-form__footer">
                <button
                  type="submit"
                  className="auth-form__submit"
                  disabled={loading}
                >
                  {loading ? "Création du compte..." : "Créer mon compte"}
                </button>
              </div>
            </form>

            <div className="auth-card__bottom">
              <p>
                Vous avez déjà un compte ?{" "}
                <Link to="/login" className="auth-card__link">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>

          <p className="auth-page__security">
            🔐 En créant un compte, vous acceptez que vos données soient
            utilisées pour la gestion de vos commandes d’e-billets dans le
            cadre de ce projet pédagogique.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
