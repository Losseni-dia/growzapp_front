import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import { FiShield, FiLinkedin, FiFacebook, FiInstagram } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
            <p>Financez l'avenir, un projet à la fois.</p>
            
            <div className={styles.socials}>
              <a href="https://linkedin.com/company/growzapp" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <FiLinkedin />
              </a>
              <a href="https://facebook.com/growzapp" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <FiFacebook />
              </a>
              <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} ${styles.whatsapp}`}>
                <FaWhatsapp />
              </a>
              <a href="https://instagram.com/growzapp" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <FiInstagram />
              </a>
            </div>
          </div>
          
          <nav className={styles.nav}>
             <div className={styles.navColumn}>
                <h4>Légal</h4>
                <Link to="/mentions-legales" className={styles.link}>Mentions Légales</Link>
                <Link to="/cgu" className={styles.link}>CGU</Link>
                <Link to="/rgpd" className={styles.link}>RGPD</Link>
             </div>
             <div className={styles.navColumn}>
                <h4>Investissement</h4>
                <Link to="/cgv" className={styles.link}>Risques & CGV</Link>
                {/* On remplace le Link par un bouton stylisé ou une balise 'a' avec onClick */}
                <a 
                  href="#faq" 
                  onClick={openCrispFAQ} 
                  className={styles.link}
                >
                  Aide & FAQ
                </a>
             </div>
          </nav>
        </div>

        <div className={styles.bottomSection}>
          <p>© {currentYear} GrowzApp – Tous droits réservés 🇨🇲</p>
          <div className={styles.secure}>
            <FiShield /> Transactions Sécurisées
          </div>
        </div>
      </div>
    </footer>
  );
}