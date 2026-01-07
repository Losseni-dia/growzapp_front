import React from 'react';
import styles from "./LegalPage.module.css"; // Crée ce fichier CSS pour le style
import { FiShield, FiInfo } from "react-icons/fi";

export default function MentionsLegales() {
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header}>
        <div className={styles.iconBox}><FiInfo /></div>
        <h1>Mentions Légales</h1>
        <p>Dernière mise à jour : 03 Janvier 2026</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>1. Éditeur du site</h2>
          <p>
            Le site <strong>Growzapp</strong> est édité par la société <strong>[NOM_SOCIETE]</strong>, 
            [Forme juridique : ex SAS] au capital de <strong>[MONTANT]</strong> €, 
            immatriculée au Registre du Commerce et des Sociétés de [VILLE] 
            sous le numéro <strong>[NUMERO_RCS]</strong>.
          </p>
          <p>Siège social : [ADRESSE_COMPLETE]</p>
          <p>Numéro de TVA intracommunautaire : [NUMERO_TVA]</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>2. Directeur de la publication</h2>
          <p>Le directeur de la publication est <strong>[NOM_DU_DIRIGEANT]</strong>, en sa qualité de [FONCTION].</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>3. Hébergement</h2>
          <p>
            Le site est hébergé par <strong>[NOM_HEBERGEUR]</strong>.<br />
            Adresse : [ADRESSE_HEBERGEUR]<br />
            Contact : [TELEPHONE_HEBERGEUR]
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>4. Contact</h2>
          <p>Pour toute question, vous pouvez nous contacter :</p>
          <ul>
            <li>Email : <strong>support@growzapp.com</strong></li>
            <li>Téléphone : [NUMERO_TELEPHONE]</li>
          </ul>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Growzapp - Plateforme de financement sécurisée
      </footer>
    </div>
  );
}