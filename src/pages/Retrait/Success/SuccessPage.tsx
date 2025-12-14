import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import styles from "./SuccessPage.module.css";

export default function WithdrawSuccessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    toast.success(t("withdraw.success.toast"));
    const timer = setTimeout(() => navigate("/wallet"), 4000);
    return () => clearTimeout(timer);
  }, [navigate, t]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Success</div>
        <h1 className={styles.title}>{t("withdraw.success.title")}</h1>
        <p className={styles.message}>{t("withdraw.success.message")}</p>
        <div className={styles.spinner}></div>
        <p className={styles.redirect}>{t("withdraw.success.redirect")}</p>
      </div>
    </div>
  );
}
