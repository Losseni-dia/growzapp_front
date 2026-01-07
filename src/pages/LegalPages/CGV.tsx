import React from 'react';
import styles from "./LegalPage.module.css";
import { FiAlertTriangle, FiShield, FiTrendingUp } from "react-icons/fi";

export default function CGV() {
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header} style={{ background: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)' }}>
        <div className={styles.iconBox}><FiAlertTriangle /></div>
        <h1>Avertissement sur les Risques & CGV</h1>
        <p>Informations essentielles pour l'investisseur</p>
      </header>

      <section className={styles.content}>
        <div className={styles.riskBox}>
          <strong>ATTENTION :</strong> L'investissement dans des projets de financement participatif comporte des risques de perte totale ou partielle du capital investi ainsi que des risques d'illiquidité.
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 1 : Modalités d'Investissement</h2>
          <p>
            L'investissement est validé dès réception des fonds par notre prestataire de paiement agréé. 
            Un contrat électronique est généré pour chaque participation.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 2 : Frais de Plateforme</h2>
          <p>
            Growzapp rémunère ses services par une commission prélevée sur le montant collecté par le porteur de projet. 
            Sauf mention contraire, aucun frais n'est appliqué à l'investisseur lors de la souscription.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 3 : Droit de Rétractation</h2>
          <p>
            Conformément à la réglementation, l'investisseur dispose d'un délai de <strong>4 jours calendaires</strong> 
            (selon la législation en vigueur) pour annuler son investissement sans frais.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Investissez de manière responsable
      </footer>
    </div>
  );
}