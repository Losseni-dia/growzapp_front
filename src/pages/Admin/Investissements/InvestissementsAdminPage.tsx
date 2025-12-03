// src/pages/admin/InvestissementsAdminPage.tsx
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FiCheckCircle,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiSend,
  FiTrendingUp,
} from "react-icons/fi";
import styles from "./InvestissementsAdminPage.module.css";

// ──────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────
interface InvestissementAdmin {
  id: number;
  date: string;
  investisseurNom: string;
  investisseurPrenom?: string;
  investisseurEmail?: string;
  investisseurTelephone?: string;
  projetLibelle: string;
  nombrePartsPris: number;
  prixUnePart: number;
  statutPartInvestissement: "EN_ATTENTE" | "VALIDE" | "ANNULE";
  numeroContrat?: string;
  pourcentage: number;
  lienVerification?: string;
}

interface MutationResponse {
  numeroContrat: string;
  lienVerification: string;
}

// ──────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────
export default function InvestissementsAdminPage() {
  const queryClient = useQueryClient();
  const [investissements, setInvestissements] = useState<InvestissementAdmin[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Chargement des investissements (utilise ton proxy normal)
  useEffect(() => {
    api
      .get<{ data: InvestissementAdmin[] }>("/api/admin/investissements")
      .then((res) => setInvestissements(res.data || []))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  // Mutation : on force 8080 UNIQUEMENT ici
  const validerEtEnvoyer = useMutation<
    MutationResponse,
    Error,
    InvestissementAdmin
  >({
    mutationFn: async (inv) => {
      // ON FORCE 8080 DIRECTEMENT → VA SUR LE BACKEND RÉEL
      return api.post<MutationResponse>(
        `http://localhost:8080/api/admin/investissements/${inv.id}/valider-et-envoyer`
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-investissements"] });
      toast.success(
        `Contrat ${data.numeroContrat} validé et envoyé avec succès !`,
        { duration: 6000 }
      );
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la validation du contrat");
    },
  });

  if (loading) {
    return (
      <div className={styles.loading}>Chargement des investissements...</div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiTrendingUp size={40} /> Gestion des Investissements
        </h1>
        <p>{investissements.length} demande(s) en attente de validation</p>
      </div>

      <div className={styles.grid}>
        {investissements.map((inv) => {
          const montant = inv.nombrePartsPris * inv.prixUnePart;

          return (
            <div key={inv.id} className={styles.card}>
              {/* Statut */}
              <div className={styles.statut}>
                {inv.statutPartInvestissement === "EN_ATTENTE" && (
                  <span className={styles.pending}>
                    <FiClock /> En attente
                  </span>
                )}
                {inv.statutPartInvestissement === "VALIDE" && (
                  <span className={styles.valide}>
                    <FiCheckCircle /> Validé
                  </span>
                )}
                {inv.statutPartInvestissement === "ANNULE" && (
                  <span className={styles.annule}>Annulé</span>
                )}
              </div>

              {/* Investisseur */}
              <div className={styles.investisseur}>
                <div className={styles.avatar}>
                  <FiUser size={40} />
                </div>
                <div>
                  <h3>
                    {inv.investisseurPrenom || ""} {inv.investisseurNom}
                  </h3>
                  {inv.investisseurEmail && (
                    <p>
                      <FiMail /> {inv.investisseurEmail}
                    </p>
                  )}
                  {inv.investisseurTelephone && (
                    <p>
                      <FiPhone /> {inv.investisseurTelephone}
                    </p>
                  )}
                </div>
              </div>

              {/* Projet */}
              <div className={styles.projet}>
                <h4>{inv.projetLibelle}</h4>
                <p>
                  {format(new Date(inv.date), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>

              {/* Montant */}
              <div className={styles.montant}>
                <div>
                  <strong>{inv.nombrePartsPris}</strong> parts
                </div>
                <div className={styles.prixTotal}>
                  {montant.toLocaleString()} FCFA
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {inv.statutPartInvestissement === "EN_ATTENTE" && (
                  <button
                    onClick={() => validerEtEnvoyer.mutate(inv)}
                    disabled={validerEtEnvoyer.isPending}
                    className={styles.btnValider}
                  >
                    {validerEtEnvoyer.isPending ? (
                      "Validation en cours..."
                    ) : (
                      <>
                        Valider & Envoyer le contrat <FiSend />
                      </>
                    )}
                  </button>
                )}

                {inv.statutPartInvestissement === "VALIDE" &&
                  inv.numeroContrat && (
                    <div className={styles.dejaValide}>
                      <FiCheckCircle /> Contrat {inv.numeroContrat} envoyé
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
