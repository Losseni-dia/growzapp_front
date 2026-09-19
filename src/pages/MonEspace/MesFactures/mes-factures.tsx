// src/pages/MonEspace/Mes-factures/MesFacturesPage.tsx
import { format as formatDate } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiDownload, FiFile, FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildProjetUrl } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import styles from "./mes-factures.module.css";

interface FactureDTO {
  id: number;
  numeroFacture: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  dateEmission: string;
  datePaiement?: string;
  statut: string;
  fichierUrl?: string;
  type: "DIVIDENDE" | "PREMIUM";
  libelle?: string;
  projetLibelle?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function MesFacturesPage() {
  const { t, i18n } = useTranslation();
  const { currency, format: formatCurrency } = useCurrency();

  const [factures, setFactures] = useState<FactureDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    api
      .get<ApiResponse<FactureDTO[]>>(buildProjetUrl("/api/factures/mes-factures"))
      .then((res) => setFactures(res.data || []))
      .catch(() => toast.error(t("dividends.toast_error")))
      .finally(() => setLoading(false));
  }, [t]);

 const downloadFacture = async (factureId: number, numeroFacture: string) => {
   try {
     setDownloading(factureId);
     const lang = i18n.language || "fr";
     const response = await fetch(
       `${API_BASE_URL}/api/factures/${factureId}/download?lang=${lang}&currency=${currency}`,
       {
         method: "GET",
         credentials: "include",
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
                  <td>
                    {f.type === "PREMIUM"
                      ? t("my_invoices.premium_label", { project: f.projetLibelle || "" })
                      : f.projetLibelle || "—"}
                  </td>
                  <td>
                    {f.datePaiement
                      ? formatDate(new Date(f.datePaiement), "dd MMM yyyy", {
                          locale: currentLocale,
                        })
                      : "-"}
                  </td>
                  <td>{formatCurrency(Number(f.montantTTC), "XOF")}</td>
                  <td>
                    <span className={styles.badge}>
                      {t("dividends.table.status_paid")}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => downloadFacture(f.id, f.numeroFacture)}
                      disabled={downloading === f.id}
                      className={styles.btnAction}
                      title={t("my_invoices.btn_download") as string}
                    >
                      {downloading === f.id ? (
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
