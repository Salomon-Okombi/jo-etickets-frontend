//src/layouts/MainHeader.tsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import NavCartButton from "@/components/common/NavCartButton";

function isAdminUser(profile: any): boolean {
  return profile?.role === "ADMIN" || profile?.is_staff === true || profile?.is_superuser === true;
}

const MainHeader: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = isAuthenticated && isAdminUser(user);
  const mySpaceLink = isAdmin ? "/admin" : "/mon-espace/commandes";

  const baseNavLinks = [
    { to: "/", label: "Accueil" },
    { to: "/evenements", label: "Événements" },
    { to: "/offres", label: "Offres" },
  ];

  const navLinks = isAdmin ? [...baseNavLinks, { to: "/admin", label: "Dashboard" }] : baseNavLinks;

  const handleLogout = () => {
    logout?.();
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="main-header">
      <div className="main-header__inner">
        <Link to="/" className="main-header__logo" onClick={closeMobileMenu}>
          <div className="main-header__logo-mark">JO</div>
          <div className="main-header__logo-text">
            <span className="main-header__logo-title">Paris 2024</span>
            <span className="main-header__logo-subtitle">e-Tickets</span>
          </div>
        </Link>

        <nav className="main-header__nav main-header__nav--desktop">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                ["main-header__nav-link", isActive ? "main-header__nav-link--active" : ""].filter(Boolean).join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="main-header__actions">
          {/* ✅ Panier toujours visible */}
          <div onClick={closeMobileMenu}>
            <NavCartButton />
          </div>

          {isAuthenticated ? (
            <>
              <span className="main-header__welcome">
                Bonjour, <strong>{user?.username || user?.email}</strong>
              </span>

              <Link to={mySpaceLink} className="main-header__action-link" onClick={closeMobileMenu}>
                Mon espace
              </Link>

              <button type="button" className="main-header__cta main-header__cta--outline" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="main-header__action-link" onClick={closeMobileMenu}>
                Se connecter
              </Link>
              <Link to="/register" className="main-header__cta" onClick={closeMobileMenu}>
                S'inscrire
              </Link>
            </>
          )}

          <button
            type="button"
            className={`main-header__burger ${isMobileMenuOpen ? "main-header__burger--open" : ""}`}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`main-header__mobile-nav ${isMobileMenuOpen ? "main-header__mobile-nav--open" : ""}`}>
        <nav className="main-header__nav main-header__nav--mobile">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                ["main-header__nav-link", "main-header__nav-link--mobile", isActive ? "main-header__nav-link--active" : ""]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="main-header__mobile-actions">
            <div onClick={closeMobileMenu}>
              <NavCartButton />
            </div>

            {isAuthenticated ? (
              <>
                <Link to={mySpaceLink} className="main-header__action-link main-header__action-link--mobile" onClick={closeMobileMenu}>
                  Mon espace
                </Link>
                <button type="button" className="main-header__cta main-header__cta--full" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="main-header__action-link main-header__action-link--mobile" onClick={closeMobileMenu}>
                  Se connecter
                </Link>
                <Link to="/register" className="main-header__cta main-header__cta--full" onClick={closeMobileMenu}>
                  S'inscrire
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