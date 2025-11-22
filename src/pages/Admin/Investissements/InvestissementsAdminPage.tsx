// src/pages/admin/InvestissementsAdminPage.tsx → VERSION FINALE SANS PAGINATION
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import { InvestissementDTO } from "../../../types/investissement";
import toast from "react-hot-toast";
import styles from "./InvestissementsAdminPage.module.css";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function InvestissementsAdminPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-investissements"],
    queryFn: () =>
      api.get<ApiResponse<InvestissementDTO[]>>("/admin/investissements"),
  });

  const investissements = data?.data || [];

  const valider = useMutation({
    mutationFn: (id: number) =>
      api.post(`/admin/investissements/${id}/valider`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-investissements"] });
      toast.success("Investissement validé !");
    },
  });

  const annuler = useMutation({
    mutationFn: (id: number) =>
      api.post(`/admin/investissements/${id}/annuler`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-investissements"] });
      toast.success("Investissement annulé");
    },
  });

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Investissements à valider ({investissements.length})
      </h1>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Investisseur</th>
              <th>Projet</th>
              <th>Parts</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {investissements.map((i) => (
              <tr key={i.id}>
                <td>{i.investisseurNom}</td>
                <td>{i.projetLibelle}</td>
                <td>{i.nombrePartsPris}</td>
                <td>
                  {(i.prixUnePart * i.nombrePartsPris).toLocaleString()} FCFA
                </td>
                <td
                  className={
                    styles[i.statutPartInvestissement.toLowerCase()] || ""
                  }
                >
                  {i.statutPartInvestissement}
                </td>
                <td>
                  {i.statutPartInvestissement === "EN_ATTENTE" && (
                    <>
                      <button
                        onClick={() => valider.mutate(i.id)}
                        className={styles.valider}
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => annuler.mutate(i.id)}
                        className={styles.annuler}
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
