import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./CancelPage.module.css";

export default function DepositCancel() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Cancel</div>
        <h1 className={styles.title}>{t("deposit.result.cancel_title")}</h1>
        <p className={styles.message}>{t("deposit.result.cancel_msg")}</p>
        <button onClick={() => navigate("/depot")} className={styles.retryBtn}>
          {t("deposit.result.retry_btn")}
        </button>
        <p
          className={styles.redirect}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          {t("deposit.result.home_link")}
        </p>
      </div>
    </div>
  );
}
