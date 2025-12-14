// src/pages/LoginPage/LoginPage.tsx (Adapte le chemin selon ton dossier)
import LoginForm from "../../components/LoginForm/LoginForm";
import styles from "./LoginPage.module.css";
import { useTranslation } from "react-i18next"; // <--- Import

export default function LoginPage() {
  const { t } = useTranslation(); // <--- Hook

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>growzapp</h1>
        {/* Traduction du sous-titre */}
        <p>{t("login_page.subtitle")}</p>
        <LoginForm />
      </div>
    </div>
  );
}
