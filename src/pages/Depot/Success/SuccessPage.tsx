import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./SuccessPage.module.css";

export default function DepositSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Redirection auto
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/wallet");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Success</div>
        <h1 className={styles.title}>{t("deposit.result.success_title")}</h1>
        <p className={styles.message}>{t("deposit.result.success_msg")}</p>
        <div className={styles.spinner}></div>
        <p className={styles.redirect}>{t("deposit.result.redirect_msg")}</p>
      </div>
    </div>
  );
}
