import React from 'react';
import styles from './BalanceCard.module.css';

interface BalanceCardProps {
  label: string;
  amount: number;
  type: 'available' | 'blocked' | 'withdrawable';
  format: (value: number, currency: string) => string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ label, amount, type, format }) => {
  const cardClass = `${styles.balanceCard} ${styles[type]}`;

  return (
    <div className={cardClass}>
      <div className={styles.balanceLabel}>{label}</div>
      <div className={styles.balanceAmount}>
        {format(amount, "XOF")}
      </div>
    </div>
  );
};

export default BalanceCard;