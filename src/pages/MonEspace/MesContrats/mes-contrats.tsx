// src/pages/MonEspace/Mes-contrats/MesContratsPage.tsx
import { format as formatDate } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiDownload, FiEye, FiFileText } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildProjetUrl } from "../../../service/Api";
import { InvestissementDTO } from "../../../types/investissement";
import styles from "./mes-contrats.module.css";

export default function MesContratsPage() {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const [contrats, setContrats] = useState<InvestissementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    api
      .get<{ data: InvestissementDTO[] }>(
        buildProjetUrl("/api/investissements/mes-investissements"),
      )
      .then((res) => {
        const all = res.data || [];
        // Un contrat n'existe que pour les investissements validés avec numéro de contrat
        setContrats(all.filter((inv) => !!inv.numeroContrat));
      })
      .catch(() => toast.error(t("contract_view.error_generic")))
      .finally(() => setLoading(false));
  }, [t]);

 const handleVoir = async (numeroContrat: string) => {
   try {
     setDownloading(numeroContrat);
     const lang = i18n.language || "fr";
     const response = await fetch(
       `${BASE_URL}/api/contrats/${numeroContrat}?lang=${lang}`,
       {
         method: "GET",
         credentials: "include",
       },
     );

     if (!response.ok) throw new Error();
     const blob = await response.blob();
     window.open(URL.createObjectURL(blob), "_blank");
   } catch {
     toast.error(t("contract_view.error_generic"));
   } finally {
     setDownloading(null);
   }
 };

 const handleDownload = async (numeroContrat: string) => {
   try {
     setDownloading(numeroContrat);
     const lang = i18n.language || "fr";
     const response = await fetch(
       `${BASE_URL}/api/contrats/${numeroContrat}/download?lang=${lang}`,
       {
         method: "GET",
         credentials: "include",
       },
     );
     if (!response.ok) throw new Error();
     const blob = await response.blob();
     const link = document.createElement("a");
     link.href = URL.createObjectURL(blob);
     link.setAttribute("download", `Contrat_${numeroContrat}_${lang}.pdf`);
     document.body.appendChild(link);
     link.click();
     link.parentNode?.removeChild(link);
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
          <FiFileText /> {t("my_contracts.title")}
        </h1>
        <p>{t("my_contracts.count", { count: contrats.length })}</p>
      </div>

      {contrats.length === 0 ? (
        <div className={styles.emptyState}>
          <FiFileText size={64} />
          <p>{t("my_contracts.empty")}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("my_contracts.table.number")}</th>
                <th>{t("my_contracts.table.project")}</th>
                <th>{t("my_contracts.table.date")}</th>
                <th>{t("my_contracts.table.amount")}</th>
                <th>{t("my_contracts.table.status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contrats.map((c) => (
                <tr key={c.id}>
                  <td className={styles.mono}>{c.numeroContrat}</td>
                  <td>{c.projetLibelleTradu || c.projetLibelle}</td>
                  <td>
                    {formatDate(new Date(c.date), "dd MMM yyyy", {
                      locale: currentLocale,
                    })}
                  </td>
                  <td>{formatCurrency(c.montantInvesti, "XOF")}</td>
                  <td>
                    <span className={styles.badge}>
                      {t(
                        `user_investments.status.${
                          c.statutPartInvestissement === "VALIDE"
                            ? "validated"
                            : c.statutPartInvestissement === "EN_ATTENTE"
                              ? "pending"
                              : "rejected"
                        }`,
                      )}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleVoir(c.numeroContrat!)}
                        disabled={!!downloading}
                        className={styles.btnAction}
                        title={t("my_contracts.btn_view") as string}
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(c.numeroContrat!)}
                        disabled={!!downloading}
                        className={styles.btnAction}
                        title={t("my_contracts.btn_download") as string}
                      >
                        {downloading === c.numeroContrat ? (
                          "..."
                        ) : (
                          <FiDownload size={16} />
                        )}
                      </button>
                    </div>
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
