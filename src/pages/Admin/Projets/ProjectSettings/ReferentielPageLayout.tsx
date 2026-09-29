import { ReactNode } from "react";
import styles from "./ProjectSettingsPanel.module.css";

interface Props {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

// Layout partagé par les pages référentiels individuelles (secteurs,
// localités, sites, devises, analyses) — remplace l'ancien panneau à
// onglets unique où tout s'ouvrait dans le même écran.
export default function ReferentielPageLayout({ title, icon, children }: Props) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {icon} {title}
        </h1>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
