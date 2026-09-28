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
          <h2>{t("legal_pages.rgpd.sec1_title", "1. Responsable du traitement")}</h2>
          <p>{t("legal_pages.rgpd.sec1_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec2_title", "2. Données collectées")}</h2>
          <p>{t("legal_pages.rgpd.sec2_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec3_title", "3. Finalités et bases légales")}</h2>
          <p>{t("legal_pages.rgpd.sec3_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec4_title", "4. Destinataires des données")}</h2>
          <p>{t("legal_pages.rgpd.sec4_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec5_title", "5. Transferts hors de la zone UEMOA")}</h2>
          <p>{t("legal_pages.rgpd.sec5_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec6_title", "6. Durées de conservation")}</h2>
          <p>{t("legal_pages.rgpd.sec6_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec7_title", "7. Sécurité des données")}</h2>
          <p>{t("legal_pages.rgpd.sec7_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec8_title", "8. Vérification d'identité (KYC)")}</h2>
          <p>{t("legal_pages.rgpd.sec8_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec9_title", "9. Cookies et traceurs")}</h2>
          <p>{t("legal_pages.rgpd.sec9_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec10_title", "10. Vos droits")}</h2>
          <p>{t("legal_pages.rgpd.sec10_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec11_title", "11. Mineurs")}</h2>
          <p>{t("legal_pages.rgpd.sec11_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.rgpd.sec12_title", "12. Modification de la présente politique")}</h2>
          <p>{t("legal_pages.rgpd.sec12_body")}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> {t("legal_pages.rgpd.footer", "Données chiffrées AES-256 - Hébergement certifié")}
      </footer>
    </div>
  );
}
