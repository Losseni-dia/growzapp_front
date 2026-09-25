import styles from "./LegalPage.module.css"; // Crée ce fichier CSS pour le style
import { FiShield, FiInfo } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function MentionsLegales() {
  const { t } = useTranslation();
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header}>
        <div className={styles.iconBox}>
          <FiInfo />
        </div>
        <h1>{t("legal_pages.mentions_legales.title", "Mentions Légales")}</h1>
        <p>{t("legal_pages.mentions_legales.updated_at", "Dernière mise à jour : 03 Janvier 2026")}</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.mentions_legales.sec1_title", "1. Éditeur du site")}</h2>
          <p>{t("legal_pages.mentions_legales.sec1_body")}</p>
          <p>{t("legal_pages.mentions_legales.sec1_nif", "Identifiant Fiscal (NIF/IFU) : [VOTRE_NUMERO]")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.mentions_legales.sec2_title", "2. Directeur de la publication")}</h2>
          <p>{t("legal_pages.mentions_legales.sec2_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.mentions_legales.sec3_title", "3. Hébergement")}</h2>
          <p>
            {t("legal_pages.mentions_legales.sec3_host", "Le site est hébergé par [NOM_HEBERGEUR].")}
            <br />
            {t("legal_pages.mentions_legales.sec3_address", "Adresse : [ADRESSE_HEBERGEUR]")}
            <br />
            {t("legal_pages.mentions_legales.sec3_contact", "Contact : [TELEPHONE_HEBERGEUR]")}
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.mentions_legales.sec4_title", "4. Contact")}</h2>
          <p>{t("legal_pages.mentions_legales.sec4_intro", "Pour toute question, vous pouvez nous contacter :")}</p>
          <ul>
            <li>{t("legal_pages.mentions_legales.sec4_email", "Email : support@my-growzapp.com")}</li>
            <li>{t("legal_pages.mentions_legales.sec4_phone", "Téléphone : [NUMERO_TELEPHONE]")}</li>
          </ul>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> {t("legal_pages.mentions_legales.footer", "Growzapp - Plateforme de financement sécurisée")}
      </footer>
    </div>
  );
}
