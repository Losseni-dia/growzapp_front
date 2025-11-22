// src/pages/RegisterPage.tsx
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import styles from "../LoginPage/LoginPage.module.css"; // même style que login

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>growzapp</h1>
        <p>Rejoignez la communauté </p>
        <RegisterForm />
      </div>
    </div>
  );
}
