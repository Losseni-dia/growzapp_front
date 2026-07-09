import React, { useEffect, useState } from "react";
import { api, getFreshToken } from "../../../service/Api";
import { UserDTO } from "../../../types/user";
import toast from "react-hot-toast";
import {
  Check,
  X,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  UserCircle,
  Calendar,
} from "lucide-react";
import styles from "./KycAdminPanel.module.css";

export const KycAdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserDTO[]>("/api/kyc/admin/en-attente");
      setPendingUsers(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des dossiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const getExpiryStatus = (dateString?: string) => {
    if (!dateString) return { label: "Sans date", className: styles.badgeGray };
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return { label: "Expiré", className: styles.badgeRed };
    if (diffDays <= 30)
      return { label: `${diffDays} jours`, className: styles.badgeOrange };
    return { label: "Valide", className: styles.badgeGreen };
  };

  const openDocument = async (
    userId: number,
    type: "recto" | "verso" | "selfie",
  ) => {
    try {
      toast.loading("Chargement du document...");

      const token = getFreshToken();
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const url = `${baseUrl}/api/kyc/admin/document/${userId}/${type}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");

      toast.dismiss();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erreur : " + error.message);
      console.error("Détails erreur ouverture doc:", error);
    }
  };

  const handleDecision = async (userId: number, approuve: boolean) => {
    if (
      approuve &&
      !window.confirm("Confirmer la validation de cette identité ?")
    )
      return;

    try {
      const queryParams = new URLSearchParams({
        userId: userId.toString(),
        approuve: approuve.toString(),
        commentaire: !approuve ? rejectionReason : "",
      });

      await api.post(`/api/kyc/admin/decider?${queryParams.toString()}`);
      toast.success(
        approuve ? "Utilisateur validé avec succès" : "Dossier rejeté",
      );

      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      setSelectedUser(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement de la décision");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Chargement des dossiers KYC...</p>
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
          <h1 className={styles.title}>Validation des identités</h1>
          <p className={styles.subtitle}>
            {pendingUsers.length} dossier{pendingUsers.length > 1 ? "s" : ""} en
            attente
          </p>
        </div>
      </header>

      {pendingUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={32} />
          <p>Tous les dossiers ont été traités.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {pendingUsers.map((u) => {
            const status = getExpiryStatus(u.kycDateExpiration);
            return (
              <div key={u.id} className={styles.card}>
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
                    <strong>N° Pièce :</strong>
                    <span>{u.kycNumeroPiece || "N/A"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Calendar size={13} />
                    <span>
                      Expire le{" "}
                      {u.kycDateExpiration
                        ? new Date(u.kycDateExpiration).toLocaleDateString()
                        : "inconnu"}
                    </span>
                  </div>
                </div>

                <div className={styles.docGrid}>
                  <button
                    onClick={() => openDocument(u.id, "recto")}
                    className={styles.docBtn}
                  >
                    <FileText size={16} /> <span>Recto</span>
                  </button>
                  <button
                    onClick={() => openDocument(u.id, "verso")}
                    className={styles.docBtn}
                  >
                    <ImageIcon size={16} /> <span>Verso</span>
                  </button>
                  <button
                    onClick={() => openDocument(u.id, "selfie")}
                    className={styles.docBtn}
                  >
                    <UserCircle size={16} /> <span>Selfie</span>
                  </button>
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleDecision(u.id, true)}
                    className={styles.btnApprove}
                  >
                    <Check size={16} /> Approuver
                  </button>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className={styles.btnReject}
                  >
                    <X size={16} /> Rejeter
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
            <h3 className={styles.modalTitle}>Motif du rejet</h3>
            <p className={styles.modalUser}>
              Utilisateur : {selectedUser.prenom} {selectedUser.nom}
            </p>
            <textarea
              className={styles.modalTextarea}
              placeholder="Ex : Photo du recto illisible, document expiré..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className={styles.modalFooter}>
              <button
                onClick={() => setSelectedUser(null)}
                className={styles.btnCancel}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDecision(selectedUser.id, false)}
                className={styles.btnConfirmReject}
                disabled={!rejectionReason.trim()}
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
