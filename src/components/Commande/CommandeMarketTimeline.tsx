import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiCheck, FiClock, FiX } from "react-icons/fi";
import styles from "./CommandeTimeline.module.css";

export interface CommandeMarketTimelineData {
  statut: string;
  dateCommande: string;
  datePrete: string | null;
  dateRetraitConfirme: string | null;
  motifLitige: string | null;
}

type StepState = "done" | "pending" | "current" | "error" | "warning" | "skipped";

interface Step {
  key: string;
  label: string;
  date: string | null;
  state: StepState;
  motif?: string | null;
}

function fmt(d: string | null) {
  if (!d) return null;
  return formatDate(new Date(d), "dd MMM yyyy HH:mm", { locale: fr });
}

export default function CommandeMarketTimeline({ commande }: { commande: CommandeMarketTimelineData }) {
  const { t } = useTranslation();
  const s = commande.statut;

  const steps: Step[] = [
    {
      key: "commande",
      label: t("commande_timeline.commandee", "Commandée"),
      date: commande.dateCommande,
      state: "done",
    },
  ];

  if (s === "LITIGE") {
    steps.push({
      key: "prete",
      label: t("growzmarket.timeline.prete", "Prête au retrait"),
      date: commande.datePrete,
      state: commande.datePrete ? "done" : "pending",
    });
    steps.push({
      key: "litige",
      label: t("commande_timeline.litige", "Litige en cours"),
      date: null,
      state: "warning",
      motif: commande.motifLitige,
    });
  } else if (s === "ANNULEE") {
    steps.push({
      key: "annulee",
      label: t("growzmarket.timeline.annulee", "Annulée (litige en faveur de l'acheteur, remboursé)"),
      date: null,
      state: "error",
      motif: commande.motifLitige,
    });
  } else if (s === "NON_RETIREE") {
    steps.push({
      key: "prete",
      label: t("growzmarket.timeline.prete", "Prête au retrait"),
      date: commande.datePrete,
      state: "done",
    });
    steps.push({
      key: "non_retiree",
      label: t("growzmarket.timeline.non_retiree", "Non retirée — en attente d'arbitrage"),
      date: null,
      state: "warning",
    });
  } else {
    steps.push({
      key: "prete",
      label: t("growzmarket.timeline.prete", "Prête au retrait"),
      date: commande.datePrete,
      state: commande.datePrete ? "done" : s === "PAYEE" ? "current" : "pending",
    });
    steps.push({
      key: "retiree",
      label: t("growzmarket.timeline.retiree", "Retrait confirmé"),
      date: commande.dateRetraitConfirme,
      state: commande.dateRetraitConfirme ? "done" : s === "PRETE_AU_RETRAIT" ? "current" : "pending",
    });
  }

  return (
    <ol className={styles.timeline}>
      {steps.map((step) => (
        <li key={step.key} className={`${styles.step} ${styles[step.state]}`}>
          <span className={styles.icon}>
            {step.state === "done" && <FiCheck size={12} />}
            {step.state === "error" && <FiX size={12} />}
            {step.state === "warning" && <FiAlertTriangle size={12} />}
            {(step.state === "current" || step.state === "pending") && <FiClock size={12} />}
          </span>
          <div className={styles.content}>
            <span className={styles.label}>{step.label}</span>
            {step.date && <span className={styles.date}>{fmt(step.date)}</span>}
            {step.motif && <span className={styles.motif}>{step.motif}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
