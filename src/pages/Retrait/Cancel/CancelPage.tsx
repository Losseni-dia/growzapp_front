import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CancelPage.module.css";

export default function WithdrawCancelPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Warning</div>
        <h1 className={styles.title}>Retrait annulé</h1>
        <p className={styles.message}>Aucun prélèvement n’a été effectué</p>
        <button
          onClick={() => navigate("/retrait")}
          className={styles.retryBtn}
        >
          Réessayer le retrait
        </button>
        <p className={styles.redirect}>Ou retourner à ton portefeuille</p>
      </div>
    </div>
  );
}
