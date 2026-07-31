import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiClipboard, FiDownload, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { api } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import styles from "./FacturesAdminPage.module.css";

interface FactureAdmin {
  id: number;
  numeroFacture: string;
  montantHT: number;
  montantTTC: number;
  statut: "EMISE" | "PAYEE" | "ANNULEE" | "EN_RETARD";
  dateEmission: string;
  datePaiement?: string;
  investisseurNom: string;
  investisseurEmail: string;
}

interface FacturesPage {
  content: FactureAdmin[];
  totalPages: number;
  totalElements: number;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function FacturesAdminPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const { data, isLoading, isError } = useQuery<FacturesPage>({
    queryKey: ["admin-factures", page, search, statut],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        ...(search && { search }),
        ...(statut && { statut }),
      });
      const res = await api.get<{ data: FacturesPage }>(
        `/api/admin/factures?${params}`,
      );
      return res.data;
    },
  });

  const factures = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleSearchChange = (value: string) => {
    setPage(0);
    setSearch(value);
  };
  const handleStatutChange = (value: string) => {
    setPage(0);
    setStatut(value);
  };

  const handleDownload = async (facture: FactureAdmin) => {
    setDownloadingId(facture.id);
    try {
      const lang = i18n.language || "fr";
      const response = await fetch(
        `${BASE_URL}/api/factures/${facture.id}/download?lang=${lang}`,
        { method: "GET", credentials: "include" },
      );
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${facture.numeroFacture}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t("admin.invoices.download_error"));
    } finally {
      setDownloadingId(null);
    }
  };

  const statutBadge = (statut: string) => {
    if (statut === "PAYEE") return styles.badgePaid;
    if (statut === "ANNULEE") return styles.badgeCancelled;
    if (statut === "EN_RETARD") return styles.badgeLate;
    return styles.badgeIssued;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <FiClipboard /> {t("admin.invoices.title")}
        </h1>
        <p>
          {t("admin.invoices.subtitle", { count: data?.totalElements ?? 0 })}
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch size={15} />
          <input
            type="text"
            placeholder={t("admin.invoices.search_placeholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          value={statut}
          onChange={(e) => handleStatutChange(e.target.value)}
        >
          <option value="">{t("admin.invoices.filter_status_all")}</option>
          <option value="EMISE">{t("admin.invoices.status_emise")}</option>
          <option value="PAYEE">{t("admin.invoices.status_payee")}</option>
          <option value="EN_RETARD">
            {t("admin.invoices.status_en_retard")}
          </option>
          <option value="ANNULEE">{t("admin.invoices.status_annulee")}</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.invoices.table.number")}</th>
              <th>{t("admin.invoices.table.investor")}</th>
              <th>{t("admin.invoices.table.amount")}</th>
              <th>{t("admin.invoices.table.status")}</th>
              <th>{t("admin.invoices.table.emission_date")}</th>
              <th>{t("admin.invoices.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={styles.loading}>
                  {t("common.loading")}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className={styles.loading}>
                  {t("admin.invoices.load_error")}
                </td>
              </tr>
            ) : factures.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.loading}>
                  {t("admin.invoices.empty")}
                </td>
              </tr>
            ) : (
              factures.map((f) => (
                <tr key={f.id}>
                  <td>{f.numeroFacture}</td>
                  <td>
                    <div>{f.investisseurNom}</div>
                    <div className={styles.email}>{f.investisseurEmail}</div>
                  </td>
                  <td>{formatCurrency(f.montantTTC, "XOF")}</td>
                  <td>
                    <span className={statutBadge(f.statut)}>{f.statut}</span>
                  </td>
                  <td>
                    {format(new Date(f.dateEmission), "dd MMM yyyy", {
                      locale: currentLocale,
                    })}
                  </td>
                  <td>
                    <button
                      className={styles.downloadBtn}
                      onClick={() => handleDownload(f)}
                      disabled={downloadingId === f.id}
                      title={t("admin.invoices.download")}
                    >
                      <FiDownload size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ‹
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
