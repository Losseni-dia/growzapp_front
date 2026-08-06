// src/pages/Admin/ProjetAdminDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../../service/Api";
import DocumentUpload from "../../../../components/DocumentUpload/DocumentUpload";
import { useAuth } from "../../../../components/Context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ProjetAdminDetail.module.css";
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiFile, // Icône existante et parfaite pour Excel/CSV
} from "react-icons/fi";
import { ApiResponse } from "../../../../types/common";
import { ProjetDTO } from "../../../../types/projet";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface DocumentDTO {
  id: number;
  nom: string;
  url: string;
  type: string;
  uploadedAt: string;
  statut?: string;
}

export default function ProjetAdminDetail() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const navigate = useNavigate();
  const [showRevaloriser, setShowRevaloriser] = useState(false);
  const [nouvelleValorisation, setNouvelleValorisation] = useState("");
  const [motifRevalorisation, setMotifRevalorisation] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      toast.error(err.message || "Erreur lors du chargement du projet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadProjetAndDocuments();
  }, [id]);

  const handleDownload = async (docId: number, nom: string, type: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${docId}/download`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Téléchargement refusé");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "PDF"
          ? `${nom}.pdf`
          : type === "EXCEL"
            ? `${nom}.xlsx`
            : type === "CSV"
              ? `${nom}.csv`
              : nom;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Téléchargement démarré !");
    } catch (err: any) {
      toast.error(err.message || "Échec du téléchargement");
    }
  };

  const handleApprouver = async (docId: number) => {
    try {
      await api.patch(`api/documents/${docId}/approuver`, {});
      loadProjetAndDocuments();
    } catch (err) {
      console.error("Erreur approbation document", err);
    }
  };

  const handleRejeter = async (docId: number) => {
    try {
      await api.patch(`api/documents/${docId}/rejeter`, {});
      loadProjetAndDocuments();
    } catch (err) {
      console.error("Erreur rejet document", err);
    }
  };

  const handleSupprimer = async () => {
    if (!projet) return;
    if (!window.confirm(`Supprimer définitivement "${projet.libelle}" ?`))
      return;
    try {
      await api.delete(`api/admin/projets/${projet.id}`);
      toast.success("Projet supprimé");
      navigate("/admin/projets");
    } catch (err: any) {
      toast.error(err.message || "Échec de la suppression");
    }
  };

  const handleRevaloriser = async () => {
    if (!nouvelleValorisation || parseFloat(nouvelleValorisation) <= 0) {
      toast.error("Valorisation invalide");
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`api/admin/projets/${projet?.id}/revaloriser`, {
        nouvelleValorisation: parseFloat(nouvelleValorisation),
        motif: motifRevalorisation || "Réévaluation manuelle",
      });
      toast.success("Projet réévalué avec succès");
      setShowRevaloriser(false);
      setNouvelleValorisation("");
      setMotifRevalorisation("");
      loadProjetAndDocuments();
    } catch (err: any) {
      toast.error(err.message || "Échec de la réévaluation");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FiFileText color="#d32f2f" size={28} />;
      case "EXCEL":
      case "CSV":
        return <FiFile color="var(--growz-hex-primary, #1b5e20)" size={28} />; // Icône fichier générique (parfaite)
      default:
        return <FiImage color="var(--growz-hex-primary, #1b5e20)" size={28} />;
    }
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (!projet) return <div className={styles.error}>Projet non trouvé</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Administration : {projet.libelle}</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.btnRevaloriser}
            onClick={() => {
              setNouvelleValorisation(
                projet.valuation ? String(projet.valuation) : "",
              );
              setShowRevaloriser(true);
            }}
          >
            Réévaluer
          </button>
          <button className={styles.btnDelete} onClick={handleSupprimer}>
            Supprimer
          </button>
        </div>
      </div>
      {showRevaloriser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowRevaloriser(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Réévaluer le projet</h2>
            <label>Nouvelle valorisation (FCFA)</label>
            <input
              type="number"
              value={nouvelleValorisation}
              onChange={(e) => setNouvelleValorisation(e.target.value)}
              autoFocus
            />
            <label>Motif</label>
            <input
              type="text"
              value={motifRevalorisation}
              onChange={(e) => setMotifRevalorisation(e.target.value)}
              placeholder="Ex : audit Q1 2026"
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowRevaloriser(false)}>Annuler</button>
              <button onClick={handleRevaloriser} disabled={submitting}>
                {submitting ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload réservé à l'admin */}
      {user?.roles?.includes("ADMIN") && (
        <DocumentUpload
          projetId={Number(id)}
          onUploadSuccess={loadProjetAndDocuments}
        />
      )}

      {/* Liste des documents */}
      <div className={styles.documentsSection}>
        <h2>Documents du projet ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className={styles.noDocs}>Aucun document uploadé pour l'instant</p>
        ) : (
          <div className={styles.grid}>
            {documents.map((doc) => (
              <div key={doc.id} className={styles.docCard}>
                <div className={styles.docIcon}>{getIcon(doc.type)}</div>
                <div className={styles.docInfo}>
                  <strong>{doc.nom}</strong>
                  <small>
                    {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                  </small>
                  {doc.statut && doc.statut !== "APPROUVE" && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background:
                          doc.statut === "EN_ATTENTE" ? "#fef3c7" : "#fee2e2",
                        color:
                          doc.statut === "EN_ATTENTE" ? "#92400e" : "#991b1b",
                      }}
                    >
                      {doc.statut === "EN_ATTENTE" ? "En attente" : "Rejeté"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(doc.id, doc.nom, doc.type)}
                  className={styles.downloadBtn}
                  title="Télécharger"
                >
                  <FiDownload />
                </button>
                {doc.statut === "EN_ATTENTE" && (
                  <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                    <button
                      onClick={() => handleApprouver(doc.id)}
                      style={{
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleRejeter(doc.id)}
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
