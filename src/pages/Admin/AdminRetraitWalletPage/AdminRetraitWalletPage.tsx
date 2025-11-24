// src/pages/admin/withdrawals/AdminWithdrawalsPage.tsx → VERSION FINALE PRO

import React, { useState, useEffect } from "react";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import styles from "./AdminRetraitWalletPage.module.css";

// ON UTILISE LE VRAI DTO DU BACKEND
import type { TransactionDTO } from "../../../types/transaction";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionDTO | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const data = await api.get<TransactionDTO[]>(
        "/api/transactions/retraits-en-attente"
      );
      setWithdrawals(data);
    } catch (err: any) {
      toast.error("Impossible de charger les retraits");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (tx: TransactionDTO) => {
    if (
      !confirm(
        `Valider le retrait de ${tx.montant.toFixed(2)} € pour ${
          tx.userPrenom
        } ${tx.userNom} ?`
      )
    )
      return;

    try {
      await api.patch(`/api/transactions/${tx.id}/valider-retrait`);
      toast.success("Retrait validé !");
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.message || "Échec de la validation");
    }
  };

  const handleReject = (tx: TransactionDTO) => {
    setSelectedTx(tx);
    setMotifRejet("");
    setShowModal(true);
  };

  const confirmReject = async () => {
    if (!selectedTx || !motifRejet.trim()) {
      toast.error("Le motif est obligatoire");
      return;
    }

    try {
      await api.patch(`/api/transactions/${selectedTx.id}/rejeter-retrait`, {
        motif: motifRejet.trim(),
      });
      toast.success("Retrait rejeté");
      setShowModal(false);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.message || "Échec du rejet");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement des retraits...</div>;
  }

  const pendingCount = withdrawals.filter(
    (t) => t.statut === "EN_ATTENTE_VALIDATION"
  ).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Validation des retraits</h1>
        <p className={styles.subtitle}>
          {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente
        </p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Aucun retrait en attente
                </td>
              </tr>
            ) : (
              withdrawals.map((tx) => (
                <tr
                  key={tx.id}
                  className={
                    tx.statut !== "EN_ATTENTE_VALIDATION" ? styles.disabled : ""
                  }
                >
                  <td>
                    {format(new Date(tx.createdAt), "dd MMM yyyy", {
                      locale: fr,
                    })}
                    <br />
                    <small>
                      {format(new Date(tx.createdAt), "HH:mm", { locale: fr })}
                    </small>
                  </td>
                  <td>
                    <div>
                      <strong>
                        {tx.userPrenom} {tx.userNom}
                      </strong>
                      <br />
                      <small className={styles.login}>@{tx.userLogin}</small>
                    </div>
                  </td>
                  <td className={styles.amount}>{tx.montant.toFixed(2)} €</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        tx.statut === "EN_ATTENTE_VALIDATION"
                          ? styles.pending
                          : tx.statut === "SUCCESS"
                          ? styles.success
                          : styles.rejected
                      }`}
                    >
                      {tx.statut === "EN_ATTENTE_VALIDATION"
                        ? "En attente"
                        : tx.statut === "SUCCESS"
                        ? "Validé"
                        : "Rejeté"}
                    </span>
                  </td>
                  <td>
                    {tx.statut === "EN_ATTENTE_VALIDATION" && (
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleValidate(tx)}
                          className={styles.btnValidate}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleReject(tx)}
                          className={styles.btnReject}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL REJET */}
      {showModal && selectedTx && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Rejeter le retrait</h2>
            <p>
              <strong>
                {selectedTx.userPrenom} {selectedTx.userNom}
              </strong>
              <br />
              Montant : <strong>{selectedTx.montant.toFixed(2)} €</strong>
            </p>
            <textarea
              placeholder="Motif du rejet (obligatoire)"
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              className={styles.textarea}
              rows={5}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                className={styles.btnCancel}
              >
                Annuler
              </button>
              <button
                onClick={confirmReject}
                disabled={!motifRejet.trim()}
                className={styles.btnConfirmReject}
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
