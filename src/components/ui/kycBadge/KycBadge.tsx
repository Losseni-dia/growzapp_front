import React from "react";
import { KycStatus, KycStatusLabel } from "../../../types/enum";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Clock } from "lucide-react";
import styles from "./KycBadge.module.css";

interface KycBadgeProps {
  status: KycStatus | string; // On accepte string au cas où l'enum n'est pas casté
  showLabel?: boolean;
}

export const KycBadge = ({ status, showLabel = true }: KycBadgeProps) => {
  const getBadgeConfig = () => {
    // Normalisation pour éviter les erreurs de casse (ex: "Valide" vs "VALIDE")
    const currentStatus = status?.toString().toUpperCase();

    switch (currentStatus) {
      case KycStatus.VALIDE:
        return {
          className: styles.valid,
          icon: <ShieldCheck size={16} />,
          label: KycStatusLabel.VALIDE,
        };
      case KycStatus.EN_ATTENTE:
        return {
          className: styles.pending,
          icon: <Clock size={16} />,
          label: KycStatusLabel.EN_ATTENTE,
        };
      case KycStatus.REJETE:
        return {
          className: styles.rejected,
          icon: <ShieldAlert size={16} />,
          label: KycStatusLabel.REJETE,
        };
      default:
        return {
          className: styles.none,
          icon: <ShieldQuestion size={16} />,
          label: KycStatusLabel.NON_SOUMIS,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`${styles.badge} ${config.className}`} title={config.label}>
      {config.icon}
      {showLabel && <span className={styles.label}>{config.label}</span>}
    </div>
  );
};