import LoginForm from "../../components/LoginForm/LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>growzapp</h1>
        <p>Connectez-vous pour gérer vos investissements</p>
        <LoginForm />
      </div>
    </div>
  );
}
