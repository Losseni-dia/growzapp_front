import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FiShield } from "react-icons/fi";
import { useCookieConsent } from "../Context/CookieConsentContext";
import styles from "./CookieConsentBanner.module.css";

export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const { consent, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [chatChoice, setChatChoice] = useState(true);

  if (consent !== null) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-live="polite" aria-label="Cookies">
      <div className={styles.banner}>
        <div className={styles.header}>
          <FiShield size={20} className={styles.icon} />
          <h2>{t("cookies.title", "Votre vie privée, respectée")}</h2>
        </div>

        <p className={styles.text}>
          {t(
            "cookies.body",
            "Nous utilisons des cookies strictement nécessaires au fonctionnement du site (authentification, préférences de langue et de devise). Avec votre accord, nous activons aussi notre chat de support (Crisp). Vous pouvez changer d'avis à tout moment depuis le pied de page.",
          )}{" "}
          <Link to="/rgpd" className={styles.link}>
            {t("cookies.learn_more", "En savoir plus")}
          </Link>
        </p>

        {showDetails && (
          <div className={styles.details}>
            <label className={styles.detailRow}>
              <div>
                <strong>{t("cookies.essential_title", "Cookies essentiels")}</strong>
                <p>{t("cookies.essential_desc", "Authentification, sécurité, préférences de langue et devise. Toujours actifs.")}</p>
              </div>
              <input type="checkbox" checked disabled />
            </label>
            <label className={styles.detailRow}>
              <div>
                <strong>{t("cookies.chat_title", "Support & Chat (Crisp)")}</strong>
                <p>{t("cookies.chat_desc", "Active la bulle de chat en direct avec notre équipe support.")}</p>
              </div>
              <input
                type="checkbox"
                checked={chatChoice}
                onChange={(e) => setChatChoice(e.target.checked)}
              />
            </label>
          </div>
        )}

        <div className={styles.actions}>
          {showDetails ? (
            <button
              className={styles.btnPrimary}
              onClick={() => savePreferences(chatChoice)}
            >
              {t("cookies.btn_save", "Enregistrer mes choix")}
            </button>
          ) : (
            <>
              <button className={styles.btnGhost} onClick={() => setShowDetails(true)}>
                {t("cookies.btn_customize", "Personnaliser")}
              </button>
              <button className={styles.btnSecondary} onClick={rejectNonEssential}>
                {t("cookies.btn_reject", "Refuser les non-essentiels")}
              </button>
              <button className={styles.btnPrimary} onClick={acceptAll}>
                {t("cookies.btn_accept_all", "Tout accepter")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
