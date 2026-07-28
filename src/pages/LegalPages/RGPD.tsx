import styles from "./LegalPage.module.css";
import { FiLock, FiShield } from "react-icons/fi";

export default function RGPD() {
  return (
    <div className={styles.legalContainer}>
      <header
        className={styles.header}
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        }}
      >
        <div className={styles.iconBox}>
          <FiLock />
        </div>
        <h1>Protection des Données (RGPD)</h1>
        <p>Souveraineté et sécurité des informations</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>1. Responsable et Finalités</h2>
          <p>
            Les données sont collectées par <strong>Growzapp</strong> pour
            la gestion des investissements et le monitoring des projets.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>2. Données de Supervision</h2>
          <p>
            Dans le cadre du monitoring, Growzapp collecte des données
            opérationnelles sur les projets. Certaines données de performance
            peuvent être partagées avec les investisseurs concernés à des fins
            de transparence contractuelle.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>3. Souveraineté et Transfert</h2>
          <p>
            Le traitement est effectué au siège social en Afrique. Les
            investisseurs hors zone Afrique consentent au transfert de leurs
            données nécessaires à l'exécution de la garantie assurantielle et du
            suivi de leur investissement.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>4. Droits des utilisateurs</h2>
          <p>
            Accès, rectification et suppression via{" "}
            <strong>rgpd@my-growzapp.com</strong>.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Données chiffrées AES-256 - Hébergement certifié
      </footer>
    </div>
  );
}
