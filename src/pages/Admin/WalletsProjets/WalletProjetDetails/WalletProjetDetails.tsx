import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, buildProjetUrl } from "../../../../service/Api";
import styles from "./WalletProjetDetails.module.css";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiClock,
  FiUser,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { useCurrency } from "../../../../components/Context/CurrencyContext";

const OUTBOUND_TYPES = [
  "VERSEMENT_PORTEUR",
  "DIVIDENDE_SORTANT",
  "DISTRIBUTION_DIVIDENDE",
  "RETRAIT_ADMIN",
  "FRAIS_PLATEFORME",
  "RETRAIT",
];

export default function ProjectWalletDetails() {
  const { projetId } = useParams();
  const { format } = useCurrency();
  const { t } = useTranslation();

  const [report, setReport] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState(t("admin_wallet.detail.default_motif"));
  const [periode, setPeriode] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);
  const [showDistribModal, setShowDistribModal] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
     const [reportRes, txRes] = await Promise.all([
       api.get<any>(
         buildProjetUrl(`/api/admin/projet-wallet/${projetId}/rapport-complet`),
       ),
       api.get<any[]>(`/api/admin/projet-wallet/${projetId}/transactions`),
     ]);
      setReport(reportRes);
      setTransactions(
        [...txRes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err: any) {
      toast.error(t("admin_wallet.detail.toast_sync_error"));
    } finally {
      setLoading(false);
    }
  }, [projetId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDistribute = async () => {
    if (!montant || !periode)
      return toast.error(t("admin_wallet.detail.toast_period_required"));

    try {
      setIsDistributing(true);
      await api.post(`/api/admin/projet-wallet/${projetId}/payer-dividende`, {
        montantTotal: parseFloat(montant),
        motif,
        periode,
      });

      toast.success(t("admin_wallet.detail.toast_success"));
      setMontant("");
      setPeriode("");
      setShowDistribModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || t("admin_wallet.detail.toast_error"));
    } finally {
      setIsDistributing(false);
    }
  };

  const handleRecalculer = async () => {
    try {
      setIsRecalculating(true);
      const res = await api.post<any>(
        `/api/admin/projets/${projetId}/recalculer-collecte`,
      );
      if (res?.data?.ecartDetecte) {
        toast.success(
          t("admin_wallet.detail.recalc_toast_fixed", {
            before: format(res.data.montantCollecteAvant, "XOF"),
            after: format(res.data.montantCollecteApres, "XOF"),
          }),
        );
      } else {
        toast(t("admin_wallet.detail.recalc_toast_ok") as string);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || t("admin_wallet.detail.toast_error"));
    } finally {
      setIsRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>{t("admin_wallet.detail.loading")}</p>
      </div>
    );
  }

  const libelleAffiche = report?.projetLibelleTradu || report?.projetLibelle;

  return (
    <div className={styles.page}>
      <Link to="/admin/project-wallets" className={styles.backLink}>
        <FiArrowLeft size={15} /> {t("admin_wallet.detail.back")}
      </Link>

      <h1 className={styles.title}>{libelleAffiche}</h1>
      <p className={styles.subtitle}>
        <FiUser size={13} /> {report?.porteurNom} · {report?.porteurContact}
      </p>

      {/* ═══════════ SOLDES ═══════════ */}
      <div className={styles.balanceGrid}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>
            <FiPieChart size={14} /> {t("admin_wallet.detail.collected_public")}
          </div>
          <div className={styles.balanceValue}>
            {format(report?.montantCollectePublic || 0, "XOF")}
          </div>
          <p className={styles.balanceHint}>
            {t("admin_wallet.detail.collected_public_hint")}
          </p>
        </div>

        <div className={`${styles.balanceCard} ${styles.balanceCardGold}`}>
          <div className={styles.balanceLabel}>
            <FiDollarSign size={14} /> {t("admin_wallet.detail.real_treasury")}
          </div>
          <div className={styles.balanceValue}>
            {format(report?.tresorerieReelle || 0, "XOF")}
          </div>
          <p className={styles.balanceHint}>
            {t("admin_wallet.detail.real_treasury_hint")}
          </p>
        </div>

        <div className={`${styles.balanceCard} ${styles.balanceCardBlocked}`}>
          <div className={styles.balanceLabel}>
            <FiClock size={14} /> {t("admin_wallet.detail.blocked")}
          </div>
          <div className={styles.balanceValue}>
            {format(report?.soldeBloque || 0, "XOF")}
          </div>
          <p className={styles.balanceHint}>
            {t("admin_wallet.detail.blocked_hint")}
          </p>
        </div>
      </div>

      {/* ═══════════ ACTIONS ═══════════ */}
      <div className={styles.actionsRow}>
        <button
          className={styles.distribTrigger}
          onClick={() => setShowDistribModal(true)}
        >
          <FiTrendingUp size={16} /> {t("admin_wallet.detail.distribute_btn")}
        </button>
        <button
          className={styles.recalcTrigger}
          onClick={handleRecalculer}
          disabled={isRecalculating}
          title={t("admin_wallet.detail.recalc_hint") as string}
        >
          <FiRefreshCw size={16} className={isRecalculating ? styles.spin : ""} />
          {t("admin_wallet.detail.recalc_btn")}
        </button>
      </div>

      {/* ═══════════ HISTORIQUE ═══════════ */}
      <section className={styles.historySection}>
        <h2 className={styles.sectionTitle}>
          {t("admin_wallet.detail.history_title")}
        </h2>

        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <FiClock size={28} />
            <p>{t("admin_wallet.detail.history_empty")}</p>
          </div>
        ) : (
          <div className={styles.txList}>
            {transactions.map((tx) => {
              const isOut = OUTBOUND_TYPES.includes(tx.type);
              const label = t(`admin_wallet.detail.tx_types.${tx.type}`, {
                defaultValue: tx.type.replace(/_/g, " "),
              });
              return (
                <div key={tx.id} className={styles.txRow}>
                  <div
                    className={`${styles.txDot} ${isOut ? styles.txDotOut : styles.txDotIn}`}
                  />

                  <div className={styles.txInfo}>
                    <span className={styles.txLabel}>{label}</span>
                    <span className={styles.txDesc}>{tx.description}</span>
                    <span className={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className={styles.txRight}>
                    <span
                      className={`${styles.txAmount} ${isOut ? styles.txAmountOut : styles.txAmountIn}`}
                    >
                      {isOut ? "−" : "+"} {format(tx.montant, "XOF")}
                    </span>
                    <span
                      className={`${styles.txStatus} ${
                        tx.statut === "SUCCESS"
                          ? styles.statusSuccess
                          : styles.statusPending
                      }`}
                    >
                      {tx.statut === "SUCCESS"
                        ? t("wallet.history.status_success")
                        : t("wallet.history.status_pending")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════ MODAL DISTRIBUTION ═══════════ */}
      {showDistribModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDistribModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t("admin_wallet.detail.distribute_btn")}</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowDistribModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <label className={styles.modalLabel}>
              {t("admin_wallet.detail.amount_label")}
            </label>
            <input
              type="number"
              className={styles.modalInput}
              placeholder={
                t("admin_wallet.detail.amount_placeholder") as string
              }
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />

            <label className={styles.modalLabel}>
              {t("admin_wallet.detail.period_label")}
            </label>
            <input
              type="text"
              className={styles.modalInput}
              placeholder={
                t("admin_wallet.detail.period_placeholder") as string
              }
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            />

            <label className={styles.modalLabel}>
              {t("admin_wallet.detail.reason_label")}
            </label>
            <input
              type="text"
              className={styles.modalInput}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />

            <p className={styles.modalHint}>
              {t("admin_wallet.detail.modal_hint")}
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowDistribModal(false)}
              >
                {t("admin_wallet.detail.cancel")}
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleDistribute}
                disabled={isDistributing || !montant}
              >
                {isDistributing
                  ? t("admin_wallet.detail.confirm_processing")
                  : t("admin_wallet.detail.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
