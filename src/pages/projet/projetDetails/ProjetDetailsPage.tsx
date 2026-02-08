import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom"; // Ajout de useSearchParams et Link
import { api } from "../../service/Api";
import { ProjetDTO } from "../../types/projet";
import { DocumentDTO } from "../../types/document";
import InvestForm from "../../components/Investissement/InvestForm/InvestForm";
import toast from "react-hot-toast";
import styles from "./ProjetDetailsPage.module.css";
import { ApiResponse } from "../../types/common";
import { useAuth } from "../../components/Context/AuthContext";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../components/Context/CurrencyContext";
import {
  FiDownload,
  FiFileText,
  FiLock,
  FiArrowLeft, // Icône de retour
} from "react-icons/fi";

export default function ProjetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isInvestMode = searchParams.get("action") === "invest"; // Détection du mode

  const { t } = useTranslation();
  const { format } = useCurrency();
  const { user } = useAuth();

  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeDocs, setCanSeeDocs] = useState(true);

  const translateData = (category: "sectors" | "countries" | "cities", value?: string) => {
    if (!value) return "---";
    const searchKey = value.trim().toUpperCase();
    return t(`data.${category}.${searchKey}`, { defaultValue: value });
  };

  const loadProjetAndDocuments = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const projetRes = await api.get<ApiResponse<ProjetDTO>>(`api/projets/${id}`);
      setProjet(projetRes.data);

      try {
        const docsRes = await api.get<ApiResponse<DocumentDTO[]>>(`api/documents/projet/${id}`);
        if (docsRes && docsRes.data) {
          setDocuments(docsRes.data);
          setCanSeeDocs(true);
        }
      } catch (docErr: any) {
        if (docErr.message?.includes("403") || docErr.status === 403) {
          setCanSeeDocs(false);
          setDocuments([]);
        }
      }
    } catch (err: any) {
      toast.error(t("project_details.error_not_found"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjetAndDocuments();
  }, [id, t]);

  if (loading) return <p className={styles.loading}>{t("project_details.loading")}</p>;
  if (!projet) return <p className={styles.error}>{t("project_details.error_not_found")}</p>;

  const progress = projet.objectifFinancement > 0
      ? (projet.montantCollecte / projet.objectifFinancement) * 100
      : 0;

  // ==========================================
  // RENDU 1 : MODE INVESTIR (Checkout)
  // ==========================================
  if (isInvestMode) {
    return (
      <div className={styles.container}>
        <div className={styles.checkoutHeader}>
          <Link to={`/projet/${id}`} className={styles.backBtn}>
            <FiArrowLeft /> {t("project_details.back_to_details") || "Retour au projet"}
          </Link>
          <h1 className={styles.checkoutTitle}>
            {t("project_details.invest_in_title") || "Investir dans"} <span>{projet.libelle}</span>
          </h1>
          <div className={styles.priceRecall}>
            {t("project_card.price_per_share")} : <strong>{format(projet.prixUnePart, projet.currencyCode)}</strong>
          </div>
        </div>

        <div className={styles.checkoutFormWrapper}>
          <InvestForm projet={projet} onSuccess={() => loadProjetAndDocuments()} />
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDU 2 : MODE COMPLET (Détails)
  // ==========================================
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {projet.poster && (
          <img src={projet.poster} alt={projet.libelle} className={styles.poster} />
        )}
        <div className={styles.info}>
          <h1>{projet.libelle}</h1>
          <p><strong>{t("project_details.sector")} :</strong> {translateData("sectors", projet.secteurNom)}</p>
          <p><strong>{t("project_details.location")} :</strong> {projet.siteNom}, {translateData("cities", projet.localiteNom)}</p>
          <div className={styles.roiBadge}>
            {t("project_details.roi_projected")} : {projet.roiProjete}%
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div><strong>{format(projet.montantCollecte, projet.currencyCode)}</strong> {t("project_details.collected")}</div>
        <div><strong>{format(projet.objectifFinancement, projet.currencyCode)}</strong> {t("project_details.goal")}</div>
        <div><strong>{progress.toFixed(0)}%</strong> {t("project_details.reached")}</div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.description}>
        <h2>{t("project_details.description_title")}</h2>
        <p>{projet.description}</p>
      </div>

      <div className={styles.investSection}>
        <div className={styles.sectionTitleRow}>
          <h2>{t("project_details.invest_title")}</h2>
          {user?.kycStatus !== "VALIDE" && (
            <span className={styles.lockedBadge}>
              <FiLock /> {t("kyc.status_locked")}
            </span>
          )}
        </div>
        <InvestForm projet={projet} onSuccess={() => loadProjetAndDocuments()} />
      </div>

      <div className={styles.documentsSection}>
        <h2><FiFileText style={{ marginRight: "10px" }} />{t("project_details.documents_title")}</h2>
        {canSeeDocs ? (
          <div className={styles.docGrid}>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc.id} className={styles.docCard}>
                  <FiFileText size={24} color="#1B5E20" />
                  <div className={styles.docInfo}>
                    <strong>{doc.nom}</strong>
                    <small>{new Date(doc.uploadedAt).toLocaleDateString()}</small>
                  </div>
                  <a href={`${import.meta.env.VITE_API_URL}/api/documents/${doc.id}/download`} className={styles.downloadBtn}><FiDownload /></a>
                </div>
              ))
            ) : (<p className={styles.noDocs}>{t("project_details.no_documents")}</p>)}
          </div>
        ) : (
          <div className={styles.lockedDocs}>
            <FiLock size={40} className={styles.lockIconLarge} />
            <div className={styles.lockedText}>
              <h3>{t("project_details.docs_restricted_title")}</h3>
              <p>{t("project_details.docs_restricted_hint")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}