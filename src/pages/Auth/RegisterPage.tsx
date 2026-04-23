// src/pages/Auth/RegisterPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  registerUser,
  loginUser,
  storeTokens,
  getProfile,
} from "@/api/auth.api";
import useAuth from "@/hooks/useAuth";
import { normalizeUser } from "@/utils/authNormalize";

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

  //  Si déjà connecté → redirection
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

      //  Payload minimal, cohérent avec le backend
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
      };

      // Création du compte
      await registerUser(payload as any);

      // Connexion automatique
      const tokens = await loginUser(
        payload.username,
        payload.password
      );
      storeTokens(tokens);

      // Chargement du profil
      const rawProfile = await getProfile();
      const profile = normalizeUser(rawProfile as any);
      setUser(profile as any);

      // Redirection
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
        <section className="auth-page__intro">
          <div className="auth-page__logo">
            <div className="auth-page__logo-mark">JO</div>
            <div className="auth-page__logo-text">
              <span className="auth-page__logo-title">Paris 2024</span>
              <span className="auth-page__logo-subtitle">
                Billetterie e‑Tickets
              </span>
            </div>
          </div>

          <h1 className="auth-page__title">
            Créez votre compte
            <span>billetterie JO Paris 2024</span>
          </h1>

          <p className="auth-page__text">
            En créant un compte, vous pourrez réserver vos e‑billets,
            suivre vos commandes et accéder à vos événements.
          </p>
        </section>

        <section className="auth-page__panel">
          <div className="auth-card">
            <h2 className="auth-card__title">Créer un compte</h2>

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
             Vos données sont utilisées uniquement dans le cadre
            de ce projet pédagogique.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;