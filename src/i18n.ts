import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  // Charge les fichiers de traduction depuis /public/locales
  .use(HttpBackend)
  // Détecte la langue du navigateur
  .use(LanguageDetector)
  // Passe l'instance à react-i18next
  .use(initReactI18next)
  // Initialisation
  .init({
    fallbackLng: "fr", // Langue de secours si la détection échoue
    debug: false, // Mets à 'true' si tu veux voir les logs de traduction dans la console

    interpolation: {
      escapeValue: false, // React protège déjà contre les failles XSS
    },

    // Configuration du chargement des fichiers
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },

    // Options de détection de langue (optionnel, pour affiner)
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"], // Stocke la langue dans le localStorage du navigateur
    },
  });

export default i18n;
