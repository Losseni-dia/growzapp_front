// src/pages/admin/UsersAdminPage.tsx → VERSION FINALE SANS PAGINATION
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import { UserDTO } from "../../../types/user";
import toast from "react-hot-toast";
import styles from "./AdminUsersPage.module.css";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function UsersAdminPage() {
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
      toast.success("Statut mis à jour");
    },
  });

  const makeAdmin = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/admin/users/${id}/roles`, ["ADMIN"]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utilisateur promu ADMIN");
    },
  });

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;
  if (isError) return <div className={styles.error}>Erreur de chargement</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Gestion des utilisateurs ({users.length})
      </h1>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Nom complet</th>
              <th>Email / Login</th>
              <th>Rôles</th>
              <th>Statut</th>
              <th>Projets</th>
              <th>Investissements</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  Aucun utilisateur
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
                      src={u.image || "/default-avatar.png"}
                      alt=""
                      className={styles.avatar}
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
                        Faire Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE DÉTAIL */}
      {selectedUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedUser(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedUser.prenom} {selectedUser.nom}
            </h2>
            <p>
              Email: {selectedUser.email} | Login: {selectedUser.login}
            </p>
            <p>Compte {selectedUser.enabled ? "activé" : "désactivé"}</p>

            <h3>Ses projets ({selectedUser.projets?.length || 0})</h3>
            {selectedUser.projets?.length ? (
              selectedUser.projets.map((p) => (
                <div key={p.id} className={styles.itemCard}>
                  {p.libelle} – {p.localiteNom}, {p.paysNom}
                </div>
              ))
            ) : (
              <p>Aucun projet</p>
            )}

            <h3>
              Ses investissements ({selectedUser.investissements?.length || 0})
            </h3>
            {selectedUser.investissements?.length ? (
              selectedUser.investissements.map((i) => (
                <div key={i.id} className={styles.itemCard}>
                  {i.projetLibelle} – {i.nombrePartsPris} parts –{" "}
                  {(i.prixUnePart * i.nombrePartsPris).toLocaleString()} FCFA
                  <br />
                  <small>Statut: {i.statutPartInvestissement}</small>
                </div>
              ))
            ) : (
              <p>Aucun investissement</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
