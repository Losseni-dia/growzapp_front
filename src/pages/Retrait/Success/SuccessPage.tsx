import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./SuccessPage.module.css";

export default function WithdrawSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success("Retrait envoyé avec succès ! Tu recevras l’argent sous 24h");
    const timer = setTimeout(() => navigate("/wallet"), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Success</div>
        <h1 className={styles.title}>Retrait envoyé !</h1>
        <p className={styles.message}>Ton argent est en cours de transfert</p>
        <div className={styles.spinner}></div>
        <p className={styles.redirect}>Redirection vers ton portefeuille...</p>
      </div>
    </div>
  );
}
