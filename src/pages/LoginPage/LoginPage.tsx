import LoginForm from "../../components/LoginForm/LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* On laisse la page vide, LoginForm gère son propre titre et sous-titre */}
        <LoginForm />
      </div>
    </div>
  );
}
