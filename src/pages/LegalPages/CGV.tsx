import styles from "./LegalPage.module.css";
import { FiAlertTriangle, FiShield } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function CGV() {
  const { t } = useTranslation();
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
        <h1>{t("legal_pages.cgv.title", "Avertissement sur les Risques & CGV")}</h1>
        <p>{t("legal_pages.cgv.subtitle", "Cadre contractuel de l'investissement")}</p>
      </header>

      <section className={styles.content}>
        <div className={styles.riskBox}>{t("legal_pages.cgv.risk_box")}</div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgv.art1_title", "Article 1 : Modalités d'Investissement")}</h2>
          <p>{t("legal_pages.cgv.art1_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgv.art2_title", "Article 2 : Monitoring et Suivi des Projets")}</h2>
          <p>{t("legal_pages.cgv.art2_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgv.art3_title", "Article 3 : Garantie de Capital (Assurance)")}</h2>
          <p>{t("legal_pages.cgv.art3_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgv.art4_title", "Article 4 : Rétractation et Juridiction")}</h2>
          <p>{t("legal_pages.cgv.art4_body")}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> {t("legal_pages.cgv.footer", "Investissement sous haute surveillance")}
      </footer>
    </div>
  );
}
