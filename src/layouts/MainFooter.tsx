import { Link } from "react-router-dom";

const MainFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="main-footer__inner">
        {/* Colonne 1 : Branding */}
        <div className="main-footer__col">
          <div className="main-footer__logo">
            <div className="main-footer__logo-mark">JO</div>
            <div className="main-footer__logo-text">
              <span className="main-footer__logo-title">Paris 2024</span>
              <span className="main-footer__logo-subtitle">Billetterie e-Tickets</span>
            </div>
          </div>
          <p className="main-footer__text">
            Plateforme de réservation d’e-billets pour les Jeux Olympiques Paris 2024.
            Sélectionnez vos épreuves, vos offres et recevez vos tickets 100% numériques,
            sécurisés par QR Code.
          </p>
        </div>

        {/* Colonne 2 : Billetterie */}
        <div className="main-footer__col">
          <h4 className="main-footer__col-title">Billetterie</h4>
          <ul className="main-footer__list">
            <li>
              <Link to="/evenements" className="main-footer__link">
                Épreuves & événements
              </Link>
            </li>
            <li>
              <Link to="/offres" className="main-footer__link">
                Offres Solo / Duo / Famille
              </Link>
            </li>
            <li>
              <Link to="/mon-espace/commandes" className="main-footer__link">
                Mes commandes
              </Link>
            </li>
            <li>
              <Link to="/mon-espace/billets" className="main-footer__link">
                Mes e-billets
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 : Compte */}
        <div className="main-footer__col">
          <h4 className="main-footer__col-title">Mon compte</h4>
          <ul className="main-footer__list">
            <li>
              <Link to="/login" className="main-footer__link">
                Se connecter
              </Link>
            </li>
            <li>
              <Link to="/register" className="main-footer__link">
                Créer un compte
              </Link>
            </li>
            <li>
              <Link to="/mon-espace/commandes" className="main-footer__link">
                Suivre ma commande
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 4 : Infos / sécurité */}
        <div className="main-footer__col">
          <h4 className="main-footer__col-title">Informations</h4>
          <ul className="main-footer__list">
            <li>
              <span className="main-footer__link main-footer__link--muted">
                Sécurité des e-billets
              </span>
            </li>
            <li>
              <span className="main-footer__link main-footer__link--muted">
                Contrôle par QR Code
              </span>
            </li>
            <li>
              <span className="main-footer__link main-footer__link--muted">
                Accès dématérialisé aux sites olympiques
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bas de page */}
      <div className="main-footer__bottom">
        <div className="main-footer__bottom-inner">
          <p className="main-footer__copy">
            © {currentYear} Paris 2024 – Plateforme de billetterie.
          </p>
          <div className="main-footer__bottom-links">
            <span className="main-footer__bottom-link">Mentions légales</span>
            <span className="main-footer__bottom-sep">·</span>
            <span className="main-footer__bottom-link">Conditions générales</span>
            <span className="main-footer__bottom-sep">·</span>
            <span className="main-footer__bottom-link">Protection des données</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
