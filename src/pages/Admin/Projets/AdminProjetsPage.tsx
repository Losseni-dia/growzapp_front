// src/pages/admin/AdminProjetsPage.tsx
// VERSION FINALE — SOLDE RÉEL VIA TON ENDPOINT EXISTANT

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import styles from "./AdminProjetsPage.module.css";
import { FiDollarSign, FiEdit, FiCheckCircle, FiXCircle } from "react-icons/fi";

interface ProjetAdmin {
  id: number;
  libelle: string;
  description?: string;
  statutProjet: string;
  porteurNom: string;
  porteurPrenom?: string;
  poster?: string;
  montantCollecte: number;
}

export default function AdminProjetsPage() {
  const { data: projetsData, isLoading } = useQuery({
    queryKey: ["admin-projets"],
    queryFn: () => api.get<{ data: ProjetAdmin[] }>("/api/admin/projets"),
  });

  const projets = projetsData?.data || [];

  // Récupération du solde réel pour chaque projet
 const { data: soldesData = {} } = useQuery({
   queryKey: ["project-soldes"],
   queryFn: async () => {
     const soldes: Record<number, number> = {};
     for (const p of projets) {
       try {
         const res = await api.get(`/api/admin/projet-wallet/${p.id}/solde`);
         soldes[p.id] = Number(res) || 0;
       } catch {
         soldes[p.id] = 0;
       }
     }
     return soldes;
   },
   enabled: projets.length > 0,
 });

  if (isLoading) {
    return <div className={styles.loading}>Chargement des projets...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Administration des Projets ({projets.length})
      </h1>

      <div className={styles.grid}>
        {projets.map((p) => {
          const soldeReel = soldesData[p.id] ?? 0;

          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.posterWrapper}>
                {p.poster ? (
                  <img
                    src={p.poster}
                    alt={p.libelle}
                    className={styles.poster}
                  />
                ) : (
                  <div className={styles.noPoster}>Aucun poster</div>
                )}
                <div
                  className={`${styles.statutBadge} ${
                    styles[p.statutProjet?.toLowerCase()] || styles.badgeDefault
                  }`}
                >
                  {p.statutProjet}
                </div>
              </div>

              <div className={styles.content}>
                <h3 className={styles.projectTitle}>{p.libelle}</h3>
                <p className={styles.porteur}>
                  Par {p.porteurPrenom || ""} {p.porteurNom}
                </p>

                <div className={styles.tresorerie}>
                  <FiDollarSign className={styles.tresorerieIcon} />
                  <div>
                    <strong
                      className={
                        soldeReel > 0 ? styles.soldePositif : styles.soldeZero
                      }
                    >
                      {soldeReel.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </strong>
                    <small>séquestré réel</small>
                  </div>
                </div>

                {/* BOUTONS ADMIN */}
                <div className={styles.adminActions}>
                  {p.statutProjet === "SOUMIS" ||
                  p.statutProjet === "EN_ATTENTE" ? (
                    <>
                      <button className={styles.btnValider}>
                        <FiCheckCircle /> Valider
                      </button>
                      <button className={styles.btnRejeter}>
                        <FiXCircle /> Rejeter
                      </button>
                    </>
                  ) : (
                    <button className={styles.btnModifier}>
                      <FiEdit /> Modifier
                    </button>
                  )}

                  <Link
                    to={`/admin/project-wallets/${p.id}`}
                    className={styles.btnPortefeuille}
                  >
                    Portefeuille projet
                  </Link>
                </div>

                <Link
                  to={`/projet/${p.id}`}
                  target="_blank"
                  className={styles.btnVoir}
                >
                  Voir le projet
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
