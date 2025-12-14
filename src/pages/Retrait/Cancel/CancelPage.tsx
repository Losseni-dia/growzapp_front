import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./CancelPage.module.css";

export default function WithdrawCancelPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Warning</div>
        <h1 className={styles.title}>{t("withdraw.cancel.title")}</h1>
        <p className={styles.message}>{t("withdraw.cancel.message")}</p>
        <button
          onClick={() => navigate("/retrait")}
          className={styles.retryBtn}
        >
          {t("withdraw.cancel.retry")}
        </button>
        <p
          className={styles.redirect}
          onClick={() => navigate("/wallet")}
          style={{ cursor: "pointer" }}
        >
          {t("withdraw.cancel.home")}
        </p>
      </div>
    </div>
  );
}
