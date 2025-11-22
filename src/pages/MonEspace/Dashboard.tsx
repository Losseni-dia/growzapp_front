// src/pages/Dashboard/Dashboard.tsx → VERSION QUI MARCHE À VIE
import { Link } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";
import styles from "./Dashboard.module.css";
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiEye,
} from "react-icons/fi";

export default function Dashboard() {

  const { user } = useAuth();
   console.log("DASHBOARD CLASSIQUE → Monté ! User:", user);

  if (!user) {
    return <div className={styles.center}>Chargement...</div>;
  }

  const investments = user.investissements || [];
  const projects = user.projets || [];

  return (
    <div className={styles.container}>
      {/* PROFIL */}
      <section className={styles.profileSection}>
        <div className={styles.profileCard}>
          <img
            src={user.image || "/default-avatar.png"}
            alt="Profil"
            className={styles.avatar}
          />
          <div className={styles.info}>
            <h1>
              {user.prenom} {user.nom}
            </h1>
            <p>
              <FiMail /> {user.email}
            </p>
            <p>
              <FiPhone /> {user.contact || "Non renseigné"}
            </p>
            <p>
              <FiMapPin /> {user.localite?.nom || "Non renseigné"}
              {user.localite?.paysNom && `, ${user.localite.paysNom}`}
            </p>
            <p>
              <FiGlobe /> {user.langues?.join(", ") || "Aucune langue"}
            </p>

            <div className={styles.roles}>
              {user.roles?.map((role: string) => (
                <span key={role} className={styles.roleBadge}>
                  {role}
                </span>
              ))}
            </div>

            <Link to="/profile/edit" className={styles.editBtn}>
              <FiEdit /> Modifier mon profil
            </Link>
          </div>
        </div>
      </section>

      {/* MES INVESTISSEMENTS */}
      <section className={styles.section}>
        <h2>Mes investissements ({investments.length})</h2>
        {investments.length === 0 ? (
          <p className={styles.empty}>
            Vous n'avez pas encore investi.{" "}
            <Link to="/projets">Découvrir les projets →</Link>
          </p>
        ) : (
          <div className={styles.grid}>
            {investments.map((inv: any) => (
              <div key={inv.id} className={styles.card}>
                <h3>{inv.projetLibelle}</h3>
                <p>
                  <strong>{inv.nombrePartsPris}</strong> parts •{" "}
                  {(inv.nombrePartsPris * inv.prixUnePart).toLocaleString()} €
                </p>
                <Link to={`/projet/${inv.projetId}`} className={styles.btn}>
                  <FiEye /> Voir
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MES PROJETS */}
      <section className={styles.section}>
        <h2>Mes projets ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className={styles.empty}>
            Vous n'avez pas encore de projet.
            {(user.roles?.includes("PORTEUR") ||
              user.roles?.includes("ADMIN")) && (
              <Link to="/projet/creer" className={styles.link}>
                {" "}
                Créer un projet →
              </Link>
            )}
          </p>
        ) : (
          <div className={styles.grid}>
            {projects.map((p: any) => (
              <div key={p.id} className={styles.card}>
                {p.poster && (
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                  />
                )}
                <h3>{p.libelle}</h3>
                <p>
                  <strong>{p.montantCollecte.toLocaleString()} €</strong> /{" "}
                  {p.objectifFinancement.toLocaleString()} €
                  <progress
                    value={p.montantCollecte}
                    max={p.objectifFinancement}
                    className={styles.progress}
                  />
                </p>
                <Link to={`/projet/${p.id}`} className={styles.btn}>
                  <FiEye /> Voir
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
