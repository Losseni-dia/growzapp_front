import {
  Calendar,
  Check,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  UserCircle,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { api } from "../../../service/Api";
import { UserDTO } from "../../../types/user";
import styles from "./KycAdminPanel.module.css";

type DocType = "recto" | "verso" | "selfie";
type DocState = "loading" | "ready" | "missing";

interface ZoomedDoc {
  url: string;
  label: string;
}

export const KycAdminPanel = () => {
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [docStates, setDocStates] = useState<Record<string, DocState>>({});
  const [zoomedDoc, setZoomedDoc] = useState<ZoomedDoc | null>(null);
  const docUrlsRef = useRef<Record<string, string>>({});

  const docKey = (userId: number, type: DocType) => `${userId}-${type}`;

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserDTO[]>("/api/kyc/admin/en-attente");
      setPendingUsers(data);
    } catch (error: any) {
      toast.error(t("admin.kyc.load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Charge les miniatures recto/verso/selfie de tous les dossiers en attente
  // dès que la liste est chargée, pour un aperçu immédiat (au lieu d'un
  // téléchargement manuel par bouton — c'est le manque signalé à corriger).
  useEffect(() => {
    pendingUsers.forEach((u) => {
      (["recto", "verso", "selfie"] as DocType[]).forEach((type) => {
        loadDocumentThumbnail(u.id, type);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUsers]);

  useEffect(() => {
    return () => {
      Object.values(docUrlsRef.current).forEach((url) =>
        window.URL.revokeObjectURL(url),
      );
    };
  }, []);

  const loadDocumentThumbnail = async (userId: number, type: DocType) => {
    const key = docKey(userId, type);
    if (docStates[key]) return;
    setDocStates((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${baseUrl}/api/kyc/admin/document/${userId}/${type}`,
        { method: "GET", credentials: "include" },
      );
      if (!response.ok) {
        setDocStates((prev) => ({ ...prev, [key]: "missing" }));
        return;
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      docUrlsRef.current[key] = blobUrl;
      setDocUrls((prev) => ({ ...prev, [key]: blobUrl }));
      setDocStates((prev) => ({ ...prev, [key]: "ready" }));
    } catch (error) {
      setDocStates((prev) => ({ ...prev, [key]: "missing" }));
    }
  };

  const getExpiryStatus = (dateString?: string) => {
    if (!dateString)
      return { label: t("admin.kyc.expiry_none"), className: styles.badgeGray };
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0)
      return {
        label: t("admin.kyc.expiry_expired"),
        className: styles.badgeRed,
      };
    if (diffDays <= 30)
      return {
        label: t("admin.kyc.expiry_soon", { count: diffDays }),
        className: styles.badgeOrange,
      };
    return { label: t("admin.kyc.expiry_valid"), className: styles.badgeGreen };
  };

  const handleDecision = async (userId: number, approuve: boolean) => {
    if (approuve && !window.confirm(t("admin.kyc.confirm_approve") as string))
      return;

    try {
      const queryParams = new URLSearchParams({
        userId: userId.toString(),
        approuve: approuve.toString(),
        commentaire: !approuve ? rejectionReason : "",
      });

      await api.post(`/api/kyc/admin/decider?${queryParams.toString()}`);
      toast.success(
        approuve
          ? t("admin.kyc.toast_approved")
          : t("admin.kyc.toast_rejected"),
      );

      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      setSelectedUser(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(t("admin.kyc.toast_decision_error"));
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>{t("admin.kyc.loading")}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ═══════════ HEADER ═══════════ */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className={styles.title}>{t("admin.kyc.title")}</h1>
          <p className={styles.subtitle}>
            {t(
              pendingUsers.length > 1
                ? "admin.kyc.subtitle_plural"
                : "admin.kyc.subtitle",
              { count: pendingUsers.length },
            )}
          </p>
        </div>
      </header>

      {pendingUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={32} />
          <p>{t("admin.kyc.empty")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {pendingUsers.map((u) => {
            const status = getExpiryStatus(u.kycDateExpiration);
            return (
              <div key={u.id} className={styles.card}>
                <div className={styles.cardAccent} />
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {u.prenom[0]}
                    {u.nom[0]}
                  </div>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>
                      {u.prenom} {u.nom}
                    </p>
                    <div className={styles.statusRow}>
                      <span className={styles.userLogin}>@{u.login}</span>
                      <span className={`${styles.badge} ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.details}>
                  <div className={styles.detailItem}>
                    <strong>{t("admin.kyc.label_piece_no")}</strong>
                    <span>{u.kycNumeroPiece || "N/A"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Calendar size={13} />
                    <span>
                      {t("admin.kyc.expires_on")}{" "}
                      {u.kycDateExpiration
                        ? new Date(u.kycDateExpiration).toLocaleDateString()
                        : t("admin.kyc.expires_unknown")}
                    </span>
                  </div>
                </div>

                <div className={styles.docGrid}>
                  {(
                    [
                      { type: "recto" as DocType, icon: FileText, label: t("admin.kyc.doc_recto") },
                      { type: "verso" as DocType, icon: ImageIcon, label: t("admin.kyc.doc_verso") },
                      { type: "selfie" as DocType, icon: UserCircle, label: t("admin.kyc.doc_selfie") },
                    ]
                  ).map(({ type, icon: Icon, label }) => {
                    const key = docKey(u.id, type);
                    const state = docStates[key];
                    const url = docUrls[key];

                    if (state === "ready" && url) {
                      return (
                        <button
                          key={type}
                          className={styles.docThumb}
                          onClick={() => setZoomedDoc({ url, label })}
                        >
                          <img src={url} alt={label} />
                          <span className={styles.docThumbOverlay}>
                            <ZoomIn size={14} />
                            {label}
                          </span>
                        </button>
                      );
                    }

                    if (state === "missing") {
                      return (
                        <div key={type} className={styles.docMissing}>
                          <Icon size={16} />
                          <span>{label}</span>
                          <em>{t("admin.kyc.doc_missing")}</em>
                        </div>
                      );
                    }

                    return (
                      <div key={type} className={styles.docLoading}>
                        <div className={styles.docSpinner} />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleDecision(u.id, true)}
                    className={styles.btnApprove}
                  >
                    <Check size={16} /> {t("admin.kyc.btn_approve")}
                  </button>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className={styles.btnReject}
                  >
                    <X size={16} /> {t("admin.kyc.btn_reject")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ MODAL REJET ═══════════ */}
      {selectedUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedUser(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t("admin.kyc.modal_title")}</h3>
            <p className={styles.modalUser}>
              {t("admin.kyc.modal_user_label")} {selectedUser.prenom}{" "}
              {selectedUser.nom}
            </p>
            <textarea
              className={styles.modalTextarea}
              placeholder={t("admin.kyc.reason_placeholder") as string}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className={styles.modalFooter}>
              <button
                onClick={() => setSelectedUser(null)}
                className={styles.btnCancel}
              >
                {t("admin.kyc.cancel")}
              </button>
              <button
                onClick={() => handleDecision(selectedUser.id, false)}
                className={styles.btnConfirmReject}
                disabled={!rejectionReason.trim()}
              >
                {t("admin.kyc.confirm_reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ZOOM DOCUMENT ═══════════ */}
      {zoomedDoc && (
        <div
          className={styles.zoomOverlay}
          onClick={() => setZoomedDoc(null)}
        >
          <button
            className={styles.zoomClose}
            onClick={() => setZoomedDoc(null)}
          >
            <X size={20} />
          </button>
          <div className={styles.zoomContent}>
            <img
              src={zoomedDoc.url}
              alt={zoomedDoc.label}
              onClick={(e) => e.stopPropagation()}
            />
            <span className={styles.zoomLabel}>{zoomedDoc.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
