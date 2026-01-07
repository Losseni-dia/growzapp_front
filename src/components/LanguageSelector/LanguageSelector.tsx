import React from "react";
import { useTranslation } from "react-i18next";
// IMPORTANT : Importe l'objet styles depuis le module
import styles from "./LanguageSelector.module.css";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    {
      code: "fr",
      label: "Français",
      flagUrl: "https://hatscripts.github.io/circle-flags/flags/fr.svg",
    },
    {
      code: "en",
      label: "English",
      flagUrl: "https://hatscripts.github.io/circle-flags/flags/gb.svg",
    },
    {
      code: "es",
      label: "Español",
      flagUrl: "https://hatscripts.github.io/circle-flags/flags/es.svg",
    },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
  };

  return (
    // Utilise styles.container au lieu de "language-selector"
    <div className={styles.container}>
      {languages.map((lang) => {
        const isActive = i18n.language === lang.code;

        return (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            // On combine les classes dynamiquement
            className={`${styles.btn} ${isActive ? styles.active : ""}`}
            title={lang.label}
          >
            <img
              src={lang.flagUrl}
              alt={lang.code}
              className={styles.flag} // C'est ça qui va réduire la taille
            />

            {isActive && <span className={styles.activeDot}></span>}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
