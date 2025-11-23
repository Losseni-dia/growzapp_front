// src/components/admin/RolesManagerModal.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import styles from "./RoleManagerModal.module.css";

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
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);

  // CORRIGÉ : si ton api.get retourne directement le tableau (pas { data: ... })
  const { data: allRoles = [], isLoading } = useQuery<string[]>({
    queryKey: ["all-roles"],
    queryFn: () => api.get<string[]>("/api/admin/users/roles"), // ← plus de .then() ni .data
  });

  const updateRoles = useMutation({
    mutationFn: (roles: string[]) =>
      api.patch(`/api/admin/users/${userId}/roles`, roles),
    onSuccess: () => {
      toast.success("Rôles mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
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
      <h3 className={styles.title}>Gérer les rôles</h3>

      {isLoading ? (
        <p className={styles.loadingText}>Chargement des rôles...</p>
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
          Annuler
        </button>
        <button
          onClick={save}
          disabled={updateRoles.isPending}
          className={styles.btnSave}
        >
          {updateRoles.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
