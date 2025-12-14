// src/pages/Contrat/ContratView/ContratView.tsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format as formatDate } from "date-fns"; // Renommé pour éviter le conflit avec useCurrency
import { fr, enUS, es } from "date-fns/locale";
import styles from "./ContratView.module.css";
import { FiCheckCircle, FiDownload, FiShield } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { api } from "../../../service/api";
import { useCurrency } from "../../../components/context/CurrencyContext"; // Vérifie bien le chemin
import toast from "react-hot-toast";

// Interface des données attendues du Backend
interface ContratData {
  numeroContrat: string;
  dateGeneration: string;
  projet: string;
  investisseur: string;
  emailInvestisseur: string;
  telephone: string;
  montantInvesti: number;
  nombreParts: number;
  prixUnitaire: number;
  pourcentage: number;
  statutInvestissement: string;
  lienVerification: string;
  lienPdf: string;
  currencyCode?: string; // Code monnaie d'origine du contrat (ex: XOF)
}

const ContratViewer: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const { t, i18n } = useTranslation();

  // Hook de conversion monétaire
  const { format: formatCurrency } = useCurrency();

  const [data, setData] = useState<ContratData | null>(null);
  const [loading, setLoading] = useState(true);

  // Gestion de la langue pour les dates
  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    if (numero) {
      // Appel API pour récupérer les datas du contrat
      api
        .get<ContratData>(`/api/contrats/data/${numero}`)
        .then((res) => setData(res))
        .catch(() => toast.error(t("contract_details.error_load")))
        .finally(() => setLoading(false));
    }
  }, [numero, t]);

  if (loading)
    return <div className={styles.loading}>{t("common.loading")}</div>;

  if (!data)
    return (
      <div className={styles.error}>{t("contract_details.not_found")}</div>
    );

  // Calcul prix unitaire si manquant (basé sur la monnaie d'origine)
  const prixPartOrigine =
    data.prixUnitaire ||
    (data.nombreParts > 0 ? data.montantInvesti / data.nombreParts : 0);

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

        {/* CORPS DU CONTRAT */}
        <div className={styles.body}>
          {/* Section Projet */}
          <div className={styles.section}>
            <h3>{t("contract_details.section_project")}</h3>
            <div className={styles.row}>
              <span className={styles.label}>
                {t("contract_details.label_project")} :
              </span>
              <span className={styles.value}>{data.projet}</span>
            </div>
          </div>

          {/* Section Investisseur */}
          <div className={styles.section}>
            <h3>{t("contract_details.section_investor")}</h3>
            <div className={styles.row}>
              <span className={styles.label}>
                {t("contract_details.label_investor")} :
              </span>
              <span className={styles.value}>{data.investisseur}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>
                {t("contract_details.label_email")} :
              </span>
              <span className={styles.value}>{data.emailInvestisseur}</span>
            </div>
          </div>

          {/* Section Détails Investissement avec CONVERSION DYNAMIQUE */}
          <div className={styles.section}>
            <h3>{t("contract_details.section_investment")}</h3>
            <div className={styles.gridInfo}>
              <div className={styles.infoBox}>
                <span className={styles.boxLabel}>
                  {t("contract_details.label_amount")}
                </span>
                <span className={styles.boxValue}>
                  {/* Conversion dynamique du montant total */}
                  {formatCurrency(
                    data.montantInvesti,
                    data.currencyCode || "XOF"
                  )}
                </span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.boxLabel}>
                  {t("contract_details.label_shares")}
                </span>
                <span className={styles.boxValue}>{data.nombreParts}</span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.boxLabel}>
                  {t("contract_details.label_unit_price")}
                </span>
                <span className={styles.boxValue}>
                  {/* Conversion dynamique du prix de la part */}
                  {formatCurrency(prixPartOrigine, data.currencyCode || "XOF")}
                </span>
              </div>
            </div>

            <div className={styles.row} style={{ marginTop: "1rem" }}>
              <span className={styles.label}>
                {t("contract_details.label_date")} :
              </span>
              <span className={styles.value}>
                {formatDate(new Date(data.dateGeneration), "dd MMMM yyyy", {
                  locale: currentLocale,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className={styles.signatures}>
          <div className={styles.sigBlock}>
            <div className={styles.sigItem}>
              <p>GrowzApp Inc.</p>
              <div className={styles.stamp}>
                <FiCheckCircle /> {t("contract_details.signed_by")} Admin
              </div>
            </div>
            <div className={styles.sigItem}>
              <p>{data.investisseur}</p>
              <div className={styles.stamp}>
                <FiCheckCircle /> {t("contract_details.signed_by")}{" "}
                {data.investisseur}
              </div>
            </div>
          </div>
        </div>

        {/* PIED DE PAGE CERTIFIÉ */}
        <div className={styles.footer}>
          <div className={styles.blockchainInfo}>
            <FiShield size={20} />
            <span>{t("contract_details.certified")}</span>
          </div>
          <div className={styles.qrLink}>
            <a
              href={data.lienVerification}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.lienVerification}
            </a>
          </div>
        </div>
      </div>

      {/* ACTION TÉLÉCHARGEMENT */}
      <div className={styles.actions}>
        <a
          href={data.lienPdf}
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
