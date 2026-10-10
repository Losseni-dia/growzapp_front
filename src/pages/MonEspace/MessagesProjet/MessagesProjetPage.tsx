// src/pages/MonEspace/MessagesProjet/MessagesProjetPage.tsx
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import ProjetMessageThread from "../../../components/Projet/ProjetMessageThread";
import styles from "./MessagesProjetPage.module.css";

export default function MessagesProjetPage() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();

  return (
    <div className={styles.container}>
      <Link to="/mes-investissements" className={styles.backLink}>
        <FiArrowLeft size={16} /> {t("user_investments.title")}
      </Link>
      <h1 className={styles.title}>{t("projet_messages.title", "Messages investisseurs")}</h1>
      <ProjetMessageThread projetId={Number(projetId)} />
    </div>
  );
}
