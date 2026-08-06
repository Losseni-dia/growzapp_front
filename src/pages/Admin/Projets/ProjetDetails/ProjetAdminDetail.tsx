// src/pages/Admin/ProjetAdminDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../../service/Api";
import DocumentUpload from "../../../../components/DocumentUpload/DocumentUpload";
import { useAuth } from "../../../../components/Context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ProjetAdminDetail.module.css";
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiFile,
  FiArrowLeft,
  FiEdit2,
  FiTrendingUp,
  FiTrash2,
  FiCheck,
  FiX,
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
  const { t } = useTranslation();

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
      toast.error(err.message || (t("admin.documents.load_error") as string));
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

      {user?.roles?.includes("ADMIN") && (
        <div className={styles.uploadCard}>
          <DocumentUpload
            projetId={Number(id)}
            onUploadSuccess={loadProjetAndDocuments}
          />
        </div>
      )}

      <div className={styles.documentsSection}>
        <h2>
          {t("admin.documents.title")} ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <p className={styles.noDocs}>{t("admin.documents.empty")}</p>
        ) : (
          <div className={styles.grid}>
            {documents.map((doc) => (
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
                    onClick={() => handleDownload(doc.id, doc.nom, doc.type)}
                    className={styles.iconBtn}
                    title={t("admin.documents.download") as string}
                  >
                    <FiDownload />
                  </button>
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
    </div>
  );
}
