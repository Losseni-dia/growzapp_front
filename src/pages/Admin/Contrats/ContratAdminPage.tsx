// src/pages/admin/ContratsAdmin.tsx → VERSION FINALE 2025

import React, { useState, useEffect } from "react";
import { format } from "date-fns" ;
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiFilter,
} from "react-icons/fi";
import styles from "./ContratAdmin.module.css";
import { api } from "../../../service/api";

// Interface exacte de ce que renvoie ton backend
interface ContratAdmin {
  id: number;
  numeroContrat: string;
  dateGeneration: string;
  projet: string;
  investisseur: string;
  emailInvestisseur: string;
  telephone: string;
  montantInvesti: number;
  nombreParts: number;
  pourcentage: number;
  statutInvestissement: string;
  fichierUrl: string;
  lienVerification: string;
  lienPdf: string;
}

const statuts = ["EN_ATTENTE", "VALIDE", "REJETE", "REMBOURSE"] as const;

const ContratsAdmin: React.FC = () => {
  const [contrats, setContrats] = useState<ContratAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filtres
  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [statut, setStatut] = useState("");
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchContrats = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      size: "20",
      ...(search && { search }),
      ...(dateDebut && { dateDebut: dateDebut }),
      ...(dateFin && { dateFin }),
      ...(statut && { statut }),
      ...(montantMin && { montantMin }),
      ...(montantMax && { montantMax }),
    });

    try {
      // Solution magique : on force le type sans toucher à api.ts
      const res = await api.get<any>(`/api/contrats/admin/liste?${params}`);

      // On sait exactement ce que le backend renvoie → on caste proprement
      setContrats(res.contrats as ContratAdmin[]);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error("Erreur lors du chargement des contrats :", err);
      toast.error(err.message || "Impossible de charger les contrats");
    } finally {
      setLoading(false);
    }
  };

  // Déclenche le fetch avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContrats();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search, dateDebut, dateFin, statut, montantMin, montantMax]);

  const resetFilters = () => {
    setSearch("");
    setDateDebut("");
    setDateFin("");
    setStatut("");
    setMontantMin("");
    setMontantMax("");
    setPage(0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1>GESTION DES CONTRATS</h1>
          <p>Tous les contrats d'investissement GrowzApp</p>
        </div>

        {/* Barre d'outils */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher par nom, projet, n° contrat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={styles.btnFilter}
            >
              <FiFilter size={18} />
              Filtres {showFilters ? "▲" : "▼"}
            </button>

            <button onClick={fetchContrats} className={styles.btnRefresh}>
              <FiRefreshCw className={loading ? styles.spin : ""} />
              Actualiser
            </button>

            <button
              onClick={() => window.open("/api/contrats/admin/export-excel", "_blank")}
              className={styles.btnExcel}
            >
              <FiDownload size={18} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGrid}>
              <div>
                <label>Date début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div>
                <label>Date fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
              <div>
                <label>Statut</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  {statuts.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Montant min (FCFA)</label>
                <input
                  type="number"
                  placeholder="500000"
                  value={montantMin}
                  onChange={(e) => setMontantMin(e.target.value)}
                />
              </div>
              <div>
                <label>Montant max (FCFA)</label>
                <input
                  type="number"
                  placeholder="10000000"
                  value={montantMax}
                  onChange={(e) => setMontantMax(e.target.value)}
                />
              </div>
            </div>

            <button onClick={resetFilters} className={styles.btnReset}>
              Réinitialiser
            </button>
          </div>
        )}

        {/* Tableau */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Contrat</th>
                <th>Date</th>
                <th>Projet</th>
                <th>Investisseur</th>
                <th className={styles.textCenter}>Montant</th>
                <th className={styles.textCenter}>Parts</th>
                <th className={styles.textCenter}>% Équité</th>
                <th className={styles.textCenter}>Statut</th>
                <th className={styles.textCenter}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className={styles.loading}>
                    Chargement des contrats...
                  </td>
                </tr>
              ) : contrats.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : (
                contrats.map((c) => (
                  <tr key={c.id} className={styles.row}>
                    <td className={styles.boldGreen}>{c.numeroContrat}</td>
                    <td>
                      {format(new Date(c.dateGeneration), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className={styles.bold}>{c.projet}</td>
                    <td>
                      <div>{c.investisseur}</div>
                      <div className={styles.email}>{c.emailInvestisseur}</div>
                    </td>
                    <td className={`${styles.textCenter} ${styles.bigAmount}`}>
                      {c.montantInvesti.toLocaleString()} FCFA
                    </td>
                    <td className={styles.textCenter + " " + styles.bold}>
                      {c.nombreParts}
                    </td>
                    <td className={styles.textCenter}>
                      <span className={styles.badgeYellow}>{c.pourcentage}%</span>
                    </td>
                    <td className={styles.textCenter}>
                      <span
                        className={
                          c.statutInvestissement === "VALIDE"
                            ? styles.badgeGreen
                            : styles.badgeOrange
                        }
                      >
                        {c.statutInvestissement.replace("_", " ")}
                      </span>
                    </td>
                    <td className={styles.textCenter}>
                      <div className={styles.actionsCell}>
                        <a
                          href={`/contrat/${c.numeroContrat}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Voir le contrat"
                        >
                          <FiEye size={20} />
                        </a>
                        <a
                          href={c.lienPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Télécharger PDF"
                        >
                          <FiFileText size={20} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={styles.pageBtn}
          >
            Précédent
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            className={styles.pageBtn}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContratsAdmin;