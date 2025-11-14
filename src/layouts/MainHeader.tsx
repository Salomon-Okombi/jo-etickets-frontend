import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MainHeader: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/evenements", label: "Événements" },
    { to: "/offres", label: "Offres" },
  ];

  const handleLogout = () => {
    logout?.();
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="main-header">
      <div className="main-header__inner">
        {/* Logo */}
        <Link to="/" className="main-header__logo" onClick={closeMobileMenu}>
          <div className="main-header__logo-mark">JO</div>
          <div className="main-header__logo-text">
            <span className="main-header__logo-title">Paris 2024</span>
            <span className="main-header__logo-subtitle">e-Tickets</span>
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="main-header__nav main-header__nav--desktop">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "main-header__nav-link",
                  isActive ? "main-header__nav-link--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions + burger */}
        <div className="main-header__actions">
          {isAuthenticated ? (
            <>
              <span className="main-header__welcome">
                Bonjour, <strong>{user?.username || user?.email}</strong>
              </span>
              <Link
                to="/mon-espace/commandes"
                className="main-header__action-link"
              >
                Mon espace
              </Link>
              <button
                type="button"
                className="main-header__cta main-header__cta--outline"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="main-header__action-link">
                Se connecter
              </Link>
              <Link to="/register" className="main-header__cta">
                S&apos;inscrire
              </Link>
            </>
          )}

          <button
            type="button"
            className={`main-header__burger ${
              isMobileMenuOpen ? "main-header__burger--open" : ""
            }`}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`main-header__mobile-nav ${
          isMobileMenuOpen ? "main-header__mobile-nav--open" : ""
        }`}
      >
        <nav className="main-header__nav main-header__nav--mobile">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                [
                  "main-header__nav-link",
                  "main-header__nav-link--mobile",
                  isActive ? "main-header__nav-link--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="main-header__mobile-actions">
            {isAuthenticated ? (
              <>
                <Link
                  to="/mon-espace/commandes"
                  className="main-header__action-link main-header__action-link--mobile"
                  onClick={closeMobileMenu}
                >
                  Mon espace
                </Link>
                <button
                  type="button"
                  className="main-header__cta main-header__cta--full"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="main-header__action-link main-header__action-link--mobile"
                  onClick={closeMobileMenu}
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="main-header__cta main-header__cta--full"
                  onClick={closeMobileMenu}
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default MainHeader;
