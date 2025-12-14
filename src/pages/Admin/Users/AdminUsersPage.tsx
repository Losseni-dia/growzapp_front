import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import { UserDTO } from "../../../types/user";
import toast from "react-hot-toast";
import RolesManagerModal from "../../Admin/Roles/RoleManagerModal";
import styles from "./AdminUsersPage.module.css";
import { useTranslation } from "react-i18next";
import { getAvatarUrl } from "../../../types/utils/UserUtils"; // IMPORT CRUCIAL

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function UsersAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  // Récupération des utilisateurs
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<ApiResponse<UserDTO[]>>("/admin/users"),
  });

  const users = data?.data || [];

  // Mutation pour activer/désactiver un compte
  const toggleEnabled = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roles.success"));
    },
  });

  // Mutation pour donner le rôle ADMIN rapidement
  const makeAdmin = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/admin/users/${id}/roles`, ["ADMIN"]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roles.success"));
    },
  });

  if (isLoading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  if (isError)
    return (
      <div className={styles.error}>{t("admin.withdrawals.toast.error")}</div>
    );

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
              <th>{t("admin.users.table.roles")}</th>
              <th>{t("admin.users.table.status")}</th>
              <th>{t("admin.users.table.projects")}</th>
              <th>{t("admin.users.table.investments")}</th>
              <th>{t("admin.users.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  {t("admin.users.empty")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={styles.rowHover}
                >
                  <td>
                    <img
                      src={getAvatarUrl(u.image)} // UTILISATION DE L'UTILITAIRE
                      alt=""
                      className={styles.avatar}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/default-avatar.png";
                      }}
                    />
                  </td>
                  <td className={styles.fullName}>
                    {u.prenom} {u.nom}
                  </td>
                  <td>
                    <div>{u.email}</div>
                    <small>({u.login})</small>
                  </td>
                  <td>
                    <div className={styles.roles}>
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={`${styles.roleChip} ${
                            styles[r.toLowerCase()] || ""
                          }`}
                        >
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
                  <td>{u.projets?.length || 0}</td>
                  <td>{u.investissements?.length || 0}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {!u.roles.includes("ADMIN") && (
                      <button
                        onClick={() => makeAdmin.mutate(u.id)}
                        className={styles.adminBtn}
                      >
                        {t("admin.users.modal.make_admin")}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DÉTAILS ET GESTION DES RÔLES */}
      {selectedUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedUser(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <img
                src={getAvatarUrl(selectedUser.image)}
                className={styles.modalAvatar}
                alt="User"
                onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
              />
              <div>
                <h2 style={{ margin: 0 }}>
                  {selectedUser.prenom} {selectedUser.nom}
                </h2>
                <p style={{ margin: 0, color: "#666" }}>
                  @{selectedUser.login} | {selectedUser.email}
                </p>
              </div>
            </div>

            <p>
              {t("admin.users.modal.account_status", {
                status: selectedUser.enabled
                  ? t("admin.users.modal.active")
                  : t("admin.users.modal.disabled"),
              })}
            </p>

            <h3>
              {t("admin.users.modal.his_projects")} (
              {selectedUser.projets?.length || 0})
            </h3>
            {selectedUser.projets?.length ? (
              <div className={styles.itemsGrid}>
                {selectedUser.projets.map((p) => (
                  <div key={p.id} className={styles.itemCard}>
                    {p.libelle} – {p.localiteNom}
                  </div>
                ))}
              </div>
            ) : (
              <p>{t("admin.users.empty")}</p>
            )}

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
