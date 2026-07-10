// src/pages/RegisterPage.tsx
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import styles from "../LoginPage/LoginPage.module.css"; // même style que login

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <RegisterForm />
      </div>
    </div>
  );
}
