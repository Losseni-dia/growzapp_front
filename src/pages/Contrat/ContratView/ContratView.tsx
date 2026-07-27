import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./ContratView.module.css";
import { FiCheckCircle, FiDownload, FiShield, FiEye } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { api } from "../../../service/Api";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import toast from "react-hot-toast";

// Interface alignée sur GET /api/contrats/details/{numero}
interface ContratDetails {
  numeroContrat: string;
  investisseur: {
    prenom: string;
    nom: string;
    email: string;
  };
  montantInvesti: number;
}

const ContratViewer: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const [data, setData] = useState<ContratDetails | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!numero) return;
    api
      .get<ContratDetails>(`/api/contrats/details/${numero}`)
      .then((res: any) => {
        // Gère { data: {...} } ou réponse directe
        const d = res?.data ?? res;
        setData(d);
      })
      .catch(() => toast.error(t("contract_details.error_load")))
      .finally(() => setLoading(false));
  }, [numero, t]);

  if (loading)
    return <div className={styles.loading}>{t("common.loading")}</div>;

  if (!data)
    return (
      <div className={styles.error}>{t("contract_details.not_found")}</div>
    );

  const nomInvestisseur = `${data.investisseur.prenom} ${data.investisseur.nom}`;
  const pdfUrl = `/api/contrats/${numero}`;
  const dlUrl = `/api/contrats/${numero}/download`;

  return (
    <div className={styles.container}>
      <div className={styles.paper}>
        {/* EN-TÊTE */}
        <div className={styles.header}>
          <div className={styles.logo}>GrowzApp</div>
          <div className={styles.contractTitle}>
            <h1>{t("contract_details.title")}</h1>
            <p>{t("contract_details.subtitle")}</p>
          </div>
          <div className={styles.ref}>
            <strong>{t("contract_details.ref")} :</strong> {data.numeroContrat}
          </div>
        </div>

        <div className={styles.divider} />

        {/* CORPS */}
        <div className={styles.body}>
          {/* Section Investisseur */}
          <div className={styles.section}>
            <h3>{t("contract_details.section_investor")}</h3>
            <div className={styles.row}>
              <span className={styles.label}>
                {t("contract_details.label_investor")} :
              </span>
              <span className={styles.value}>{nomInvestisseur}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>
                {t("contract_details.label_email")} :
              </span>
              <span className={styles.value}>{data.investisseur.email}</span>
            </div>
          </div>

          {/* Section Investissement */}
          <div className={styles.section}>
            <h3>{t("contract_details.section_investment")}</h3>
            <div className={styles.gridInfo}>
              <div className={styles.infoBox}>
                <span className={styles.boxLabel}>
                  {t("contract_details.label_amount")}
                </span>
                <span className={styles.boxValue}>
                  {formatCurrency(data.montantInvesti, "XOF")}
                </span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.boxLabel}>
                  {t("contract_details.ref")}
                </span>
                <span className={styles.boxValue}>{data.numeroContrat}</span>
              </div>
            </div>
          </div>

          {/* Aperçu PDF inline */}
          <div className={styles.section}>
            <h3>📄 Contrat PDF</h3>
            <iframe
              src={pdfUrl}
              title="Contrat PDF"
              width="100%"
              height="600px"
              style={{ border: "1px solid #e0e0e0", borderRadius: "8px" }}
            />
          </div>
        </div>

        {/* SIGNATURES */}
        <div className={styles.signatures}>
          <div className={styles.sigBlock}>
            <div className={styles.sigItem}>
              <p>GrowzApp S.A.R.L</p>
              <div className={styles.stamp}>
                <FiCheckCircle /> {t("contract_details.signed_by")} Admin
              </div>
            </div>
            <div className={styles.sigItem}>
              <p>{nomInvestisseur}</p>
              <div className={styles.stamp}>
                <FiCheckCircle /> {t("contract_details.signed_by")}{" "}
                {nomInvestisseur}
              </div>
            </div>
          </div>
        </div>

        {/* PIED DE PAGE */}
        <div className={styles.footer}>
          <div className={styles.blockchainInfo}>
            <FiShield size={20} />
            <span>{t("contract_details.certified")}</span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewBtn}
        >
          <FiEye /> Voir le PDF
        </a>
        <a
          href={dlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.downloadBtn}
        >
          <FiDownload /> {t("contract_details.btn_download")}
        </a>
      </div>
    </div>
  );
};

export default ContratViewer;
