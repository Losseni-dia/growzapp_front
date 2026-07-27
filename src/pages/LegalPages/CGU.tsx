import styles from "./LegalPage.module.css";
import { FiFileText, FiShield } from "react-icons/fi";

export default function CGU() {
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header}>
        <div className={styles.iconBox}>
          <FiFileText />
        </div>
        <h1>Conditions Générales d'Utilisation</h1>
        <p>En vigueur au 03 Janvier 2026</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>Article 1 : Objet</h2>
          <p>
            Les présentes CGU définissent les modalités d'accès à la plateforme{" "}
            <strong>Growzapp</strong>. L'utilisation du site implique
            l'acceptation sans réserve des présentes conditions.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 2 : Accès et Sécurité</h2>
          <p>
            L'accès est réservé aux personnes majeures et capables.
            L'utilisateur est seul responsable de la sécurité de ses
            identifiants.
            <strong>Growzapp</strong> utilise des protocoles de sécurité
            avancés, mais l'utilisateur doit veiller à la sécurité de son propre
            équipement.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 3 : Statut d'Hébergeur et de Superviseur</h2>
          <p>
            <strong>Growzapp</strong> agit en tant qu'hébergeur pour les
            contenus fournis par les porteurs de projets. Parallèlement, la
            plateforme assure une mission de <strong>monitoring actif</strong>.
            Cette mission constitue une obligation de moyens : Growzapp déploie
            ses meilleurs efforts pour surveiller l'exécution des projets, sans
            toutefois se substituer à la gestion opérationnelle du porteur de
            projet.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 4 : Responsabilité</h2>
          <p>
            La responsabilité de Growzapp est limitée à sa mission de mise en
            relation et de supervision. Elle ne saurait être engagée en cas de
            force majeure, de fausse déclaration d'un tiers non détectable par
            un audit standard, ou d'aléas climatiques impactant les projets
            agricoles.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Growzapp - Supervision active et sécurisée
      </footer>
    </div>
  );
}
