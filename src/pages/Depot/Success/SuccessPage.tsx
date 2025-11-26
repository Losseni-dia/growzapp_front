import styles from "./SuccessPage.module.css";

export default function DepositSuccess() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>Success</div>
        <h1 className={styles.title}>Paiement réussi !</h1>
        <p className={styles.message}>Ton wallet a été crédité avec succès</p>
        <div className={styles.spinner}></div>
        <p className={styles.redirect}>
          Redirection vers ton portefeuille dans 3 secondes...
        </p>
      </div>
    </div>
  );
}
