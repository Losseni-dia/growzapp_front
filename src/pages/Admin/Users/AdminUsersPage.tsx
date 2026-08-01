import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/Api";
import { UserDTO } from "../../../types/user";
import toast from "react-hot-toast";
import RolesManagerModal from "../../Admin/Roles/RoleManagerModal";
import styles from "./AdminUsersPage.module.css";
import { useTranslation } from "react-i18next";
import { getAvatarUrl } from "../../../types/utils/UserUtils";
import { KycBadge } from "../../../components/ui/kycBadge/KycBadge";
import { FiSearch, FiX, FiShield, FiUsers, FiLock } from "react-icons/fi";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UsersPage {
  content: UserDTO[];
  totalPages: number;
  totalElements: number;
}

const isLocked = (u: UserDTO) =>
  !!u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();

export default function UsersAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: rolesData } = useQuery({
    queryKey: ["admin-users-roles"],
    queryFn: () => api.get<string[]>("/admin/users/roles"),
  });
  const availableRoles = rolesData || [];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", page, debouncedSearch, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), size: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      return api.get<ApiResponse<UsersPage>>(`/admin/users?${params}`);
    },
  });

  const changeRoleFilter = (value: string) => {
    setPage(0);
    setRoleFilter(value);
  };

  const users = data?.data.content || [];
  const totalPages = data?.data.totalPages ?? 1;
  const totalElements = data?.data.totalElements ?? 0;

  const toggleEnabled = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roles.success"));
    },
  });

  const makeAdmin = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/admin/users/${id}/roles`, ["ADMIN"]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roles.success"));
    },
  });

  const getExpirationClass = (dateStr?: string) => {
    if (!dateStr) return "";
    const expiry = new Date(dateStr);
    const today = new Date();
    return expiry < today ? styles.expiredText : "";
  };

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorBox}>
        {t("admin.withdrawals.toast.error")}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ═══════════ HEADER ═══════════ */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <FiUsers size={20} />
        </div>
        <div>
          <h1 className={styles.title}>
            {t("admin.users.title", { count: totalElements })}
          </h1>
          <p className={styles.subtitle}>
            {totalElements} utilisateur{totalElements > 1 ? "s" : ""} enregistré
            {totalElements > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      {/* ═══════════ RECHERCHE + FILTRE RÔLE ═══════════ */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par nom, email, identifiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          className={styles.roleSelect}
          value={roleFilter}
          onChange={(e) => changeRoleFilter(e.target.value)}
        >
          <option value="">{t("admin.users.all_roles")}</option>
          {availableRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* ═══════════ LISTE ═══════════ */}
      <div className={styles.list}>
        {users.map((u) => {
          const locked = isLocked(u);
          return (
            <div
              key={u.id}
              className={styles.row}
              onClick={() => setSelectedUser(u)}
            >
              <img
                src={getAvatarUrl(u.image)}
                alt=""
                className={styles.avatar}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-avatar.svg";
                }}
              />

              <div className={styles.rowInfo}>
                <span className={styles.fullName}>
                  {u.prenom} {u.nom}
                  {locked && (
                    <span
                      className={styles.lockedBadge}
                      title={t("admin.users.locked_until", {
                        date: new Date(u.lockedUntil as string).toLocaleString(),
                      })}
                    >
                      <FiLock size={11} /> {t("admin.users.locked")}
                    </span>
                  )}
                </span>
                <span className={styles.emailLine}>
                  {u.email} · @{u.login}
                </span>
              </div>

              <div className={styles.rowKyc}>
                <KycBadge status={u.kycStatus} showLabel={false} />
                <span className={getExpirationClass(u.kycDateExpiration)}>
                  {u.kycDateExpiration
                    ? new Date(u.kycDateExpiration).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              <div className={styles.rowRoles}>
                {u.roles.map((r) => (
                  <span
                    key={r}
                    className={`${styles.roleChip} ${styles[r.toLowerCase()] || ""}`}
                  >
                    {r}
                  </span>
                ))}
              </div>

              <label
                className={styles.switch}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={u.enabled}
                  onChange={() => toggleEnabled.mutate(u.id)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className={styles.emptyState}>
            <FiUsers size={28} />
            <p>Aucun utilisateur ne correspond à votre recherche</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ‹
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            ›
          </button>
        </div>
      )}

      {/* ═══════════ MODAL DÉTAIL ═══════════ */}
      {selectedUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedUser(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalUser}>
                <img
                  src={getAvatarUrl(selectedUser.image)}
                  className={styles.modalAvatar}
                  alt="User"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/default-avatar.svg";
                  }}
                />
                <div>
                  <h2 className={styles.modalName}>
                    {selectedUser.prenom} {selectedUser.nom}
                  </h2>
                  <div className={styles.modalSub}>
                    <span>@{selectedUser.login}</span>
                    <KycBadge status={selectedUser.kycStatus} />
                  </div>
                </div>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setSelectedUser(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            {isLocked(selectedUser) && (
              <div className={styles.lockedBox}>
                <FiLock size={14} />
                <span>
                  {t("admin.users.locked_reason", {
                    count: selectedUser.failedLoginAttempts ?? 0,
                    date: new Date(
                      selectedUser.lockedUntil as string,
                    ).toLocaleString(),
                  })}
                </span>
              </div>
            )}

            <div className={styles.kycBox}>
              <h3 className={styles.kycBoxTitle}>Informations d'identité</h3>
              <div className={styles.kycRow}>
                <span>Numéro de pièce</span>
                <strong>{selectedUser.kycNumeroPiece || "N/A"}</strong>
              </div>
              <div className={styles.kycRow}>
                <span>Date d'expiration</span>
                <strong>{selectedUser.kycDateExpiration || "N/A"}</strong>
              </div>
              {selectedUser.kycCommentaireRejet && (
                <div className={styles.rejectionBox}>
                  <strong>Raison du rejet :</strong>{" "}
                  {selectedUser.kycCommentaireRejet}
                </div>
              )}
            </div>

            <div className={styles.roleSection}>
              <h3 className={styles.kycBoxTitle}>
                <FiShield size={14} /> {t("admin.users.modal.manage_roles")}
              </h3>
              <RolesManagerModal
                userId={selectedUser.id}
                currentRoles={selectedUser.roles}
                onClose={() => {
                  setSelectedUser(null);
                  queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                }}
              />
            </div>

            {!selectedUser.roles.includes("ADMIN") && (
              <button
                onClick={() => makeAdmin.mutate(selectedUser.id)}
                className={styles.makeAdminBtn}
              >
                {t("admin.users.modal.make_admin")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
