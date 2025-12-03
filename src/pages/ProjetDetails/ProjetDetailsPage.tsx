// src/pages/ProjetDetailsPage.tsx
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
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiFile,
  FiLock,
} from "react-icons/fi";

export default function ProjetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
      // Si 403 → pas d'accès aux documents → on garde juste le projet
      if (err.message.includes("403") || err.message.includes("refusé")) {
        const projetRes = await api.get<ApiResponse<ProjetDTO>>(
          `api/projets/${id}`
        );
        setProjet(projetRes.data);
        setDocuments([]);
      } else {
        toast.error(err.message || "Projet non trouvé");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjetAndDocuments();
  }, [id]);

  const formatNumber = (value?: number | null): string => {
    return (value ?? 0).toLocaleString("fr-FR");
  };

  const progress =
    projet?.objectifFinancement && projet.objectifFinancement > 0
      ? (projet.montantCollecte / projet.objectifFinancement) * 100
      : 0;

  const handleInvestSuccess = () => {
    toast.success("Investissement pris en compte ! Mise à jour...");
    loadProjetAndDocuments(); // Recharge proprement
  };

  const handleDownload = async (docId: number, nom: string, type: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/documents/${docId}/download`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("access_token") || ""
            }`,
          },
        }
      );
      if (!response.ok) throw new Error("Téléchargement impossible");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "PDF" ? `${nom}.pdf` : nom;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger le document");
    }
  };

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FiFileText color="#d32f2f" size={26} />;
      case "EXCEL":
      case "CSV":
        return <FiFile color="#1B5E20" size={26} />;
      default:
        return <FiImage color="#1B5E20" size={26} />;
    }
  };

  const hasAccessToDocuments = () => {
    if (!user || !projet) return false;
    if (user.roles?.includes("ADMIN")) return true;
    if (projet.porteurId === user.id) return true;
    return projet.investissements?.some(
      (inv) => inv.investisseurId === user.id
    );
  };

  if (loading) return <p className={styles.loading}>Chargement du projet...</p>;
  if (!projet) return <p className={styles.error}>Projet introuvable</p>;

  return (
    <div className={styles.container}>
      {/* === HEADER EXISTANT === */}
      <div className={styles.header}>
        {projet.poster ? (
          <img
            src={projet.poster}
            alt={projet.libelle}
            className={styles.poster}
            loading="lazy"
          />
        ) : (
          <div className={styles.noPoster}>Aucun poster disponible</div>
        )}
        <div className={styles.info}>
          <h1>{projet.libelle}</h1>
          <p>
            <strong>Secteur :</strong> {projet.secteurNom || "Non renseigné"}
          </p>
          <p>
            <strong>Localisation :</strong> {projet.siteNom},{" "}
            {projet.localiteNom}
          </p>
          <p>
            <strong>Pays :</strong> {projet.paysNom || "Non renseigné"}
          </p>
          <div className={styles.roiBadge}>
            ROI Projeté : {projet.roiProjete}%
          </div>
        </div>
      </div>

      {/* === STATS + PROGRESS === */}
      <div className={styles.stats}>
        <div>
          <strong>{formatNumber(projet.montantCollecte)} €</strong> collectés
        </div>
        <div>
          <strong>{formatNumber(projet.objectifFinancement)} €</strong> objectif
        </div>
        <div>
          <strong>{progress.toFixed(0)}%</strong> atteint
        </div>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.description}>
        <h2>Description du projet</h2>
        <p>{projet.description}</p>
      </div>

      {/* === NOUVELLE SECTION : DOCUMENTS === */}
      {hasAccessToDocuments() ? (
        <div className={styles.documentsSection}>
          <h2>
            <FiLock style={{ marginRight: 8 }} />
            Documents du projet ({documents.length})
          </h2>
          {documents.length === 0 ? (
            <p className={styles.noDocs}>
              Aucun document disponible pour le moment
            </p>
          ) : (
            <div className={styles.docGrid}>
              {documents.map((doc) => (
                <div key={doc.id} className={styles.docCard}>
                  <div className={styles.docIcon}>{getIcon(doc.type)}</div>
                  <div className={styles.docInfo}>
                    <strong>{doc.nom}</strong>
                    <small>
                      {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                    </small>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.id, doc.nom, doc.type)}
                    className={styles.downloadBtn}
                    title="Télécharger"
                  >
                    <FiDownload />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* === INVESTISSEMENT === */}
      <div className={styles.investSection}>
        <h2>Investir dans ce projet</h2>
        <InvestForm projet={projet} onSuccess={handleInvestSuccess} />
      </div>
    </div>
  );
}
