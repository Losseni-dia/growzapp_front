import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import styles from "./RoleManagerModal.module.css";
import { useTranslation } from "react-i18next";

interface RolesManagerModalProps {
  userId: number;
  currentRoles: string[];
  onClose: () => void;
}

export default function RolesManagerModal({
  userId,
  currentRoles,
  onClose,
}: RolesManagerModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);

  const { data: allRoles = [], isLoading } = useQuery<string[]>({
    queryKey: ["all-roles"],
    queryFn: () => api.get<string[]>("/api/admin/users/roles"),
  });

  const updateRoles = useMutation({
    mutationFn: (roles: string[]) =>
      api.patch(`/api/admin/users/${userId}/roles`, roles),
    onSuccess: () => {
      toast.success(t("admin.roles.success"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error(t("admin.withdrawals.toast.error")),
  });

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const save = () => {
    const rolesToSave = selectedRoles.length > 0 ? selectedRoles : ["USER"];
    updateRoles.mutate(rolesToSave);
  };

  return (
    <div className={styles.modalContainer}>
      <h3 className={styles.title}>{t("admin.roles.title")}</h3>

      {isLoading ? (
        <p className={styles.loadingText}>{t("admin.roles.loading")}</p>
      ) : (
        <div className={styles.rolesList}>
          {allRoles.map((role: string) => {
            const isChecked = selectedRoles.includes(role);
            return (
              <label
                key={role}
                className={`${styles.roleItem} ${
                  isChecked ? styles.roleItemChecked : ""
                }`}
                onClick={() => toggleRole(role)}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleRole(role)}
                  className={styles.roleCheckbox}
                />
                <span
                  className={`${styles.roleLabel} ${
                    isChecked ? styles.roleLabelChecked : ""
                  }`}
                >
                  {role}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className={styles.actions}>
        <button onClick={onClose} className={styles.btnCancel}>
          {t("admin.roles.cancel")}
        </button>
        <button
          onClick={save}
          disabled={updateRoles.isPending}
          className={styles.btnSave}
        >
          {updateRoles.isPending
            ? t("admin.roles.saving")
            : t("admin.roles.save")}
        </button>
      </div>
    </div>
  );
}
