import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCreditCard } from "react-icons/fi";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import type { TransactionDTO } from "../../../types/transaction";
import styles from "./FournisseurEspace.module.css";

interface CommandeDTO {
  id: number;
  projetLibelle: string;
}

export default function FournisseurTransactionsPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [projetParCommande, setProjetParCommande] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<TransactionDTO[]>("/api/wallets/transactions"),
      api.get<{ data: CommandeDTO[] }>("/api/commandes/recues"),
    ])
      .then(([txRes, cmdRes]) => {
        setTransactions((txRes || []).filter((tx) => tx.type === "PAIEMENT_FOURNISSEUR"));
        const map: Record<number, string> = {};
        (cmdRes.data || []).forEach((c) => {
          map[c.id] = c.projetLibelle;
        });
        setProjetParCommande(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const projetDe = (tx: TransactionDTO): string =>
    tx.referenceType === "COMMANDE" && tx.referenceId ? projetParCommande[tx.referenceId] || "—" : "—";

  const total = transactions.reduce((sum, tx) => sum + Number(tx.montant), 0);

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div>
      <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        <FiCreditCard /> {t("fournisseur.espace.transactions_title", "Mes transactions")}
      </h2>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            {t("fournisseur.espace.transactions_total_label", "Total reçu")}
          </span>
          <span className={styles.statValue}>{format(total, "XOF")}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            {t("fournisseur.espace.transactions_count_label", "Paiements reçus")}
          </span>
          <span className={styles.statValue}>{transactions.length}</span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.transactions_empty", "Aucune transaction pour le moment.")}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("fournisseur.espace.transactions_col_date", "Date")}</th>
                <th>{t("fournisseur.espace.transactions_col_projet", "Projet")}</th>
                <th>{t("fournisseur.espace.transactions_col_description", "Description")}</th>
                <th>{t("fournisseur.espace.transactions_col_montant", "Montant")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(new Date(tx.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</td>
                  <td>{projetDe(tx)}</td>
                  <td>{tx.description || "—"}</td>
                  <td>+{format(Number(tx.montant), "XOF")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
