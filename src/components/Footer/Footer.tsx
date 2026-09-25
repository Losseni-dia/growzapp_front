import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";
import { FiShield, FiLinkedin, FiFacebook, FiInstagram } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Rss } from "lucide-react";
import { api, buildFileUrl } from "../../service/Api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface PartenaireDTO {
  id: number;
  nom: string;
  logoUrl: string;
}

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);

  useEffect(() => {
    api
      .get<{ data: PartenaireDTO[] }>("/api/fournisseurs/partenaires")
      .then((res) => setPartenaires(res.data || []))
      .catch(() => setPartenaires([]));
  }, []);

  // Fonction pour ouvrir la recherche FAQ dans Crisp
  const openCrispFAQ = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.$crisp) {
      // Ouvre la bulle de chat
      window.$crisp.push(["do", "chat:open"]);
      // Bascule immédiatement sur l'onglet Aide/Recherche
      window.$crisp.push(["do", "helpdesk:search"]);
    } else {
      // Solution de secours si Crisp est bloqué par un adblocker
      window.open("https://growzapp.crisp.help/fr/", "_blank");
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brand}>
            <span className={styles.logoText}>GrowzApp</span>
            <p>{t("site_footer.tagline", "Financez l'avenir, un projet à la fois.")}</p>

            <div className={styles.socials}>
              <a
                href="https://linkedin.com/company/growzapp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
              >
                <FiLinkedin />
              </a>
              <a
                href="https://facebook.com/growzapp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
              >
                <FiFacebook />
              </a>
              <a
                href="https://wa.me/237600000000"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialIcon} ${styles.whatsapp}`}
              >
                <FaWhatsapp />
              </a>
              <a
                href="https://instagram.com/growzapp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
              >
                <FiInstagram />
              </a>
              <a
                href={`${API_BASE_URL}/api/news/rss`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.rssLink}
                title={t("site_footer.rss_title", "Abonnez-vous au flux RSS") as string}
              >
                <Rss size={20} />
                <span className={styles.tooltip}>{t("site_footer.rss_tooltip", "Abonnez-vous")}</span>
              </a>
            </div>
          </div>

          <nav className={styles.nav}>
            <div className={styles.navColumn}>
              <h4>{t("site_footer.col_legal", "Légal")}</h4>
              <Link to="/mentions-legales" className={styles.link}>
                {t("site_footer.link_mentions_legales", "Mentions Légales")}
              </Link>
              <Link to="/cgu" className={styles.link}>
                {t("site_footer.link_cgu", "CGU")}
              </Link>
              <Link to="/rgpd" className={styles.link}>
                {t("site_footer.link_rgpd", "RGPD")}
              </Link>
            </div>
            <div className={styles.navColumn}>
              <h4>{t("site_footer.col_investissement", "Investissement")}</h4>
              <Link to="/cgv" className={styles.link}>
                {t("site_footer.link_cgv", "Risques & CGV")}
              </Link>
              {/* On remplace le Link par un bouton stylisé ou une balise 'a' avec onClick */}
              <a href="#faq" onClick={openCrispFAQ} className={styles.link}>
                {t("site_footer.link_faq", "Aide & FAQ")}
              </a>
              <Link to="/mon-espace/contact" className={styles.link}>
                {t("site_footer.link_contact", "Contactez-nous")}
              </Link>
            </div>
          </nav>
        </div>

        {partenaires.length > 0 && (
          <div className={styles.partenaires}>
            <h4>{t("site_footer.partners_title", "Nos partenaires")}</h4>
            <div className={styles.partenairesList}>
              {partenaires.map((p) => (
                <img
                  key={p.id}
                  src={buildFileUrl(p.logoUrl)}
                  alt={p.nom}
                  title={p.nom}
                  className={styles.partenaireLogo}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.bottomSection}>
          <p>{t("site_footer.copyright", "© {{year}} GrowzApp – Tous droits réservés", { year: currentYear })}</p>
          <div className={styles.secure}>
            <FiShield /> {t("site_footer.secure_transactions", "Transactions Sécurisées")}
          </div>
        </div>
      </div>
    </footer>
  );
}
