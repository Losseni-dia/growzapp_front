// src/pages/Admin/ProjetAdminDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../../service/Api";
import DocumentUpload from "../../../../components/DocumentUpload/DocumentUpload";
import ProjetMessageThread from "../../../../components/Projet/ProjetMessageThread";
import { useAuth } from "../../../../components/Context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ProjetAdminDetail.module.css";
import {
  FiDownload,
  FiEye,
  FiFileText,
  FiImage,
  FiFile,
  FiArrowLeft,
  FiEdit2,
  FiTrendingUp,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiCalendar,
  FiArchive,
  FiRotateCcw,
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
  archive?: boolean;
}

export default function ProjetAdminDetail() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<ProjetDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showRevaloriser, setShowRevaloriser] = useState(false);
  const [nouvelleValorisation, setNouvelleValorisation] = useState("");
  const [motifRevalorisation, setMotifRevalorisation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<"documents" | "messages">("documents");
  const [showArchivedDocs, setShowArchivedDocs] = useState(false);

  const [showProlonger, setShowProlonger] = useState(false);
  const [nouvelleDateFin, setNouvelleDateFin] = useState("");
  const [showCloturer, setShowCloturer] = useState(false);
  const [motifCloture, setMotifCloture] = useState("");
  const [submittingEcheance, setSubmittingEcheance] = useState(false);

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
      toast.error(err.message || (t("admin.documents.load_error") as string));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadProjetAndDocuments();
  }, [id]);

  // Un clic sur une notification de message investisseur arrive avec
  // #messages-investisseurs dans l'URL — on bascule directement sur cet
  // onglet plutôt que de laisser l'admin chercher sur la page.
  useEffect(() => {
    if (window.location.hash === "#messages-investisseurs") {
      setActiveTab("messages");
    }
  }, [loading]);

  // L'extension réelle du fichier stocké (visible dans doc.url, ex.
  // "/files/documents/uuid_photo.jpg") fait foi — deviner l'extension à
  // partir de doc.type ("IMAGE" n'a pas d'extension fixe : jpg/png/webp)
  // produisait un fichier sans extension que l'OS ne savait plus ouvrir.
  const getRealExtension = (url: string) => {
    const match = url.match(/\.([a-zA-Z0-9]+)$/);
    return match ? `.${match[1]}` : "";
  };

  const handleVoir = (doc: DocumentDTO) => {
    window.open(`${API_BASE_URL}${doc.url}`, "_blank");
  };

  const handleDownload = async (doc: DocumentDTO) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${doc.id}/download`,
        { method: "GET", credentials: "include" },
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Download refused");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.nom}${getRealExtension(doc.url)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApprouver = async (docId: number) => {
    try {
      await api.patch(`api/documents/${docId}/approuver`, {});
      toast.success(t("admin.documents.toast.approved") as string);
      loadProjetAndDocuments();
    } catch {
      toast.error(t("admin.documents.toast.error") as string);
    }
  };

  const handleRejeter = async (docId: number) => {
    try {
      await api.patch(`api/documents/${docId}/rejeter`, {});
      toast.success(t("admin.documents.toast.rejected") as string);
      loadProjetAndDocuments();
    } catch {
      toast.error(t("admin.documents.toast.error") as string);
    }
  };

  // Suppression définitive — réservée à l'admin, retire le document pour
  // tout le monde (contrairement à l'archivage qui est personnel).
  const handleSupprimerDocument = async (docId: number) => {
    if (!window.confirm(t("admin.documents.confirm_delete", "Supprimer définitivement ce document ?") as string)) return;
    try {
      await api.delete(`api/documents/${docId}`);
      toast.success(t("admin.documents.toast.deleted", "Document supprimé") as string);
      loadProjetAndDocuments();
    } catch (err: any) {
      toast.error(err.message || (t("admin.documents.toast.error") as string));
    }
  };

  const handleArchiverDocument = async (doc: DocumentDTO) => {
    try {
      await api.post(`api/documents/${doc.id}/${doc.archive ? "desarchiver" : "archiver"}`, {});
      loadProjetAndDocuments();
    } catch (err: any) {
      toast.error(err.message || (t("admin.documents.toast.error") as string));
    }
  };

  const handleSupprimer = async () => {
    if (!projet) return;
    if (
      !window.confirm(
        t("admin.projects.confirm_delete", { name: projet.libelle }) as string,
      )
    )
      return;
    try {
      await api.delete(`api/admin/projets/${projet.id}`);
      toast.success(t("admin.projects.delete_success") as string);
      navigate("/admin/projets");
    } catch (err: any) {
      toast.error(err.message || (t("admin.projects.delete_error") as string));
    }
  };

  const handleRevaloriser = async () => {
    if (!nouvelleValorisation || parseFloat(nouvelleValorisation) <= 0) {
      toast.error(
        t("admin.projects_list.revalorisation.toast_invalid") as string,
      );
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`api/admin/projets/${projet?.id}/revaloriser`, {
        nouvelleValorisation: parseFloat(nouvelleValorisation),
        motif:
          motifRevalorisation ||
          (t(
            "admin.projects_list.revalorisation.reason_placeholder",
          ) as string),
      });
      toast.success(
        t("admin.projects_list.revalorisation.toast_success") as string,
      );
      setShowRevaloriser(false);
      setNouvelleValorisation("");
      setMotifRevalorisation("");
      loadProjetAndDocuments();
    } catch (err: any) {
      toast.error(
        err.message ||
          (t("admin.projects_list.revalorisation.toast_error") as string),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleProlonger = async () => {
    if (!nouvelleDateFin) {
      toast.error(t("admin.projects.echeance.toast_date_required", "La nouvelle date est obligatoire") as string);
      return;
    }
    try {
      setSubmittingEcheance(true);
      await api.patch(`api/admin/projets/${projet?.id}/prolonger-echeance`, {
        nouvelleDateFin,
      });
      toast.success(t("admin.projects.echeance.toast_prolonge", "Date limite prolongée") as string);
      setShowProlonger(false);
      setNouvelleDateFin("");
      loadProjetAndDocuments();
    } catch (err: any) {
      toast.error(err.message || (t("admin.projects.echeance.toast_error", "Erreur") as string));
    } finally {
      setSubmittingEcheance(false);
    }
  };

  const handleCloturer = async () => {
    if (
      !window.confirm(
        t(
          "admin.projects.echeance.confirm_cloture",
          "Clôturer ce projet et rembourser intégralement tous les investisseurs ? Cette action est irréversible.",
        ) as string,
      )
    )
      return;
    try {
      setSubmittingEcheance(true);
      await api.post(`api/admin/projets/${projet?.id}/cloturer-echec`, {
        motif: motifCloture || undefined,
      });
      toast.success(t("admin.projects.echeance.toast_cloture", "Projet clôturé, investisseurs remboursés") as string);
      setShowCloturer(false);
      setMotifCloture("");
      loadProjetAndDocuments();
    } catch (err: any) {
      toast.error(err.message || (t("admin.projects.echeance.toast_error", "Erreur") as string));
    } finally {
      setSubmittingEcheance(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FiFileText color="#d32f2f" size={24} />;
      case "EXCEL":
      case "CSV":
        return <FiFile color="var(--growz-hex-primary, #1b5e20)" size={24} />;
      default:
        return <FiImage color="var(--growz-hex-primary, #1b5e20)" size={24} />;
    }
  };

  const statutBadge = (statut?: string) => {
    if (!statut || statut === "APPROUVE") return null;
    const isPending = statut === "EN_ATTENTE";
    return (
      <span className={isPending ? styles.badgePending : styles.badgeRejected}>
        {isPending
          ? t("admin.documents.status_pending")
          : t("admin.documents.status_rejected")}
      </span>
    );
  };

  if (loading)
    return <div className={styles.loading}>{t("admin.documents.loading")}</div>;
  if (!projet)
    return <div className={styles.error}>{t("admin.projects.btn_view")}</div>;

  const echeanceDepassee =
    !!projet.dateFin &&
    new Date(projet.dateFin) < new Date() &&
    projet.montantCollecte < projet.objectifFinancement &&
    projet.statutProjet !== "ECHEC_FINANCEMENT" &&
    projet.statutProjet !== "TERMINE";

  return (
    <div className={styles.container}>
      <Link to="/admin/projets" className={styles.backLink}>
        <FiArrowLeft /> {t("admin.projects.btn_administer")}
      </Link>

      <div className={styles.headerCard}>
        <div className={styles.headerMain}>
          <span className={styles.headerEyebrow}>
            {t("admin.projects.project_config")}
          </span>
          <h1 className={styles.title}>{projet.libelle}</h1>
        </div>
        <div className={styles.headerActions}>
          <Link
            to={`/admin/projets/edit/${projet.slug || projet.id}`}
            className={styles.btnModifier}
          >
            <FiEdit2 /> {t("admin.projects.btn_edit")}
          </Link>
          <button
            className={styles.btnRevaloriser}
            onClick={() => {
              setNouvelleValorisation(
                projet.valuation ? String(projet.valuation) : "",
              );
              setShowRevaloriser(true);
            }}
          >
            <FiTrendingUp /> {t("admin.projects.btn_revaloriser")}
          </button>
          <button className={styles.btnDelete} onClick={handleSupprimer}>
            <FiTrash2 /> {t("admin.projects.btn_delete")}
          </button>
        </div>
      </div>

      {echeanceDepassee && (
        <div className={styles.echeanceAlert}>
          <FiAlertTriangle size={22} />
          <div className={styles.echeanceAlertText}>
            <strong>
              {t("admin.projects.echeance.title", "Date limite dépassée, objectif non atteint")}
            </strong>
            <p>
              {t(
                "admin.projects.echeance.message",
                "Ce projet n'a pas atteint son objectif de financement avant sa date limite. Prolongez l'échéance si le projet mérite plus de temps, ou clôturez-le pour rembourser intégralement les investisseurs.",
              )}
            </p>
            <div className={styles.echeanceAlertActions}>
              <button
                className={styles.btnProlonger}
                onClick={() => setShowProlonger(true)}
              >
                <FiCalendar /> {t("admin.projects.echeance.btn_prolonger", "Prolonger la date limite")}
              </button>
              <button
                className={styles.btnCloturer}
                onClick={() => setShowCloturer(true)}
              >
                <FiTrash2 /> {t("admin.projects.echeance.btn_cloturer", "Clôturer et rembourser")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProlonger && (
        <div className={styles.modalOverlay} onClick={() => setShowProlonger(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.projects.echeance.modal_prolonger_title", "Prolonger la date limite")}</h2>
            <label>{t("admin.projects.echeance.new_date_label", "Nouvelle date limite")}</label>
            <input
              type="date"
              value={nouvelleDateFin}
              onChange={(e) => setNouvelleDateFin(e.target.value)}
              min={projet.dateFin}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowProlonger(false)}>
                {t("admin.projects_list.revalorisation.cancel")}
              </button>
              <button onClick={handleProlonger} disabled={submittingEcheance}>
                {submittingEcheance
                  ? t("admin.projects_list.revalorisation.confirm_processing")
                  : t("admin.projects.echeance.confirm_prolonger", "Prolonger")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloturer && (
        <div className={styles.modalOverlay} onClick={() => setShowCloturer(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.projects.echeance.modal_cloturer_title", "Clôturer et rembourser")}</h2>
            <label>{t("admin.projects.echeance.motif_label", "Motif (optionnel)")}</label>
            <input
              type="text"
              value={motifCloture}
              onChange={(e) => setMotifCloture(e.target.value)}
              placeholder={t("admin.projects.echeance.motif_placeholder", "Objectif non atteint à la date limite") as string}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowCloturer(false)}>
                {t("admin.projects_list.revalorisation.cancel")}
              </button>
              <button onClick={handleCloturer} disabled={submittingEcheance}>
                {submittingEcheance
                  ? t("admin.projects_list.revalorisation.confirm_processing")
                  : t("admin.projects.echeance.confirm_cloturer", "Clôturer et rembourser")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRevaloriser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowRevaloriser(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.projects_list.revalorisation.modal_title")}</h2>
            <label>{t("admin.projects_list.revalorisation.new_label")}</label>
            <input
              type="number"
              value={nouvelleValorisation}
              onChange={(e) => setNouvelleValorisation(e.target.value)}
              autoFocus
            />
            <label>
              {t("admin.projects_list.revalorisation.reason_label")}
            </label>
            <input
              type="text"
              value={motifRevalorisation}
              onChange={(e) => setMotifRevalorisation(e.target.value)}
              placeholder={
                t(
                  "admin.projects_list.revalorisation.reason_placeholder",
                ) as string
              }
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowRevaloriser(false)}>
                {t("admin.projects_list.revalorisation.cancel")}
              </button>
              <button onClick={handleRevaloriser} disabled={submitting}>
                {submitting
                  ? t("admin.projects_list.revalorisation.confirm_processing")
                  : t("admin.projects_list.revalorisation.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.detailTabs}>
        <button
          type="button"
          className={`${styles.detailTab} ${activeTab === "documents" ? styles.detailTabActive : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          {t("admin.documents.title")} ({documents.length})
        </button>
        <button
          type="button"
          className={`${styles.detailTab} ${activeTab === "messages" ? styles.detailTabActive : ""}`}
          onClick={() => setActiveTab("messages")}
        >
          {t("projet_messages.title", "Messages investisseurs")}
        </button>
      </div>

      {activeTab === "documents" && (
        <>
          {user?.roles?.includes("ADMIN") && (
            <div className={styles.uploadCard}>
              <DocumentUpload
                projetId={Number(id)}
                onUploadSuccess={loadProjetAndDocuments}
              />
            </div>
          )}

          <div className={styles.documentsSection}>
            <label className={styles.archiveToggle}>
              <input
                type="checkbox"
                checked={showArchivedDocs}
                onChange={(e) => setShowArchivedDocs(e.target.checked)}
              />
              {t("admin.documents.show_archived", "Afficher mes documents archivés")}
              {" "}({documents.filter((d) => d.archive).length})
            </label>
            {documents.filter((d) => !!d.archive === showArchivedDocs).length === 0 ? (
              <p className={styles.noDocs}>
                {showArchivedDocs
                  ? t("admin.documents.empty_archived", "Aucun document archivé")
                  : t("admin.documents.empty")}
              </p>
            ) : (
              <div className={styles.grid}>
                {documents
                  .filter((d) => !!d.archive === showArchivedDocs)
                  .map((doc) => (
                  <div key={doc.id} className={styles.docCard}>
                    <div className={styles.docTop}>
                      <div className={styles.docIcon}>{getIcon(doc.type)}</div>
                      <div className={styles.docInfo}>
                        <strong>{doc.nom}</strong>
                        <small>
                          {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                        </small>
                      </div>
                    </div>
                    {statutBadge(doc.statut)}
                    <div className={styles.docActions}>
                      <button
                        onClick={() => handleVoir(doc)}
                        className={styles.iconBtn}
                        title={t("admin.documents.view", "Voir") as string}
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className={styles.iconBtn}
                        title={t("admin.documents.download") as string}
                      >
                        <FiDownload />
                      </button>
                      <button
                        onClick={() => handleArchiverDocument(doc)}
                        className={styles.iconBtn}
                        title={
                          doc.archive
                            ? (t("admin.documents.unarchive", "Désarchiver") as string)
                            : (t("admin.documents.archive", "Archiver") as string)
                        }
                      >
                        {doc.archive ? <FiRotateCcw /> : <FiArchive />}
                      </button>
                      {user?.roles?.includes("ADMIN") && (
                        <button
                          onClick={() => handleSupprimerDocument(doc.id)}
                          className={styles.iconBtn}
                          title={t("admin.documents.delete", "Supprimer") as string}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                      {doc.statut === "EN_ATTENTE" && (
                        <>
                          <button
                            onClick={() => handleApprouver(doc.id)}
                            className={styles.approveBtn}
                          >
                            <FiCheck /> {t("admin.documents.approve")}
                          </button>
                          <button
                            onClick={() => handleRejeter(doc.id)}
                            className={styles.rejectBtn}
                          >
                            <FiX /> {t("admin.documents.reject")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "messages" && (
        <div className={styles.documentsSection} id="messages-investisseurs">
          <ProjetMessageThread projetId={Number(id)} isAdmin />
        </div>
      )}
    </div>
  );
}
