import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "../../../service/Api";
import { ProjetDTO } from "../../../types/projet";
import { DocumentDTO } from "../../../types/document";
import InvestForm from "../../../components/Investissement/InvestForm/InvestForm";
import toast from "react-hot-toast";
import styles from "./ProjetDetailsPage.module.css";
import { ApiResponse } from "../../../types/common";
import { useAuth } from "../../../components/Context/AuthContext";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import {
  FiDownload,
  FiFileText,
  FiLock,
  FiArrowLeft,
  FiMapPin,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiX,
  FiShield,
} from "react-icons/fi";
import { BsShieldCheck } from "react-icons/bs";

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
      : "Indéterminée";

  const loadProjet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const projetRes = await api.get<ApiResponse<ProjetDTO>>(
        `api/projets/slug/${id}`,
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
  }, [id]);

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
    ? `${projet.dureeMois} mois`
    : "Durée indéterminée";

  const financementTermine =
    progress >= 100 || projet.statutProjet === "TERMINE";

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{projet.libelle} | GrowzApp</title>
        <meta
          name="description"
          content={projet.description?.substring(0, 160)}
        />
        <meta
          property="og:title"
          content={`${projet.libelle} - Investissement GrowzApp`}
        />
        <meta property="og:image" content={projet.poster} />
      </Helmet>

      {/* ── HERO ───────────────────────────────────────────── */}
      <div className={styles.hero}>
        {projet.poster && (
          <img
            src={projet.poster}
            alt={projet.libelle}
            className={styles.heroPoster}
          />
        )}
        <div className={styles.heroOverlay} />

        {projet.certifiedAt && (
          <div className={styles.certifiedBadge}>
            <BsShieldCheck /> Certifié GrowzApp
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
                ? "Terminé"
                : projet.statutProjet === "VALIDE"
                  ? "En cours"
                  : projet.statutProjet}
            </span>
          </div>
          <h1 className={styles.heroTitle}>{projet.libelle}</h1>
          <div className={styles.heroInfos}>
            <span>
              <FiMapPin /> {projet.siteNom},{" "}
              {translateData("cities", projet.localiteNom)}
            </span>
            <span>
              <FiUsers /> {projet.porteurNom || "Porteur anonyme"}
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
            <h2 className={styles.cardTitle}>📊 Financement</h2>
            <div className={styles.progressStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {format(
                    Number(projet.montantCollecte || 0),
                    projet.currencyCode,
                  )}
                </span>
                <span className={styles.statLabel}>Collectés</span>
              </div>
              <div className={styles.stat}>
                <span className={`${styles.statValue} ${styles.statHighlight}`}>
                  {progress.toFixed(1)}%
                </span>
                <span className={styles.statLabel}>Atteint</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {format(
                    Number(projet.objectifFinancement || 0),
                    projet.currencyCode,
                  )}
                </span>
                <span className={styles.statLabel}>Objectif</span>
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
                {projet.partsPrises ?? 0} parts prises
              </span>
              <span className={styles.partsDisponibles}>
                {projet.partsDisponible ?? 0} parts disponibles
              </span>
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📋 Description du projet</h2>
            <p className={styles.description}>
              {projet.description || "Aucune description fournie."}
            </p>
          </div>

          {/* Documents */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <FiFileText /> Documents
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
                  Aucun document publié pour ce projet.
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
            <h2 className={styles.cardTitle}>💡 Métriques clés</h2>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <FiTrendingUp className={styles.metricIcon} />
                <span className={styles.metricValue}>
                  {projet.roiProjete || 0}%
                </span>
                <span className={styles.metricLabel}>ROI projeté</span>
              </div>
              <div className={styles.metric}>
                <FiDollarSign className={styles.metricIcon} />
                <span className={styles.metricValue}>{partsALever}%</span>
                <span className={styles.metricLabel}>Équité à lever</span>
              </div>
              <div className={styles.metric}>
                <FiClock className={styles.metricIcon} />
                <span className={styles.metricValue}>{dureeTexte}</span>
                <span className={styles.metricLabel}>Durée</span>
              </div>
              <div className={styles.metric}>
                <FiShield className={styles.metricIcon} />
                <span className={styles.metricValue}>
                  {format(Number(projet.prixUnePart || 0), projet.currencyCode)}
                </span>
                <span className={styles.metricLabel}>Prix / part</span>
              </div>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span>Valorisation totale</span>
                <strong>
                  {format(Number(projet.valuation || 0), projet.currencyCode)}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Parts totales</span>
                <strong>
                  {(projet.partsPrises ?? 0) + (projet.partsDisponible ?? 0)}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Début</span>
                <strong>{formatDate(projet.dateDebut)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Fin</span>
                <strong>{formatDate(projet.dateFin)}</strong>
              </div>
              {projet.googleMapsUrl && (
                <div className={styles.detailRow}>
                  <span>Localisation</span>
                  <a
                    href={projet.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapsLink}
                  >
                    📍 Voir sur la carte
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
              <FiDollarSign /> Investir dans ce projet
            </button>
          ) : (
            <div className={styles.btnFinished}>✅ Financement terminé</div>
          )}

          {user?.kycStatus !== "VALIDE" && (
            <div className={styles.kycWarning}>
              <FiLock /> Votre KYC doit être validé pour investir
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
                Investir dans <span>{projet.libelle}</span>
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
