import React from "react";
import styles from "./LegalPage.module.css";
import { FiAlertTriangle, FiShield, FiCheckCircle } from "react-icons/fi";

export default function CGV() {
  return (
    <div className={styles.legalContainer}>
      <header
        className={styles.header}
        style={{
          background: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
        }}
      >
        <div className={styles.iconBox}>
          <FiAlertTriangle />
        </div>
        <h1>Avertissement sur les Risques & CGV</h1>
        <p>Cadre contractuel de l'investissement</p>
      </header>

      <section className={styles.content}>
        <div className={styles.riskBox}>
          <strong>SÉCURITÉ DU CAPITAL :</strong> Contrairement au crowdfunding
          classique, les projets Growzapp font l'objet d'un monitoring rigoureux
          et d'une couverture assurantielle partielle du capital investi.
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 1 : Modalités d'Investissement</h2>
          <p>
            L'investissement est validé après réception des fonds et validation
            du KYC. Un contrat électronique certifié est alors généré.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 2 : Monitoring et Suivi des Projets</h2>
          <p>
            Chaque projet financé est soumis au protocole de{" "}
            <strong>Monitoring Growzapp</strong> : visites de terrain
            mensuelles, contrôle des flux financiers et rapports de gestion
            trimestriels accessibles aux investisseurs.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 3 : Garantie de Capital (Assurance)</h2>
          <p>
            Les projets sont couverts par une{" "}
            <strong>assurance dommage/crédit</strong> souscrite auprès de nos
            partenaires. En cas de défaut total du projet, cette police permet
            un remboursement partiel du capital initial (selon les conditions
            spécifiques de chaque projet détaillées dans la fiche
            d'investissement).
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 4 : Rétractation et Juridiction</h2>
          <p>
            Délai de rétractation : 4 jours calendaires. Loi applicable : Droit
            de <strong>Côte d'Ivoire</strong>. Tribunal compétent :{" "}
            <strong>Yamoussoukro</strong>.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Investissement sous haute surveillance
      </footer>
    </div>
  );
}
