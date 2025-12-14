// src/pages/investisseur/MesDividendesPage.tsx

import { useState, useEffect } from "react";
import { api, getFreshToken } from "../../../service/api";
import { useAuth } from "../../../components/context/AuthContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/context/CurrencyContext"; // <--- IMPORT DU CONTEXT
import {
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
} from "react-icons/fi";
import styles from "./MesDividendes.module.css";
import { DividendeDTO } from "../../../types/dividende";
import { ApiResponse } from "../../../types/common";

const API_BASE_URL = "http://localhost:8080";

export default function MesDividendesPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { format } = useCurrency(); // <--- HOOK MONNAIE
  const [dividendes, setDividendes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. CHARGEMENT DES DONNÉES ---
  const loadDividendes = async () => {
    if (!user) return;
    try {
      if (dividendes.length === 0) setLoading(true);

      const response = await api.get<ApiResponse<DividendeDTO[]>>(
        "/api/dividendes/mes-dividendes"
      );

      const data = response.data || [];

      setDividendes(
        data.map((dto: any) => ({
          ...dto,
          factureId: dto.facture ? dto.facture.id : null,
          numeroFacture: dto.facture
            ? dto.facture.numeroFacture
            : `DIV-${dto.id}`,
          factureUrl: dto.facture ? dto.facture.fichierUrl : dto.factureUrl,
        }))
      );
    } catch (err) {
      console.error("Erreur chargement dividendes", err);
      if (loading)
        toast.error(t("dividends.toast_error") || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDividendes();
    const interval = setInterval(loadDividendes, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // --- 2. TÉLÉCHARGEMENT SÉCURISÉ ---
  const downloadFacture = async (factureId: number, numeroFacture: string) => {
    if (!factureId) {
      toast.error("Facture non disponible");
      return;
    }

    try {
      const token = getFreshToken();
      const lang = i18n.language || "fr";

      const response = await fetch(
        `${API_BASE_URL}/api/factures/${factureId}/download?lang=${lang}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Erreur serveur");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Facture-${numeroFacture}_${lang}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(t("dividends.table.invoice_downloaded"));
    } catch (e) {
      toast.error(t("project_details.documents.error_download"));
    }
  };

  // --- 3. CALCULS (En XOF d'abord, convertis à l'affichage) ---
  const totalPercu = dividendes
    .filter((d) => d.statutDividende === "PAYE")
    .reduce((sum, d) => sum + Number(d.montantTotal || 0), 0);

  const totalPlanifie = dividendes
    .filter((d) => d.statutDividende === "PLANIFIE")
    .reduce((sum, d) => sum + Number(d.montantTotal || 0), 0);

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loading}>{t("dividends.loading")}</p>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1>
          <FiDollarSign /> {t("dividends.title")}
        </h1>
        <button onClick={loadDividendes} className={styles.refreshBtn}>
          <FiRefreshCw /> {t("dividends.btn_refresh")}
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.card}>
          <FiCheckCircle className={styles.iconSuccess} />
          <div>
            <span>{t("dividends.stats.received")}</span>
            {/* CONVERSION DYNAMIQUE */}
            <strong>{format(totalPercu, "XOF")}</strong>
          </div>
        </div>
        <div className={styles.card}>
          <FiClock className={styles.iconPending} />
          <div>
            <span>{t("dividends.stats.planned")}</span>
            {/* CONVERSION DYNAMIQUE */}
            <strong>{format(totalPlanifie, "XOF")}</strong>
          </div>
        </div>
        <div className={styles.card}>
          <FiFileText className={styles.iconTotal} />
          <div>
            <span>{t("dividends.stats.total")}</span>
            {/* CONVERSION DYNAMIQUE */}
            <strong>{format(totalPercu + totalPlanifie, "XOF")}</strong>
          </div>
        </div>
      </div>

      {dividendes.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.empty}>{t("dividends.empty")}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("dividends.table.project")}</th>
                <th>{t("dividends.table.total")}</th>
                <th>{t("dividends.table.per_share")}</th>
                <th>{t("dividends.table.date")}</th>
                <th>{t("dividends.table.status")}</th>
                <th>{t("dividends.table.invoice")}</th>
              </tr>
            </thead>
            <tbody>
              {dividendes.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className={styles.projectName}>
                      {d.investissementInfo || d.projetLibelle || "Projet"}
                    </span>
                  </td>
                  <td className={styles.montant}>
                    {/* MONTANT TOTAL LIGNE CONVERTI */}
                    {format(Number(d.montantTotal), "XOF")}
                  </td>
                  <td>
                    {/* MONTANT PAR PART CONVERTI */}
                    {format(Number(d.montantParPart), "XOF")}
                  </td>
                  <td>
                    {d.datePaiement
                      ? new Date(d.datePaiement).toLocaleDateString(
                          i18n.language
                        )
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={
                        d.statutDividende === "PAYE"
                          ? styles.badgePaye
                          : styles.badgePlanifie
                      }
                    >
                      {d.statutDividende === "PAYE"
                        ? t("dividends.table.status_paid")
                        : t("dividends.table.status_planned")}
                    </span>
                  </td>
                  <td>
                    {d.statutDividende === "PAYE" ? (
                      d.factureId ? (
                        <button
                          onClick={() =>
                            downloadFacture(d.factureId, d.numeroFacture)
                          }
                          className={styles.downloadBtn}
                        >
                          <FiDownload /> PDF
                        </button>
                      ) : (
                        <span className={styles.pending} title="Génération...">
                          <FiRefreshCw className={styles.spin} />
                        </span>
                      )
                    ) : (
                      <span className={styles.greyText}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
