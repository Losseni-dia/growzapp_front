import React, { useState, useEffect } from "react";
import { api } from "../../../service/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import styles from "./AdminRetraitWalletPage.module.css";
import { useTranslation } from "react-i18next"; // <--- IMPORT
import type { TransactionDTO } from "../../../types/transaction";

export default function AdminWithdrawalsPage() {
  const { t, i18n } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionDTO | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [showModal, setShowModal] = useState(false);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

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
      toast.error(t("admin.withdrawals.toast.error"));
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
      toast.success(t("admin.withdrawals.toast.validate_success"));
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.message || t("admin.withdrawals.toast.error"));
    }
  };

  const handleReject = (tx: TransactionDTO) => {
    setSelectedTx(tx);
    setMotifRejet("");
    setShowModal(true);
  };

  const confirmReject = async () => {
    if (!selectedTx || !motifRejet.trim()) {
      toast.error(t("admin.withdrawals.modal.reason_placeholder"));
      return;
    }

    try {
      await api.patch(`/api/transactions/${selectedTx.id}/rejeter-retrait`, {
        motif: motifRejet.trim(),
      });
      toast.success(t("admin.withdrawals.toast.reject_success"));
      setShowModal(false);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.message || t("admin.withdrawals.toast.error"));
    }
  };

  if (loading)
    return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  const pendingCount = withdrawals.filter(
    (t) => t.statut === "EN_ATTENTE_VALIDATION"
  ).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("admin.withdrawals.title")}</h1>
        <p className={styles.subtitle}>
          {t("admin.withdrawals.subtitle", { count: pendingCount })}
        </p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("admin.withdrawals.table.date")}</th>
              <th>{t("admin.withdrawals.table.user")}</th>
              <th>{t("admin.withdrawals.table.amount")}</th>
              <th>{t("admin.withdrawals.table.status")}</th>
              <th>{t("admin.withdrawals.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  {t("admin.withdrawals.subtitle", { count: 0 })}
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
                      locale: currentLocale,
                    })}
                    <br />
                    <small>
                      {format(new Date(tx.createdAt), "HH:mm", {
                        locale: currentLocale,
                      })}
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
                        ? t("admin.withdrawals.status.pending")
                        : tx.statut === "SUCCESS"
                        ? t("admin.withdrawals.status.validated")
                        : t("admin.withdrawals.status.rejected")}
                    </span>
                  </td>
                  <td>
                    {tx.statut === "EN_ATTENTE_VALIDATION" && (
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleValidate(tx)}
                          className={styles.btnValidate}
                        >
                          {t("admin.withdrawals.actions.validate")}
                        </button>
                        <button
                          onClick={() => handleReject(tx)}
                          className={styles.btnReject}
                        >
                          {t("admin.withdrawals.actions.reject")}
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

      {showModal && selectedTx && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.withdrawals.modal.title")}</h2>
            <p>
              <strong>
                {selectedTx.userPrenom} {selectedTx.userNom}
              </strong>
              <br />
              Montant : <strong>{selectedTx.montant.toFixed(2)} €</strong>
            </p>
            <textarea
              placeholder={t("admin.withdrawals.modal.reason_placeholder")}
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
                {t("admin.withdrawals.modal.cancel")}
              </button>
              <button
                onClick={confirmReject}
                disabled={!motifRejet.trim()}
                className={styles.btnConfirmReject}
              >
                {t("admin.withdrawals.modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
