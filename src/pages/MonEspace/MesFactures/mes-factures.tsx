// src/pages/MonEspace/Mes-factures/MesFacturesPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, buildProjetUrl, getFreshToken } from "../../../service/Api";
import { DividendeDTO } from "../../../types/dividende";
import { ApiResponse } from "../../../types/common";
import toast from "react-hot-toast";
import { format as formatDate } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { FiDownload, FiFile, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import styles from "./mes-factures.module.css";

const API_BASE_URL = "http://localhost:8080";

export default function MesFacturesPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    api
      .get<ApiResponse<DividendeDTO[]>>(
        buildProjetUrl("/api/dividendes/mes-dividendes"),
      )
      .then((res) => {
        const data = res.data || [];
        const withInvoices = data
          .map((dto: any) => ({
            ...dto,
            factureId: dto.facture ? dto.facture.id : null,
            numeroFacture: dto.facture
              ? dto.facture.numeroFacture
              : `DIV-${dto.id}`,
          }))
          .filter((d: any) => !!d.factureId);
        setFactures(withInvoices);
      })
      .catch(() => toast.error(t("dividends.toast_error")))
      .finally(() => setLoading(false));
  }, [t]);

  const downloadFacture = async (factureId: number, numeroFacture: string) => {
    try {
      setDownloading(factureId);
      const token = getFreshToken();
      const lang = i18n.language || "fr";
      const response = await fetch(
        `${API_BASE_URL}/api/factures/${factureId}/download?lang=${lang}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Facture-${numeroFacture}_${lang}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(t("admin.project_detail.download_start"));
    } catch {
      toast.error(t("admin.project_detail.download_error"));
    } finally {
      setDownloading(null);
    }
  };

  if (loading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiFile /> {t("my_invoices.title")}
        </h1>
        <p>{t("my_invoices.count", { count: factures.length })}</p>
      </div>

      {factures.length === 0 ? (
        <div className={styles.emptyState}>
          <FiFile size={64} />
          <p>{t("my_invoices.empty")}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("my_invoices.table.number")}</th>
                <th>{t("my_invoices.table.project")}</th>
                <th>{t("my_invoices.table.date")}</th>
                <th>{t("my_invoices.table.amount")}</th>
                <th>{t("my_invoices.table.status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id}>
                  <td className={styles.mono}>{f.numeroFacture}</td>
                  <td>{f.projetLibelleTradu || f.projetLibelle || "—"}</td>
                  <td>
                    {f.datePaiement
                      ? formatDate(new Date(f.datePaiement), "dd MMM yyyy", {
                          locale: currentLocale,
                        })
                      : "-"}
                  </td>
                  <td>{formatCurrency(Number(f.montantTotal), "XOF")}</td>
                  <td>
                    <span className={styles.badge}>
                      {t("dividends.table.status_paid")}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        downloadFacture(f.factureId, f.numeroFacture)
                      }
                      disabled={downloading === f.factureId}
                      className={styles.btnAction}
                      title={t("my_invoices.btn_download") as string}
                    >
                      {downloading === f.factureId ? (
                        <FiRefreshCw size={16} className={styles.spin} />
                      ) : (
                        <FiDownload size={16} />
                      )}
                    </button>
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
