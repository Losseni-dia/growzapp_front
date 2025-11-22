// src/pages/HomePage/HomePage.tsx → CORRIGÉ
import ProjetsPage from "../ProjetsPage/ProjetsPage";// ← BON CHEMIN
import styles from "./HomePage.module.css";

export default function HomePage() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>growzapp</h1>
        <p>Investissez dans les projets qui font grandir l'Afrique</p>
      </section>

      <section className={styles.list}>
        <h2>Projets en cours</h2>
        <ProjetsPage />
      </section>
    </div>
  );
}
