import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../../service/Api";
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
} from "react-icons/fi";
import { useCurrency } from "../../../../components/Context/CurrencyContext";

const OUTBOUND_TYPES = [
  "VERSEMENT_PORTEUR",
  "DISTRIBUTION_DIVIDENDE",
  "RETRAIT_ADMIN",
  "FRAIS_PLATEFORME",
  "RETRAIT",
];

const TYPE_LABELS: Record<string, string> = {
  VERSEMENT_PORTEUR: "Versement porteur",
  DISTRIBUTION_DIVIDENDE: "Distribution dividende",
  RETRAIT_ADMIN: "Retrait admin",
  FRAIS_PLATEFORME: "Frais plateforme",
  RETRAIT: "Retrait",
  DEPOT: "Dépôt",
  INVESTISSEMENT: "Investissement",
};

export default function ProjectWalletDetails() {
  const { projetId } = useParams();
  const { format } = useCurrency();

  const [report, setReport] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("Distribution Dividendes");
  const [periode, setPeriode] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);
  const [showDistribModal, setShowDistribModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportRes, txRes] = await Promise.all([
        api.get<any>(`/api/admin/projet-wallet/${projetId}/rapport-complet`),
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
      toast.error("Erreur de synchronisation des données");
    } finally {
      setLoading(false);
    }
  }, [projetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDistribute = async () => {
    if (!montant || !periode)
      return toast.error("Veuillez remplir le montant et la période");

    try {
      setIsDistributing(true);
      await api.post(`/api/admin/projet-wallet/${projetId}/payer-dividende`, {
        montantTotal: parseFloat(montant),
        motif,
        periode,
      });

      toast.success("Distribution effectuée avec succès !");
      setMontant("");
      setPeriode("");
      setShowDistribModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Échec de la distribution");
    } finally {
      setIsDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Analyse des flux financiers...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/admin/project-wallets" className={styles.backLink}>
        <FiArrowLeft size={15} /> Retour
      </Link>

      <h1 className={styles.title}>{report?.projetLibelle}</h1>
      <p className={styles.subtitle}>
        <FiUser size={13} /> {report?.porteurNom} · {report?.porteurContact}
      </p>

      {/* ═══════════ SOLDES ═══════════ */}
      <div className={styles.balanceGrid}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>
            <FiPieChart size={14} /> Solde collecté (public)
          </div>
          <div className={styles.balanceValue}>
            {format(report?.montantCollectePublic || 0, "XOF")}
          </div>
          <p className={styles.balanceHint}>Visible par les investisseurs</p>
        </div>

        <div className={`${styles.balanceCard} ${styles.balanceCardGold}`}>
          <div className={styles.balanceLabel}>
            <FiDollarSign size={14} /> Trésorerie réelle
          </div>
          <div className={styles.balanceValue}>
            {format(report?.tresorerieReelle || 0, "XOF")}
          </div>
          <p className={styles.balanceHint}>Fonds disponibles en coffre</p>
        </div>
      </div>

      {/* ═══════════ ACTION DISTRIBUTION ═══════════ */}
      <button
        className={styles.distribTrigger}
        onClick={() => setShowDistribModal(true)}
      >
        <FiTrendingUp size={16} /> Distribuer des dividendes
      </button>

      {/* ═══════════ HISTORIQUE ═══════════ */}
      <section className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Historique des mouvements</h2>

        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <FiClock size={28} />
            <p>Aucune transaction pour ce projet</p>
          </div>
        ) : (
          <div className={styles.txList}>
            {transactions.map((tx) => {
              const isOut = OUTBOUND_TYPES.includes(tx.type);
              const label = TYPE_LABELS[tx.type] || tx.type.replace(/_/g, " ");
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
                      {tx.statut === "SUCCESS" ? "Réussi" : "En cours"}
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
              <h2>Distribuer des dividendes</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowDistribModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <label className={styles.modalLabel}>
              Montant total à payer (FCFA)
            </label>
            <input
              type="number"
              className={styles.modalInput}
              placeholder="Ex : 50000"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />

            <label className={styles.modalLabel}>Période</label>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="Ex : Trimestre 1 2025"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            />

            <label className={styles.modalLabel}>Motif</label>
            <input
              type="text"
              className={styles.modalInput}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />

            <p className={styles.modalHint}>
              Le montant sera réparti au prorata des parts entre tous les
              investisseurs actifs.
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowDistribModal(false)}
              >
                Annuler
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleDistribute}
                disabled={isDistributing || !montant}
              >
                {isDistributing ? "Calcul du prorata..." : "Lancer le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
