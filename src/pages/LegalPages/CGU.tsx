import React from 'react';
import styles from "./LegalPage.module.css";
import { FiFileText, FiShield } from "react-icons/fi";

export default function CGU() {
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header}>
        <div className={styles.iconBox}><FiFileText /></div>
        <h1>Conditions Générales d'Utilisation</h1>
        <p>En vigueur au 03 Janvier 2026</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>Article 1 : Objet</h2>
          <p>
            Les présentes CGU ont pour objet de définir les modalités de mise à disposition des services de la plateforme <strong>Growzapp</strong>. 
            L'utilisation du site implique l'acceptation pleine et entière des conditions décrites ci-après.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 2 : Accès au service</h2>
          <p>
            L'accès à la plateforme est réservé aux personnes physiques majeures et capables. 
            L'utilisateur est responsable de la confidentialité de ses identifiants de connexion. 
            <strong>Growzapp</strong> se réserve le droit de suspendre tout compte en cas de non-respect des présentes conditions.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 3 : Propriété intellectuelle</h2>
          <p>
            Tous les éléments reproduits sur ce site (logos, photographies, textes, code source, design) 
            sont protégés par le droit d'auteur. Toute reproduction ou distribution sans autorisation préalable 
            expose l'utilisateur à des poursuites judiciaires.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>Article 4 : Responsabilité</h2>
          <p>
            Growzapp s'efforce d'assurer la précision des informations diffusées. Toutefois, la plateforme 
            ne saurait être tenue responsable des interruptions de service ou des erreurs techniques indépendantes de sa volonté.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> Growzapp - Utilisation sécurisée et réglementée
      </footer>
    </div>
  );
}