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
          <h2>{t("legal_pages.cgu.art2_title", "Article 2 : Définitions")}</h2>
          <p>{t("legal_pages.cgu.art2_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art3_title", "Article 3 : Éligibilité")}</h2>
          <p>{t("legal_pages.cgu.art3_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art4_title", "Article 4 : Création et gestion du compte")}</h2>
          <p>{t("legal_pages.cgu.art4_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art5_title", "Article 5 : Accès et Sécurité")}</h2>
          <p>{t("legal_pages.cgu.art5_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art6_title", "Article 6 : Vérification d'identité")}</h2>
          <p>{t("legal_pages.cgu.art6_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art7_title", "Article 7 : Statut d'Hébergeur et de Superviseur")}</h2>
          <p>{t("legal_pages.cgu.art7_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art8_title", "Article 8 : Propriété intellectuelle")}</h2>
          <p>{t("legal_pages.cgu.art8_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art9_title", "Article 9 : Obligations de l'utilisateur")}</h2>
          <p>{t("legal_pages.cgu.art9_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art10_title", "Article 10 : Responsabilité")}</h2>
          <p>{t("legal_pages.cgu.art10_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art11_title", "Article 11 : Suspension et résiliation")}</h2>
          <p>{t("legal_pages.cgu.art11_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art12_title", "Article 12 : Modification des CGU")}</h2>
          <p>{t("legal_pages.cgu.art12_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art13_title", "Article 13 : Droit applicable et juridiction")}</h2>
          <p>{t("legal_pages.cgu.art13_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art14_title", "Article 14 : GrowzMarket et Fournisseur")}</h2>
          <p>{t("legal_pages.cgu.art14_body")}</p>
        </div>

        <div className={styles.sectionCard}>
          <h2>{t("legal_pages.cgu.art15_title", "Article 15 : Dispositions diverses")}</h2>
          <p>{t("legal_pages.cgu.art15_body")}</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <FiShield /> {t("legal_pages.cgu.footer", "Growzapp - Supervision active et sécurisée")}
      </footer>
    </div>
  );
}
