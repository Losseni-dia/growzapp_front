import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiCreditCard } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import styles from "./ProjetTransactionsList.module.css";

interface ProjetTransactionDTO {
  id: number;
  montant: number;
  createdAt: string;
  description: string | null;
  projetId: number;
  projetLibelle: string;
}

interface Props {
  type: "PAIEMENT_FOURNISSEUR" | "VENTE_MARKET";
  title: string;
  subtitle: string;
  totalLabel: string;
  countLabel: string;
  emptyLabel: string;
}

export default function ProjetTransactionsList({ type, title, subtitle, totalLabel, countLabel, emptyLabel }: Props) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [transactions, setTransactions] = useState<ProjetTransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: ProjetTransactionDTO[] }>(`/api/projets/mes-projets/wallet/transactions?type=${type}`)
      .then((res) => setTransactions(res.data || []))
      .finally(() => setLoading(false));
  }, [type]);

  const total = transactions.reduce((sum, tx) => sum + Number(tx.montant), 0);

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <Link to="/mon-dashboard-porteur" className={styles.backLink}>
        <FiArrowLeft /> {t("porteur.title")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiCreditCard /> {title}
        </h1>
        <p>{subtitle}</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>{totalLabel}</span>
          <span className={styles.statValue}>{format(total, "XOF")}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>{countLabel}</span>
          <span className={styles.statValue}>{transactions.length}</span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("porteur.transactions.col_date", "Date")}</th>
                <th>{t("porteur.transactions.col_projet", "Projet")}</th>
                <th>{t("porteur.transactions.col_description", "Description")}</th>
                <th>{t("porteur.transactions.col_montant", "Montant")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(new Date(tx.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</td>
                  <td>{tx.projetLibelle}</td>
                  <td>{tx.description || "—"}</td>
                  <td>{format(Number(tx.montant), "XOF")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
