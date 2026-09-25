import styles from "./LegalPage.module.css";
import { FiLock, FiShield } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function RGPD() {
  const { t } = useTranslation();
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
        <h1>{t("legal_pages.rgpd.title", "Protection des Données (RGPD)")}</h1>
        <p>{t("legal_pages.rgpd.subtitle", "Souveraineté et sécurité des informations")}</p>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec1_title", "1. Responsable et Finalités")}</h2>
          <p>{t("legal_pages.rgpd.sec1_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec2_title", "2. Données de Supervision")}</h2>
          <p>{t("legal_pages.rgpd.sec2_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec3_title", "3. Souveraineté et Transfert")}</h2>
          <p>{t("legal_pages.rgpd.sec3_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec4_title", "4. Droits des utilisateurs")}</h2>
          <p>{t("legal_pages.rgpd.sec4_body")}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> {t("legal_pages.rgpd.footer", "Données chiffrées AES-256 - Hébergement certifié")}
      </footer>
    </div>
  );
}
