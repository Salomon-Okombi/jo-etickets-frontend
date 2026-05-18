import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import NavCartButton from "@/components/common/NavCartButton";

function isAdminUser(user: any): boolean {
  return (
    user?.role === "ADMIN" ||
    user?.is_staff === true ||
    user?.is_superuser === true
  );
}

function getInitials(user: any): string {
  const first = user?.first_name?.[0] ?? "";
  const last = user?.last_name?.[0] ?? "";
  if (first || last) return (first + last).toUpperCase();
  return user?.username?.[0]?.toUpperCase() ?? "U";
}

export default function MainHeader() {
  const { isAuthenticated, user, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = Boolean(isAuthenticated && isAdminUser(user));
  const mySpaceLink = isAdmin ? "/admin" : "/mon-espace/commandes";

  const baseNavLinks = [
    { to: "/", label: "Accueil" },
    { to: "/evenements", label: "Événements" },
    { to: "/offres", label: "Offres" },
  ];

  const navLinks = isAdmin
    ? [...baseNavLinks, { to: "/admin", label: "Dashboard" }]
    : baseNavLinks;

  const handleLogout = () => {
    logout?.();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /* ============================
     Fermer menu utilisateur au clic extérieur
  ============================ */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="main-header">
      <div className="main-header__inner">
        {/* LOGO */}
        <Link to="/" className="main-header__logo" onClick={closeMobileMenu}>
          <div className="main-header__logo-mark">JO</div>
          <div className="main-header__logo-text">
            <span className="main-header__logo-title">Paris 2024</span>
            <span className="main-header__logo-subtitle">e‑Tickets</span>
          </div>
        </Link>

        {/* NAV DESKTOP */}
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

        {/* ACTIONS */}
        <div className="main-header__actions">
          <NavCartButton />

          {!isAuthenticated && (
            <>
              <Link to="/login" className="main-header__action-link">
                Se connecter
              </Link>
              <Link to="/register" className="main-header__cta">
                S’inscrire
              </Link>
            </>
          )}

          {isAuthenticated && user && (
            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-avatar"
                onClick={() => setIsUserMenuOpen((v) => !v)}
                aria-label="Menu utilisateur"
              >
                {user.photo_profil_url ? (
                  <img src={user.photo_profil_url} alt="Avatar utilisateur" />
                ) : (
                  <span className="avatar-placeholder">{getInitials(user)}</span>
                )}
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown__header">
                    <strong>{user.first_name || user.username}</strong>
                    <small>{user.email}</small>
                  </div>

                  <Link to="/mon-espace/profil" onClick={() => setIsUserMenuOpen(false)}>
                    Mon profil
                  </Link>

                  <Link to={mySpaceLink} onClick={() => setIsUserMenuOpen(false)}>
                    Mon espace
                  </Link>

                  <button type="button" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BURGER MOBILE */}
          <button
            type="button"
            className={`main-header__burger ${isMobileMenuOpen ? "main-header__burger--open" : ""}`}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* NAV MOBILE */}
      <div className={`main-header__mobile-nav ${isMobileMenuOpen ? "main-header__mobile-nav--open" : ""}`}>
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

          {isAuthenticated && (
            <div className="main-header__mobile-actions">
              <Link to="/mon-espace/profil" onClick={closeMobileMenu}>
                Mon profil
              </Link>
              <Link to={mySpaceLink} onClick={closeMobileMenu}>
                Mon espace
              </Link>
              <button type="button" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}