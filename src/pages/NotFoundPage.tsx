// src/pages/NotFoundPage.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="not-found">
      <div className="not-found__inner">
        <div className="not-found__badge">404</div>

        <h1 className="not-found__title">
          Page introuvable
        </h1>

        <p className="not-found__text">
          L&apos;adresse <code>{location.pathname}</code> ne correspond à aucune
          page de la billetterie JO Paris 2024. Il est possible que le lien
          soit incorrect ou que la page n&apos;existe plus.
        </p>

        <div className="not-found__actions">
          <Link to="/" className="not-found__btn not-found__btn--primary">
            Retour à l&apos;accueil
          </Link>
          <Link to="/evenements" className="not-found__btn not-found__btn--ghost">
            Voir les épreuves
          </Link>
        </div>

        <p className="not-found__hint">
          Besoin d&apos;un billet ? Rendez-vous dans la section{" "}
          <Link to="/offres">Offres</Link> pour choisir une formule Solo, Duo ou
          Famille.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
