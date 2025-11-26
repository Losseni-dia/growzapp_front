import { useNavigate } from "react-router-dom";
import styles from "./CancelPage.module.css";

export default function DepositCancel() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Cancel</div>
        <h1 className={styles.title}>Paiement annulé</h1>
        <p className={styles.message}>Aucun prélèvement n’a été effectué</p>
        <button onClick={() => navigate("/depot")} className={styles.retryBtn}>
          Réessayer le dépôt
        </button>
        <p className={styles.redirect}>Ou retourne à l'accueil</p>
      </div>
    </div>
  );
}
