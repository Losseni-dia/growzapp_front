import styles from "./LegalPage.module.css";
import { FiFileText, FiShield } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function CGU() {
  const { t } = useTranslation();
  return (
    <div className={styles.legalContainer}>
      <header className={styles.header}>
        <div className={styles.iconBox}>
          <FiFileText />
        </div>
        <h1>{t("legal_pages.cgu.title", "Conditions Générales d'Utilisation")}</h1>
        <p>{t("legal_pages.cgu.updated_at", "En vigueur au 03 Janvier 2026")}</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art1_title", "Article 1 : Objet")}</h2>
          <p>{t("legal_pages.cgu.art1_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art2_title", "Article 2 : Accès et Sécurité")}</h2>
          <p>{t("legal_pages.cgu.art2_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art3_title", "Article 3 : Statut d'Hébergeur et de Superviseur")}</h2>
          <p>{t("legal_pages.cgu.art3_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art4_title", "Article 4 : Responsabilité")}</h2>
          <p>{t("legal_pages.cgu.art4_body")}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> {t("legal_pages.cgu.footer", "Growzapp - Supervision active et sécurisée")}
      </footer>
    </div>
  );
}
