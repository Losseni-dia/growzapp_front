import React from 'react';
import styles from "./LegalPage.module.css";
import { FiLock, FiShield, FiEye } from "react-icons/fi";

export default function RGPD() {
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
        <div className={styles.iconBox}><FiLock /></div>
        <h1>Protection des Données (RGPD)</h1>
        <p>Respect de votre vie privée et de vos données</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>1. Responsable du traitement</h2>
          <p>Les données personnelles sont collectées par la société <strong>[NOM_SOCIETE]</strong>, éditrice de Growzapp.</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>2. Données collectées</h2>
          <p>Nous collectons les informations nécessaires à votre investissement :</p>
          <ul>
            <li><strong>Identité :</strong> Nom, prénom, copie de pièce d'identité (KYC).</li>
            <li><strong>Contact :</strong> Adresse email, numéro de téléphone.</li>
            <li><strong>Finances :</strong> RIB, origine des fonds, historique des transactions.</li>
          </ul>
        </div>

        <div className={styles.sectionCard}>
          <h2>3. Finalités et Conservation</h2>
          <p>Vos données sont traitées pour la gestion de vos contrats et le respect des obligations de lutte contre le blanchiment (LCB-FT).</p>
          <div className={styles.infoBadge}>⏱️ Durée de conservation : 10 ans pour les documents financiers.</div>
        </div>

        <div className={styles.sectionCard}>
          <h2>4. Vos Droits</h2>
          <p>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. 
            Pour toute demande, contactez notre DPO à : <strong>rgpd@growzapp.com</strong>.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Vos données sont cryptées et stockées en Europe
      </footer>
    </div>
  );
}