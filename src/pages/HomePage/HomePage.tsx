// src/pages/HomePage/HomePage.tsx
// VERSION 100% MINIMALISTE — QUE DES PROJETS, RIEN D'AUTRE

import ProjetsPage from "../projet/projetsPage/ProjetsPage";
import styles from "./HomePage.module.css";

export default function HomePage() {
  return (
    <div className={styles.home}>
      <ProjetsPage />
    </div>
  );
}
