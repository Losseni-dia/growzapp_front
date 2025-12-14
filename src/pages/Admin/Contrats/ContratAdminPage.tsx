// src/pages/admin/ContratsAdmin.tsx
import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/context/CurrencyContext";
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiFilter,
} from "react-icons/fi";
import styles from "./ContratAdmin.module.css";
import { api, getFreshToken } from "../../../service/api"; // Import getFreshToken

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
  statutInvestissement: string;
  currencyCode?: string;
}

const ContratsAdmin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const [contrats, setContrats] = useState<ContratAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [statut, setStatut] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  // L'URL de base doit correspondre à ton backend
  const BASE_URL = "http://localhost:8080";

  const fetchContrats = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      size: "20",
      ...(search && { search }),
      ...(dateDebut && { dateDebut }),
      ...(dateFin && { dateFin }),
      ...(statut && { statut }),
    });

    try {
      const res = await api.get<any>(`/api/contrats/admin/liste?${params}`);
      setContrats(res.contrats || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(t("admin.withdrawals.toast.error"));
    } finally {
      setLoading(false);
    }
  }, [page, search, dateDebut, dateFin, statut, t]);

  useEffect(() => {
    const timer = setTimeout(() => fetchContrats(), 300);
    return () => clearTimeout(timer);
  }, [fetchContrats]);

  // --- 1. FONCTION VOIR (CORRIGÉE) ---
  const handleVoir = async (numero: string) => {
    try {
      setDownloading(numero);
      const token = getFreshToken(); // Utilise la fonction de ton api.ts
      const lang = i18n.language || "fr";

      const response = await fetch(
        `${BASE_URL}/api/contrats/${numero}?lang=${lang}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Fichier introuvable");

      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } catch (err) {
      console.error("Erreur Voir PDF:", err);
      toast.error(t("contract_view.error_generic"));
    } finally {
      setDownloading(null);
    }
  };

  // --- 2. FONCTION TÉLÉCHARGER (CORRIGÉE) ---
  const handleDownload = async (numero: string) => {
    try {
      setDownloading(numero);
      const token = getFreshToken();
      const lang = i18n.language || "fr";

      const response = await fetch(
        `${BASE_URL}/api/contrats/${numero}/download?lang=${lang}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Erreur de téléchargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Contrat_${numero}_${lang}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("admin.project_detail.download_start"));
    } catch (err) {
      console.error("Erreur Download PDF:", err);
      toast.error(t("admin.project_detail.download_error"));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{t("admin.contracts.title")}</h1>
          <p>{t("admin.contracts.subtitle")}</p>
        </div>

        {/* TOOLBAR */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t("admin.contracts.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={styles.btnFilter}
            >
              <FiFilter size={18} /> {t("admin.contracts.filter_btn")}
            </button>
            <button onClick={fetchContrats} className={styles.btnRefresh}>
              <FiRefreshCw className={loading ? styles.spin : ""} />
            </button>
          </div>
        </div>

        {/* TABLEAU */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>
                  {t("admin.contracts.table.contract_no")}
                </th>
                <th className={styles.th}>{t("admin.contracts.table.date")}</th>
                <th className={styles.th}>
                  {t("admin.contracts.table.project")}
                </th>
                <th className={styles.th}>
                  {t("admin.contracts.table.investor")}
                </th>
                <th className={`${styles.th} ${styles.textCenter}`}>
                  {t("admin.contracts.table.amount")}
                </th>
                <th className={`${styles.th} ${styles.textCenter}`}>
                  {t("admin.contracts.table.status")}
                </th>
                <th className={`${styles.th} ${styles.textCenter}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.loading}>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                contrats.map((c) => (
                  <tr key={c.id} className={styles.row}>
                    <td className={styles.td}>{c.numeroContrat}</td>
                    <td className={styles.td}>
                      {format(new Date(c.dateGeneration), "dd/MM/yyyy", {
                        locale: currentLocale,
                      })}
                    </td>
                    <td className={styles.td}>{c.projet}</td>
                    <td className={styles.td}>{c.investisseur}</td>
                    <td className={`${styles.td} ${styles.textCenter}`}>
                      {formatCurrency(
                        c.montantInvesti,
                        c.currencyCode || "XOF"
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.textCenter}`}>
                      <span
                        className={
                          c.statutInvestissement === "VALIDE"
                            ? styles.badgeGreen
                            : styles.badgeOrange
                        }
                      >
                        {c.statutInvestissement}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.textCenter}`}>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleVoir(c.numeroContrat)}
                          className={styles.actionBtn}
                          disabled={downloading === c.numeroContrat}
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleDownload(c.numeroContrat)}
                          className={styles.actionBtn}
                          disabled={downloading === c.numeroContrat}
                        >
                          {downloading === c.numeroContrat ? (
                            <FiRefreshCw className={styles.spin} />
                          ) : (
                            <FiDownload />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContratsAdmin;
