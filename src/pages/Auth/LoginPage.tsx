// src/pages/Auth/LoginPage.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  // Je récupère "from" quel que soit son format (string ou objet location).
  if (!state || !state.from) return null;
  if (typeof state.from === "string") return state.from;
  if (typeof state.from === "object" && state.from.pathname) return state.from.pathname;
  return null;
}

function isAdminProfile(profile: any): boolean {
  // Je considère admin si type_compte=ADMIN ou si les flags Django admin sont actifs.
  return (
    profile?.type_compte === "ADMIN" ||
    profile?.is_staff === true ||
    profile?.is_superuser === true
  );
}

function pickPostLoginTarget(profile: any, fromPath: string | null): string {
  // Je verrouille la règle :
  // - admin -> /admin (je respecte from uniquement si from commence par /admin)
  // - client -> from (si présent) sinon /mon-espace/commandes
  const admin = isAdminProfile(profile);

  if (admin) {
    return fromPath?.startsWith("/admin") ? fromPath : "/admin";
  }

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
    // Si déjà connecté et ouverture manuelle de /login, je redirige selon le profil en mémoire.
    if (!isAuthenticated || !user) return;

    // Je normalise aussi ici au cas où le profil en mémoire contient 0/1.
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

      // 1) Je récupère le couple access/refresh
      const tokens: JwtPair = await loginUser(username.trim(), password);

      // 2) Je stocke les tokens (axiosClient.ts les relit via auth_tokens et injecte Authorization)
      storeTokens(tokens);

      // 3) Je récupère le profil via /utilisateurs/me/
      const rawProfile = await getProfile();

      // 4) Je normalise le profil pour convertir 0/1 en true/false (cas classique avec Django)
      const profile = normalizeUser(rawProfile as any);

      // 5) Je garde un log utile pendant la mise au point (à retirer quand tout est stable)
      console.log("LOGIN: profile normalisé =", profile);
      console.log("LOGIN: fromPath =", fromPath);

      // 6) Je stocke le profil dans le contexte global
      setUser(profile as any);

      // 7) Je décide la destination uniquement à partir du profil normalisé
      const target = pickPostLoginTarget(profile, fromPath);
      console.log("LOGIN: cible =", target);

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
              <span className="auth-page__logo-subtitle">Billetterie e-Tickets</span>
            </div>
          </div>

          <h1 className="auth-page__title">
            Connexion à l’espace billetterie
            <span>JO Paris 2024</span>
          </h1>

          <p className="auth-page__text">
            Accès aux paniers, commandes et e-billets sécurisés.
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
                <button type="submit" className="auth-form__submit" disabled={loading}>
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