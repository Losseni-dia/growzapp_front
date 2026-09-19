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
import {
  FiSearch,
  FiX,
  FiShield,
  FiUsers,
  FiLock,
  FiKey,
  FiCopy,
  FiChevronRight,
  FiTrash2,
  FiRotateCcw,
  FiAlertTriangle,
} from "react-icons/fi";

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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetMotif, setResetMotif] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "corbeille">("active");
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);
  const [deleteMotif, setDeleteMotif] = useState("");
  const [purgeTarget, setPurgeTarget] = useState<UserDTO | null>(null);
  const [purgeConfirm, setPurgeConfirm] = useState("");

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
    queryKey: ["admin-users", page, debouncedSearch, roleFilter, viewMode],
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), size: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (viewMode === "active") {
        if (roleFilter) params.set("role", roleFilter);
        return api.get<ApiResponse<UsersPage>>(`/admin/users?${params}`);
      }
      return api.get<ApiResponse<UsersPage>>(`/admin/users/corbeille?${params}`);
    },
  });

  const { data: corbeilleCountData } = useQuery({
    queryKey: ["admin-users-corbeille-count"],
    queryFn: () =>
      api.get<ApiResponse<UsersPage>>("/admin/users/corbeille?page=0&size=1"),
  });
  const corbeilleCount = corbeilleCountData?.data.totalElements ?? 0;

  const changeRoleFilter = (value: string) => {
    setPage(0);
    setRoleFilter(value);
  };

  const roleLabel = (role: string) =>
    t(`admin.users.role_labels.${role}`, { defaultValue: role });

  const users = data?.data.content || [];
  const totalPages = data?.data.totalPages ?? 1;
  const totalElements = data?.data.totalElements ?? 0;

  const toggleEnabled = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-corbeille-count"] });
      toast.success(t("admin.roles.success"));
    },
  });

  const makeAdmin = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/admin/users/${id}/roles`, ["ADMIN"]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-corbeille-count"] });
      toast.success(t("admin.roles.success"));
    },
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) =>
      api.post<ApiResponse<string>>(`/admin/users/${id}/reset-password`, {
        motifVerification: motif,
      }),
    onSuccess: (res) => {
      setTempPassword(res.data);
      toast.success(
        "Mot de passe temporaire généré — communiquez-le par téléphone uniquement.",
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la réinitialisation.");
    },
  });

  const closeResetModal = () => {
    setShowResetPassword(false);
    setResetMotif("");
    setTempPassword(null);
  };

  const softDelete = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => {
      const params = new URLSearchParams();
      if (motif) params.set("motif", motif);
      return api.delete(`/admin/users/${id}?${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-corbeille-count"] });
      toast.success("Utilisateur déplacé dans la corbeille");
      setDeleteTarget(null);
      setDeleteMotif("");
      setSelectedUser(null);
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
  });

  const restoreUser = useMutation({
    mutationFn: (id: number) => api.post(`/admin/users/${id}/restaurer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-corbeille-count"] });
      toast.success("Utilisateur restauré");
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
  });

  const purgeUser = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}/purger`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-corbeille-count"] });
      toast.success("Utilisateur supprimé définitivement");
      setPurgeTarget(null);
      setPurgeConfirm("");
    },
    onError: (err: any) => toast.error(err.message || "Erreur"),
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

      {/* ═══════════ ONGLETS ACTIFS / CORBEILLE ═══════════ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            setViewMode("active");
            setPage(0);
          }}
          className={styles.makeAdminBtn}
          style={{
            background: viewMode === "active" ? undefined : "#e5e7eb",
            color: viewMode === "active" ? undefined : "#374151",
            width: "auto",
            padding: "0.4rem 1rem",
          }}
        >
          Actifs
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode("corbeille");
            setPage(0);
          }}
          className={styles.makeAdminBtn}
          style={{
            background: viewMode === "corbeille" ? "#b45309" : "#e5e7eb",
            color: viewMode === "corbeille" ? undefined : "#374151",
            width: "auto",
            padding: "0.4rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiTrash2 size={14} /> Corbeille
          {corbeilleCount > 0 && (
            <span
              style={{
                background: viewMode === "corbeille" ? "#fff" : "#b45309",
                color: viewMode === "corbeille" ? "#b45309" : "#fff",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "1px 7px",
                lineHeight: 1.4,
              }}
            >
              {corbeilleCount}
            </span>
          )}
        </button>
      </div>

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
        {viewMode === "active" && (
          <select
            className={styles.roleSelect}
            value={roleFilter}
            onChange={(e) => changeRoleFilter(e.target.value)}
          >
            <option value="">{t("admin.users.all_roles")}</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ═══════════ LISTE ═══════════ */}
      <div className={styles.list}>
        {users.map((u) => {
          const locked = isLocked(u);
          return (
            <div
              key={u.id}
              className={styles.row}
              onClick={() => viewMode === "active" && setSelectedUser(u)}
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
                {viewMode === "corbeille" && u.motifSuppression && (
                  <span style={{ fontSize: "0.78rem", color: "#b91c1c" }}>
                    Motif : {u.motifSuppression}
                  </span>
                )}
              </div>

              {viewMode === "active" && (
                <>
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
                        {roleLabel(r)}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={styles.modalClose}
                    title="Réinitialiser le mot de passe"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(u);
                      setShowResetPassword(true);
                    }}
                  >
                    <FiKey size={16} />
                  </button>

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

                  <button
                    type="button"
                    className={styles.modalClose}
                    title="Supprimer (corbeille)"
                    style={{ color: "#b91c1c" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(u);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>

                  <FiChevronRight
                    size={18}
                    title="Voir le détail"
                    style={{ color: "#9ca3af", flexShrink: 0 }}
                  />
                </>
              )}

              {viewMode === "corbeille" && (
                <>
                  <button
                    type="button"
                    className={styles.modalClose}
                    title="Restaurer"
                    style={{ color: "#15803d" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreUser.mutate(u.id);
                    }}
                  >
                    <FiRotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.modalClose}
                    title="Supprimer définitivement"
                    style={{ color: "#b91c1c" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPurgeTarget(u);
                    }}
                  >
                    <FiAlertTriangle size={16} />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {users.length === 0 && (
          <div className={styles.emptyState}>
            <FiUsers size={28} />
            <p>
              {viewMode === "active"
                ? "Aucun utilisateur ne correspond à votre recherche"
                : "La corbeille est vide"}
            </p>
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
      queryClient.invalidateQueries({ queryKey: ["admin-users-corbeille-count"] });
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

            <button
              onClick={() => setShowResetPassword(true)}
              className={styles.makeAdminBtn}
              style={{
                marginTop: "0.5rem",
                background: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <FiKey size={14} />
              Réinitialiser le mot de passe
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL RÉINITIALISATION MOT DE PASSE ═══════════ */}
      {showResetPassword && selectedUser && (
        <div className={styles.modalOverlay} onClick={closeResetModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalName}>
                Réinitialiser le mot de passe
              </h2>
              <button className={styles.modalClose} onClick={closeResetModal}>
                <FiX size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              Compte : <strong>@{selectedUser.login}</strong> (
              {selectedUser.prenom} {selectedUser.nom})
            </p>

            {!tempPassword ? (
              <>
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: 8,
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    margin: "0.75rem 0",
                  }}
                >
                  ⚠️ Vérifiez d'abord l'identité de l'utilisateur (appel
                  téléphonique, comparaison avec sa pièce KYC en base) avant
                  de continuer. Indiquez ci-dessous comment l'identité a été
                  confirmée — ce motif est conservé pour audit.
                </div>
                <textarea
                  className={styles.searchInput}
                  style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                  placeholder="Ex: Appel téléphonique au numéro KYC enregistré, identité confirmée le 18/09/2026."
                  value={resetMotif}
                  onChange={(e) => setResetMotif(e.target.value)}
                />
                <button
                  className={styles.makeAdminBtn}
                  style={{ marginTop: "0.75rem" }}
                  disabled={!resetMotif.trim() || resetPassword.isPending}
                  onClick={() =>
                    resetPassword.mutate({
                      id: selectedUser.id,
                      motif: resetMotif.trim(),
                    })
                  }
                >
                  {resetPassword.isPending
                    ? "Génération..."
                    : "Générer un mot de passe temporaire"}
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: 8,
                    padding: "1rem",
                    margin: "0.75rem 0",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    Mot de passe temporaire :
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <code
                      style={{
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {tempPassword}
                    </code>
                    <button
                      className={styles.modalClose}
                      title="Copier"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword);
                        toast.success("Copié");
                      }}
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: "0.85rem", color: "#b91c1c" }}>
                  Communiquez ce mot de passe par téléphone (ou en personne)
                  uniquement — jamais par email ou SMS non chiffré.
                  L'utilisateur devra le changer dès sa prochaine connexion.
                </p>
                <button className={styles.makeAdminBtn} onClick={closeResetModal}>
                  Terminé
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ MODAL SUPPRESSION (SOFT DELETE) ═══════════ */}
      {deleteTarget && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setDeleteTarget(null);
            setDeleteMotif("");
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalName}>Supprimer l'utilisateur</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteMotif("");
                }}
              >
                <FiX size={18} />
              </button>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              Compte : <strong>@{deleteTarget.login}</strong> (
              {deleteTarget.prenom} {deleteTarget.nom})
            </p>
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 8,
                padding: "0.75rem",
                fontSize: "0.85rem",
                margin: "0.75rem 0",
              }}
            >
              Le compte sera masqué et ne pourra plus se connecter, mais reste
              restaurable depuis la corbeille — aucune donnée n'est perdue.
            </div>
            <textarea
              className={styles.searchInput}
              style={{ width: "100%", minHeight: 70, resize: "vertical" }}
              placeholder="Motif de suppression (facultatif)"
              value={deleteMotif}
              onChange={(e) => setDeleteMotif(e.target.value)}
            />
            <button
              className={styles.makeAdminBtn}
              style={{ marginTop: "0.75rem", background: "#b91c1c" }}
              disabled={softDelete.isPending}
              onClick={() =>
                softDelete.mutate({ id: deleteTarget.id, motif: deleteMotif.trim() })
              }
            >
              {softDelete.isPending ? "Suppression..." : "Déplacer dans la corbeille"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL PURGE DÉFINITIVE ═══════════ */}
      {purgeTarget && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setPurgeTarget(null);
            setPurgeConfirm("");
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalName} style={{ color: "#b91c1c" }}>
                Suppression définitive
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setPurgeTarget(null);
                  setPurgeConfirm("");
                }}
              >
                <FiX size={18} />
              </button>
            </div>
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "0.75rem",
                fontSize: "0.85rem",
                margin: "0.75rem 0",
              }}
            >
              <FiAlertTriangle size={14} style={{ marginRight: 6 }} />
              Action irréversible. Toutes les données de{" "}
              <strong>@{purgeTarget.login}</strong> seront définitivement
              effacées. Tapez son login pour confirmer.
            </div>
            <input
              type="text"
              className={styles.searchInput}
              style={{ width: "100%" }}
              placeholder={purgeTarget.login}
              value={purgeConfirm}
              onChange={(e) => setPurgeConfirm(e.target.value)}
            />
            <button
              className={styles.makeAdminBtn}
              style={{ marginTop: "0.75rem", background: "#b91c1c" }}
              disabled={purgeConfirm !== purgeTarget.login || purgeUser.isPending}
              onClick={() => purgeUser.mutate(purgeTarget.id)}
            >
              {purgeUser.isPending ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
