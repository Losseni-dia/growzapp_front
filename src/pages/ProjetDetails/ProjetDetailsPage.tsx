// src/pages/ProjetDetails/ProjetDetailsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../service/api";
import { ProjetDTO } from "../../types/projet";
import { DocumentDTO } from "../../types/document";
import InvestForm from "../../components/Investissement/InvestForm/InvestForm";
import toast from "react-hot-toast";
import styles from "./ProjetDetailsPage.module.css";
import { ApiResponse } from "../../types/common";
import { useAuth } from "../../components/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/context/CurrencyContext"; // IMPORT CONTEXT
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiFile,
  FiLock,
} from "react-icons/fi";

export default function ProjetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { format } = useCurrency(); // HOOK MONNAIE

  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const translateData = (
    category: "sectors" | "countries" | "cities",
    value?: string
  ) => {
    if (!value) return "---";
    const searchKey = value.trim().toUpperCase();
    return t(`data.${category}.${searchKey}`, { defaultValue: value });
  };

  const loadProjetAndDocuments = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projetRes, docsRes] = await Promise.all([
        api.get<ApiResponse<ProjetDTO>>(`api/projets/${id}`),
        api.get<ApiResponse<DocumentDTO[]>>(`api/documents/projet/${id}`),
      ]);
      setProjet(projetRes.data);
      setDocuments(docsRes.data || []);
    } catch (err: any) {
      toast.error(t("project_details.error_not_found"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjetAndDocuments();
  }, [id, t]);

  if (loading)
    return <p className={styles.loading}>{t("project_details.loading")}</p>;
  if (!projet)
    return (
      <p className={styles.error}>{t("project_details.error_not_found")}</p>
    );

  const progress =
    projet.objectifFinancement > 0
      ? (projet.montantCollecte / projet.objectifFinancement) * 100
      : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {projet.poster && (
          <img
            src={projet.poster}
            alt={projet.libelle}
            className={styles.poster}
          />
        )}
        <div className={styles.info}>
          <h1>{projet.libelle}</h1>
          <p>
            <strong>{t("project_details.sector")} :</strong>{" "}
            {translateData("sectors", projet.secteurNom)}
          </p>
          <p>
            <strong>{t("project_details.location")} :</strong> {projet.siteNom},{" "}
            {translateData("cities", projet.localiteNom)}
          </p>
          <div className={styles.roiBadge}>
            {t("project_details.roi_projected")} : {projet.roiProjete}%
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div>
          {/* CONVERSION ICI */}
          <strong>
            {format(projet.montantCollecte, projet.currencyCode)}
          </strong>{" "}
          {t("project_details.collected")}
        </div>
        <div>
          {/* CONVERSION ICI */}
          <strong>
            {format(projet.objectifFinancement, projet.currencyCode)}
          </strong>{" "}
          {t("project_details.goal")}
        </div>
        <div>
          <strong>{progress.toFixed(0)}%</strong> {t("project_details.reached")}
        </div>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.description}>
        <h2>{t("project_details.description_title")}</h2>
        <p>{projet.description}</p>
      </div>

      <div className={styles.investSection}>
        <h2>{t("project_details.invest_title")}</h2>
        <InvestForm
          projet={projet}
          onSuccess={() => loadProjetAndDocuments()}
        />
      </div>
    </div>
  );
}
