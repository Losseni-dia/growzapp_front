import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { BsShieldCheck } from "react-icons/bs";
import {
  FiClock,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiLock,
  FiMapPin,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../components/Context/AuthContext";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import InvestForm from "../../../components/Investissement/InvestForm/InvestForm";
import { api, buildProjetUrl } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import { DocumentDTO } from "../../../types/document";
import { ProjetDTO } from "../../../types/projet";
import styles from "./ProjetDetailsPage.module.css";
import { buildFileUrl } from "../../../service/Api";

export default function ProjetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isInvestMode = searchParams.get("action") === "invest";

  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const { user } = useAuth();

  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeDocs, setCanSeeDocs] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);

  const translateData = (
    category: "sectors" | "countries" | "cities",
    value?: string,
  ) => {
    if (!value) return "---";
    return t(`data.${category}.${value.trim().toUpperCase()}`, {
      defaultValue: value,
    });
  };

  const formatDate = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(i18n.language, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : t("project_details.date_undetermined");

  const loadProjet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Certains liens internes pointent encore vers l'ID numérique du
      // projet plutôt que son slug (ex: Mes investissements, Mon
      // portefeuille) — on route vers le bon endpoint selon le cas plutôt
      // que de systématiquement interroger /slug/{id}, qui échoue pour un
      // identifiant purement numérique.
      const isNumericId = /^\d+$/.test(id);
      const projetRes = await api.get<ApiResponse<ProjetDTO>>(
        buildProjetUrl(
          isNumericId ? `api/projets/${id}` : `api/projets/slug/${id}`,
        ),
      );
      const projetData = projetRes.data;
      setProjet(projetData);

      try {
        const docsRes = await api.get<ApiResponse<DocumentDTO[]>>(
          `api/documents/projet/${projetData.id}`,
        );
        if (docsRes?.data) {
          setDocuments(docsRes.data);
          setCanSeeDocs(true);
        }
      } catch (e: any) {
        if (e.message?.includes("403") || e.status === 403) {
          setCanSeeDocs(false);
        }
      }
    } catch {
      toast.error(t("project_details.error_not_found"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjet();
  }, [id, i18n.language]);

  // Ouvrir modal si ?action=invest
  useEffect(() => {
    if (isInvestMode) setShowInvestModal(true);
  }, [isInvestMode]);

  if (loading)
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
      </div>
    );
  if (!projet)
    return (
      <p className={styles.error}>{t("project_details.error_not_found")}</p>
    );

  const libelleAffiche = projet.libelleTradu || projet.libelle;
  const descriptionAffichee = projet.descriptionTradu || projet.description;

  const progress =
    projet.objectifFinancement > 0
      ? (Number(projet.montantCollecte || 0) /
          Number(projet.objectifFinancement)) *
        100
      : 0;

  const partsALever =
    projet.valeurTotalePartsEnPourcent > 0
      ? projet.valeurTotalePartsEnPourcent
      : projet.valuation > 0
        ? Math.round(
            (Number(projet.objectifFinancement) / Number(projet.valuation)) *
              100,
          )
        : 0;

  const dureeTexte = projet.dureeMois
    ? `${projet.dureeMois} ${t("project_details.months")}`
    : t("project_details.duration_undetermined");

  const financementTermine =
    progress >= 100 || projet.statutProjet === "TERMINE";

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{libelleAffiche} | GrowzApp</title>
        <meta
          name="description"
          content={descriptionAffichee?.substring(0, 160)}
        />
        <meta
          property="og:title"
          content={`${libelleAffiche} - Investissement GrowzApp`}
        />
        <meta property="og:image" content={projet.poster} />
      </Helmet>

      {/* ── HERO ───────────────────────────────────────────── */}
      <div className={styles.hero}>
        {projet.poster && (
          <img
            src={buildFileUrl(projet.poster)}
            alt={libelleAffiche}
            className={styles.heroPoster}
          />
        )}
        <div className={styles.heroOverlay} />

        {projet.certifiedAt && (
          <div className={styles.certifiedBadge}>
            <BsShieldCheck /> {t("project_details.certified")}
          </div>
        )}

        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            <span className={styles.sectorTag}>
              {translateData("sectors", projet.secteurNom)}
            </span>
            <span
              className={`${styles.statutTag} ${
                financementTermine
                  ? styles.tagTermine
                  : projet.statutProjet === "VALIDE"
                    ? styles.tagEnCours
                    : styles.tagDefault
              }`}
            >
              {financementTermine
                ? t("project_details.status_completed")
                : projet.statutProjet === "VALIDE"
                  ? t("project_details.in_progress")
                  : projet.statutProjet}
            </span>
          </div>
          <h1 className={styles.heroTitle}>{libelleAffiche}</h1>
          <div className={styles.heroInfos}>
            <span>
              <FiMapPin /> {projet.siteNom},{" "}
              {translateData("cities", projet.localiteNom)}
            </span>
            <span>
              <FiUsers />{" "}
              {projet.porteurNom || t("project_details.owner_anonymous")}
            </span>
            <span>
              <FiClock /> {dureeTexte}
            </span>
          </div>
        </div>
      </div>

      {/* ── CORPS ──────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* COLONNE GAUCHE */}
        <div className={styles.mainCol}>
          {/* Progression financement */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              📊 {t("project_details.financing")}
            </h2>
            <div className={styles.progressStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {format(
                    Number(projet.montantCollecte || 0),
                    projet.currencyCode,
                  )}
                </span>
                <span className={styles.statLabel}>
                  {t("project_details.collected_amount")}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={`${styles.statValue} ${styles.statHighlight}`}>
                  {progress.toFixed(1)}%
                </span>
                <span className={styles.statLabel}>
                  {t("project_details.reached")}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {format(
                    Number(projet.objectifFinancement || 0),
                    projet.currencyCode,
                  )}
                </span>
                <span className={styles.statLabel}>
                  {t("project_details.goal")}
                </span>
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${progress >= 100 ? styles.progressFull : ""}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className={styles.partsRow}>
              <span className={styles.partsPrises}>
                {projet.partsPrises ?? 0} {t("project_details.parts_prises")}
              </span>
              <span className={styles.partsDisponibles}>
                {projet.partsDisponible ?? 0}{" "}
                {t("project_details.parts_disponibles")}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              📋 {t("project_details.description_title")}
            </h2>
            <p className={styles.description}>
              {descriptionAffichee || t("project_details.no_description")}
            </p>
          </div>

          {/* Documents */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <FiFileText /> {t("project_details.documents_title")}
            </h2>
            {canSeeDocs ? (
              documents.length > 0 ? (
                <div className={styles.docGrid}>
                  {documents.map((doc) => (
                    <div key={doc.id} className={styles.docCard}>
                      <FiFileText size={22} color="var(--growz-primary)" />
                      <div className={styles.docInfo}>
                        <strong>{doc.nom}</strong>
                        <small>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </small>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL}/api/documents/${doc.id}/download`}
                        className={styles.downloadBtn}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiDownload />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noDocs}>
                  {t("project_details.no_documents")}
                </p>
              )
            ) : (
              <div className={styles.lockedDocs}>
                <FiLock size={32} />
                <div>
                  <strong>{t("project_details.docs_restricted_title")}</strong>
                  <p>{t("project_details.docs_restricted_hint")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE — sticky */}
        <div className={styles.sideCol}>
          {/* Métriques clés */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              💡 {t("project_details.key_metrics")}
            </h2>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <FiTrendingUp className={styles.metricIcon} />
                <span className={styles.metricValue}>
                  {projet.roiProjete || 0}%
                </span>
                <span className={styles.metricLabel}>
                  {t("project_details.roi_projected")}
                </span>
              </div>
              <div className={styles.metric}>
                <FiDollarSign className={styles.metricIcon} />
                <span className={styles.metricValue}>{partsALever}%</span>
                <span className={styles.metricLabel}>
                  {t("project_details.equity_to_raise")}
                </span>
              </div>
              <div className={styles.metric}>
                <FiClock className={styles.metricIcon} />
                <span className={styles.metricValue}>{dureeTexte}</span>
                <span className={styles.metricLabel}>
                  {t("project_details.duration")}
                </span>
              </div>
              <div className={styles.metric}>
                <FiShield className={styles.metricIcon} />
                <span className={styles.metricValue}>
                  {format(Number(projet.prixUnePart || 0), projet.currencyCode)}
                </span>
                <span className={styles.metricLabel}>
                  {t("project_details.price_per_share")}
                </span>
              </div>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span>{t("project_details.total_valuation")}</span>
                <strong>
                  {format(Number(projet.valuation || 0), projet.currencyCode)}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>{t("project_details.total_shares")}</span>
                <strong>
                  {(projet.partsPrises ?? 0) + (projet.partsDisponible ?? 0)}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>{t("project_details.start_date")}</span>
                <strong>{formatDate(projet.dateDebut)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>{t("project_details.end_date")}</span>
                <strong>{formatDate(projet.dateFin)}</strong>
              </div>
              {projet.googleMapsUrl && (
                <div className={styles.detailRow}>
                  <span>{t("project_details.location")}</span>
                  <a
                    href={projet.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapsLink}
                  >
                    📍 {t("project_details.view_on_maps")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Bouton investir */}
          {!financementTermine ? (
            <button
              className={styles.btnInvest}
              onClick={() => setShowInvestModal(true)}
              disabled={user?.kycStatus !== "VALIDE"}
            >
              <FiDollarSign /> {t("project_details.invest_button")}
            </button>
          ) : (
            <div className={styles.btnFinished}>
              ✅ {t("project_details.financing_completed")}
            </div>
          )}

          {user?.kycStatus !== "VALIDE" && (
            <div className={styles.kycWarning}>
              <FiLock /> {t("project_details.kyc_warning")}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL INVESTISSEMENT ────────────────────────────── */}
      {showInvestModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowInvestModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {t("project_details.invest_in_title")}{" "}
                <span>{libelleAffiche}</span>
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowInvestModal(false)}
              >
                <FiX size={22} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <InvestForm
                projet={projet}
                onSuccess={() => {
                  setShowInvestModal(false);
                  loadProjet();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
