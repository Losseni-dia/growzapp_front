import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../../service/Api";
import styles from "./WalletProjetDetails.module.css";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiTrendingUp,
  FiDollarSign,
  FiList,
  FiPieChart,
  FiTag,
  FiClock,
} from "react-icons/fi";
import { useCurrency } from "../../../../components/Context/CurrencyContext";

// Types de transactions qui font sortir l'argent du portefeuille projet
const OUTBOUND_TYPES = [
  "VERSEMENT_PORTEUR",
  "DISTRIBUTION_DIVIDENDE",
  "RETRAIT_ADMIN",
  "FRAIS_PLATEFORME",
  "RETRAIT",
];

export default function ProjectWalletDetails() {
  const { projetId } = useParams();
  const { format } = useCurrency();

  const [report, setReport] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // États distribution
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("Distribution Dividendes");
  const [periode, setPeriode] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Chargement simultané du rapport de soldes et de l'historique
      const [reportRes, txRes] = await Promise.all([
        api.get<any>(`/api/admin/projet-wallet/${projetId}/rapport-complet`),
        api.get<any[]>(`/api/admin/projet-wallet/${projetId}/transactions`),
      ]);

      setReport(reportRes);
      setTransactions(txRes);
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
      loadData(); // Rafraîchissement des soldes et de l'historique
    } catch (err: any) {
      toast.error(err.message || "Échec de la distribution");
    } finally {
      setIsDistributing(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>Analyse des flux financiers...</div>;

  return (
    <div className={styles.container}>
      <Link to="/admin/project-wallets" className={styles.backLink}>
        <FiArrowLeft /> Retour Admin
      </Link>

      <h1 className={styles.title}>
        Gestion Trésorerie : {report?.projetLibelle}
      </h1>

      {/* CARTES DE SOLDES (VUE DOUBLE) */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard} style={{ borderColor: "var(--growz-primary)" }}>
          <h3>
            <FiPieChart /> Solde Collecté (Public)
          </h3>
          <div className={styles.bigAmount} style={{ color: "var(--growz-primary)" }}>
            {format(report?.montantCollectePublic || 0, "XOF")}
          </div>
          <small>Visible par les investisseurs sur la carte</small>
        </div>

        <div className={styles.summaryCard} style={{ borderColor: "#E2B607" }}>
          <h3>
            <FiDollarSign /> Trésorerie Réelle (Admin)
          </h3>
          <div className={styles.bigAmount} style={{ color: "#E2B607" }}>
            {format(report?.tresorerieReelle || 0, "XOF")}
          </div>
          <small>
            Fonds réellement en coffre (déduction faite des paiements)
          </small>
        </div>
      </div>

      {/* FORMULAIRE DE DISTRIBUTION DES DIVIDENDES */}
      <div className={styles.actionSection}>
        <h2>
          <FiTrendingUp /> Distribuer des Dividendes
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <input
            type="number"
            className={styles.input}
            placeholder="Montant total à payer"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
          <input
            type="text"
            className={styles.input}
            placeholder="Période (ex: Trimestre 1 2025)"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          />
        </div>
        <input
          type="text"
          className={styles.input}
          placeholder="Motif détaillé"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />
        <button
          className={styles.btnDividende}
          onClick={handleDistribute}
          disabled={isDistributing || !montant}
        >
          {isDistributing
            ? "Calcul du prorata..."
            : "Lancer le paiement global"}
        </button>
      </div>

      {/* JOURNAL DES TRANSACTIONS DÉTAILLÉ */}
      <h2 className={styles.subtitle}>
        <FiList /> Historique des Mouvements
      </h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <FiClock /> Date
              </th>
              <th>Type</th>
              <th>
                <FiTag /> Motif / Description
              </th>
              <th style={{ textAlign: "right" }}>Montant</th>
              <th style={{ textAlign: "center" }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  Aucune transaction pour ce projet
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isNegative = OUTBOUND_TYPES.includes(tx.type);
                return (
                  <tr key={tx.id}>
                    <td className={styles.center}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className={styles.center}>
                      <span
                        className={
                          isNegative ? styles.badgeRed : styles.badgeGreen
                        }
                      >
                        {tx.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: "500" }}>{tx.description}</td>
                    <td
                      className={styles.amount}
                      style={{
                        color: isNegative ? "#d32f2f" : "#2e7d32",
                        textAlign: "right",
                      }}
                    >
                      {/* Affichage du signe + ou - selon le type */}
                      {isNegative ? "- " : "+ "}
                      {format(tx.montant, "XOF")}
                    </td>
                    <td className={styles.center}>
                      <span
                        className={`${styles.statut} ${
                          tx.statut === "SUCCESS"
                            ? styles.valide
                            : styles.en_attente
                        }`}
                      >
                        {tx.statut}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
