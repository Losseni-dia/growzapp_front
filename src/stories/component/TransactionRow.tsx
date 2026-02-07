import React from 'react';
import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import styles from './TransactionRow.module.css';

interface TransactionProps {
  tx: {
    id: number;
    type: string;
    montant: number;
    statut: string;
    createdAt: string;
  };
  formatCurrency: (val: number, currency: string) => string;
}

export const TransactionRow: React.FC<TransactionProps> = ({ tx, formatCurrency }) => {
  const isOutbound = ["INVESTISSEMENT", "RETRAIT", "TRANSFERT_OUT", "PAYMENT"].includes(tx.type.toUpperCase());
  
  return (
    <tr className={styles.trBody}>
      <td className={styles.td}>
        {formatDate(new Date(tx.createdAt), "dd MMM yyyy", { locale: fr })}
      </td>
      <td className={styles.td}>
        <span className={styles.typeBadge}>{tx.type}</span>
      </td>
      <td className={`${styles.td} ${isOutbound ? styles.negative : styles.positive}`}>
        {isOutbound ? "-" : "+"} {formatCurrency(tx.montant, "XOF")}
      </td>
      <td className={styles.td}>
        <span className={`${styles.status} ${tx.statut === "SUCCESS" ? styles.statusSuccess : styles.statusPending}`}>
          {tx.statut}
        </span>
      </td>
    </tr>
  );
};

export default TransactionRow;