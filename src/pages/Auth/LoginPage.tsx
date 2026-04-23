// src/pages/Auth/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser, type JwtPair, storeTokens, getProfile } from "@/api/auth.api";
import { normalizeUser } from "@/utils/authNormalize";
import useAuth from "@/hooks/useAuth";

type LocationState =
  | {
      from?: string | { pathname?: string };
      eventId?: number;
      selectedOfferId?: number;
    }
  | undefined;

function resolveFromPath(state: LocationState): string | null {
  if (!state || !state.from) return null;
  if (typeof state.from === "string") return state.from;
  if (typeof state.from === "object" && state.from.pathname) return state.from.pathname;
  return null;
}

// ✅ ALIGNÉ AVEC LE BACKEND (Utilise `role`)
function isAdminProfile(profile: any): boolean {
  return (
    profile?.role === "ADMIN" ||
    profile?.is_staff === true ||
    profile?.is_superuser === true
  );
}

function pickPostLoginTarget(profile: any, fromPath: string | null): string {
  const admin = isAdminProfile(profile);

  if (admin) {
    return fromPath?.startsWith("/admin") ? fromPath : "/admin";
  }

  // Si l'utilisateur venait du tunnel paiement
  if (fromPath === "/checkout") return "/checkout";

  return fromPath ?? "/mon-espace/commandes";
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, setUser, user } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromPath = useMemo(
    () => resolveFromPath(location.state as LocationState),
    [location.state]
  );

  useEffect(() => {
    // Si déjà connecté et accès manuel à /login
    if (!isAuthenticated || !user) return;

    const normalized = normalizeUser(user as any);
    const target = pickPostLoginTarget(normalized, fromPath);
    navigate(target, { replace: true });
  }, [isAuthenticated, user, fromPath, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Merci de renseigner vos identifiants.");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ JWT
      const tokens: JwtPair = await loginUser(username.trim(), password);
      storeTokens(tokens);

      // 2️⃣ Profil
      const rawProfile = await getProfile();
      const profile = normalizeUser(rawProfile as any);

      // 3️⃣ Contexte auth
      setUser(profile as any);

      // 4️⃣ Redirection
      const target = pickPostLoginTarget(profile, fromPath);
      navigate(target, { replace: true });
    } catch (err) {
      console.error("LOGIN: erreur =", err);
      setError("Échec de la connexion. Vérifiez le nom d’utilisateur et le mot de passe.");
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
              <span className="auth-page__logo-subtitle">Billetterie e‑Tickets</span>
            </div>
          </div>

          <h1 className="auth-page__title">
            Connexion à l’espace billetterie
            <span>JO Paris 2024</span>
          </h1>

          <p className="auth-page__text">
            Accès aux paniers, commandes et e‑billets sécurisés.
          </p>
        </section>

        <section className="auth-page__panel">
          <div className="auth-card">
            <h2 className="auth-card__title">Se connecter</h2>

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

          <p className="auth-page__security">🔐 Sécurité : accès protégé.</p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;