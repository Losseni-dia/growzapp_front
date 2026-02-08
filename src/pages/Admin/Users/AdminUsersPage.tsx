import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/Api";
import { UserDTO } from "../../../types/user";
import toast from "react-hot-toast";
import RolesManagerModal from "../../Admin/Roles/RoleManagerModal";
import styles from "./AdminUsersPage.module.css";
import { useTranslation } from "react-i18next";
import { getAvatarUrl } from "../../../types/utils/UserUtils";
import { KycBadge } from "../../../components/ui/kycBadge/KycBadge"; // Import du badge

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function UsersAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<ApiResponse<UserDTO[]>>("/admin/users"),
  });

  const users = data?.data || [];

  const toggleEnabled = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roles.success"));
    },
  });

  const makeAdmin = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/roles`, ["ADMIN"]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roles.success"));
    },
  });

  // Fonction utilitaire pour la couleur de la date d'expiration
  const getExpirationClass = (dateStr?: string) => {
    if (!dateStr) return "";
    const expiry = new Date(dateStr);
    const today = new Date();
    return expiry < today ? styles.expiredText : "";
  };

  if (isLoading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;
  if (isError) return <div className={styles.error}>{t("admin.withdrawals.toast.error")}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {t("admin.users.title", { count: users.length })}
      </h1>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.users.table.photo")}</th>
              <th>{t("admin.users.table.name")}</th>
              <th>{t("admin.users.table.email")}</th>
              <th>KYC Status</th> {/* Nouvelle Colonne */}
              <th>Exp. Pièce</th> {/* Nouvelle Colonne */}
              <th>{t("admin.users.table.roles")}</th>
              <th>{t("admin.users.table.status")}</th>
              <th>{t("admin.users.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} onClick={() => setSelectedUser(u)} className={styles.rowHover}>
                <td>
                  <img
                    src={getAvatarUrl(u.image)}
                    alt=""
                    className={styles.avatar}
                    onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                  />
                </td>
                <td className={styles.fullName}>{u.prenom} {u.nom}</td>
                <td>
                  <div>{u.email}</div>
                  <small>({u.login})</small>
                </td>
                
                {/* STATUT KYC */}
                <td>
                  <KycBadge status={u.kycStatus} showLabel={true} />
                </td>

                {/* DATE EXPIRATION */}
                <td className={getExpirationClass(u.kycDateExpiration)}>
                  {u.kycDateExpiration 
                    ? new Date(u.kycDateExpiration).toLocaleDateString() 
                    : "—"}
                </td>

                <td>
                  <div className={styles.roles}>
                    {u.roles.map((r) => (
                      <span key={r} className={`${styles.roleChip} ${styles[r.toLowerCase()] || ""}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={u.enabled}
                      onChange={() => toggleEnabled.mutate(u.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.slider} />
                  </label>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {!u.roles.includes("ADMIN") && (
                    <button onClick={() => makeAdmin.mutate(u.id)} className={styles.adminBtn}>
                      {t("admin.users.modal.make_admin")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DÉTAILS */}
      {selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedUser(null)}>×</button>

            <div className={styles.modalHeaderCustom}>
              <img
                src={getAvatarUrl(selectedUser.image)}
                className={styles.modalAvatar}
                alt="User"
                onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
              />
              <div>
                <h2>{selectedUser.prenom} {selectedUser.nom}</h2>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <p>@{selectedUser.login}</p>
                    <KycBadge status={selectedUser.kycStatus} />
                </div>
              </div>
            </div>

            <div className={styles.kycDetailsBox}>
                <h3>Informations d'identité</h3>
                <p><strong>Numéro de pièce :</strong> {selectedUser.kycNumeroPiece || "N/A"}</p>
                <p><strong>Date d'expiration :</strong> {selectedUser.kycDateExpiration || "N/A"}</p>
                {selectedUser.kycCommentaireRejet && (
                    <p className={styles.rejectionText}><strong>Raison du rejet :</strong> {selectedUser.kycCommentaireRejet}</p>
                )}
            </div>

            <div className={styles.roleSection}>
              <h3>{t("admin.users.modal.manage_roles")}</h3>
              <RolesManagerModal
                userId={selectedUser.id}
                currentRoles={selectedUser.roles}
                onClose={() => {
                  setSelectedUser(null);
                  queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}