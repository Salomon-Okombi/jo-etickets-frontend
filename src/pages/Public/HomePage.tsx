import { Link } from "react-router-dom";
import heroBg from "../../assets/images/ticket.jpg";

const HomePage: React.FC = () => {
  return (
    <div className="home">
      {/* HERO */}
      <section
        className="home-hero" 
        style={{
          backgroundImage: `
            linear-gradient(120deg, rgba(1, 14, 61, 0.9), rgba(134, 150, 200, 0.9)),
            url(${heroBg})
          `,
        }}
      >
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">Billetterie officielle – e-tickets sécurisés</p>
          <h1 className="home-hero__title">
            Vivez les Jeux Olympiques
            <span> Paris 2024</span>
          </h1>
          <p className="home-hero__subtitle">
            Réservez vos e-billets pour les plus grandes épreuves : athlétisme, natation,
            gymnastique, sports collectifs… Choisissez votre offre Solo, Duo ou Famille
            et recevez vos tickets 100% numériques, sécurisés par QR code.
          </p>

          <div className="home-hero__actions">
            <Link to="/offres" className="home-hero__cta home-hero__cta--primary">
              Découvrir les offres
            </Link>
            <Link to="/evenements" className="home-hero__cta home-hero__cta--secondary">
              Voir les épreuves
            </Link>
          </div>

          <div className="home-hero__meta">
            <span>e-billets nominatifs</span>
            <span>Contrôle sécurisé par QR Code</span>
            <span>Pas de file d’attente au guichet</span>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="home-steps">
        <div className="home-section__inner">
          <h2 className="home-section__title">Comment ça marche&nbsp;?</h2>
          <p className="home-section__subtitle">
            En quelques étapes, réservez vos places pour les épreuves des Jeux Olympiques
            et recevez vos e-billets sécurisés.
          </p>

          <div className="home-steps__grid">
            <div className="home-step-card">
              <div className="home-step-card__number">1</div>
              <h3 className="home-step-card__title">Choisissez vos épreuves</h3>
              <p className="home-step-card__text">
                Parcourez le calendrier des Jeux Olympiques, découvrez les disciplines et
                sélectionnez les épreuves qui vous intéressent.
              </p>
              <Link to="/evenements" className="home-step-card__link">
                Voir les épreuves
              </Link>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">2</div>
              <h3 className="home-step-card__title">Sélectionnez une offre</h3>
              <p className="home-step-card__text">
                Choisissez une offre Solo, Duo ou Famille selon le nombre de personnes
                (1, 2 ou 4 billets) et ajoutez-la à votre panier.
              </p>
              <Link to="/offres" className="home-step-card__link">
                Voir les offres
              </Link>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">3</div>
              <h3 className="home-step-card__title">Recevez vos e-billets</h3>
              <p className="home-step-card__text">
                Créez votre compte, validez votre commande et obtenez vos e-billets
                sous forme de QR Code, prêts à être scannés le jour J.
              </p>
              <Link to="/register" className="home-step-card__link">
                Créer mon compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUELQUES ÉPREUVES */}
      <section className="home-events">
        <div className="home-section__inner">
          <h2 className="home-section__title">Quelques épreuves phares</h2>
          <p className="home-section__subtitle">
            Athlétisme au Stade de France, finales de natation, matchs de basket décisifs…
            Découvrez un aperçu des épreuves disponibles à la réservation.
          </p>

          <div className="home-events__grid">
            <article className="home-event-card">
              <h3 className="home-event-card__title">Finale 100m Athlétisme</h3>
              <p className="home-event-card__meta">
                Stade de France · Sprint · Ambiance électrique
              </p>
              <p className="home-event-card__text">
                Vivez la course la plus rapide des Jeux, avec les meilleurs sprinteurs
                mondiaux en lice pour l’or olympique.
              </p>
            </article>

            <article className="home-event-card">
              <h3 className="home-event-card__title">Finales Natation</h3>
              <p className="home-event-card__meta">
                Centre aquatique · 50m & 100m nage libre
              </p>
              <p className="home-event-card__text">
                Des arrivées au centième de seconde et une ambiance survoltée dans
                les tribunes, au plus près des bassins.
              </p>
            </article>

            <article className="home-event-card">
              <h3 className="home-event-card__title">Basket – Match décisif</h3>
              <p className="home-event-card__meta">
                Arena · Tour final masculin
              </p>
              <p className="home-event-card__text">
                Les plus grandes stars du basket mondial réunies pour un match à
                couper le souffle, direction la médaille.
              </p>
            </article>
          </div>

          <div className="home-section__cta-row">
            <Link to="/evenements" className="home-section__link">
              Explorer toutes les épreuves
            </Link>
          </div>
        </div>
      </section>

      {/* OFFRES SOLO / DUO / FAMILLE */}
      <section className="home-offers">
        <div className="home-section__inner home-offers__inner">
          <div className="home-offers__intro">
            <h2 className="home-section__title">Des offres pour tous les publics</h2>
            <p className="home-section__subtitle">
              Que vous veniez seul, en couple ou en famille, choisissez l’offre qui
              correspond le mieux à votre expérience des Jeux Olympiques.
            </p>
            <Link to="/offres" className="home-hero__cta home-hero__cta--primary">
              Voir toutes les offres
            </Link>
          </div>

          <div className="home-offers__grid">
            <article className="home-offer-card">
              <h3 className="home-offer-card__title">Offre Solo</h3>
              <p className="home-offer-card__badge">1 personne</p>
              <p className="home-offer-card__text">
                Idéale pour vivre une épreuve en solo, au plus près de l’action, avec un
                e-billet nominatif sécurisé.
              </p>
            </article>

            <article className="home-offer-card">
              <h3 className="home-offer-card__title">Offre Duo</h3>
              <p className="home-offer-card__badge">2 personnes</p>
              <p className="home-offer-card__text">
                Partagez un moment unique à deux pour encourager vos athlètes
                préférés depuis les tribunes.
              </p>
            </article>

            <article className="home-offer-card">
              <h3 className="home-offer-card__title">Offre Famille</h3>
              <p className="home-offer-card__badge">4 personnes</p>
              <p className="home-offer-card__text">
                Vivez la magie des Jeux en famille avec une offre adaptée aux foyers,
                pour créer des souvenirs inoubliables.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SÉCURITÉ DES E-BILLETS */}
      <section className="home-security">
        <div className="home-section__inner home-security__inner">
          <div className="home-security__content">
            <h2 className="home-section__title">Des e-billets sécurisés de bout en bout</h2>
            <p className="home-section__subtitle">
              Chaque e-billet est protégé par une double clé et un QR Code unique. Le jour
              des épreuves, un simple scan permet de vérifier l’authenticité du ticket et
              l’identité de son titulaire.
            </p>

            <ul className="home-security__list">
              <li>
                <strong>Clé de compte</strong> générée lors de la création de votre compte
                (non visible pour vous, gérée par l’organisation).
              </li>
              <li>
                <strong>Clé de billet</strong> générée à l’achat et concaténée avec la clé
                de compte pour sécuriser le e-billet.
              </li>
              <li>
                <strong>QR Code unique</strong> scanné à l’entrée pour valider votre accès
                à l’épreuve choisie.
              </li>
            </ul>
          </div>

          <div className="home-security__highlight">
            <p className="home-security__tag">Anti-fraude</p>
            <p className="home-security__text">
              Fini les falsifications de tickets physiques : tout se fait depuis votre espace
              en ligne, avec des billets numériques infalsifiables.
            </p>
            <Link to="/register" className="home-hero__cta home-hero__cta--secondary">
              Créer un compte sécurisé
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
