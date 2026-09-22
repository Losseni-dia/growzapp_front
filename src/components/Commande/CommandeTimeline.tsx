import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiCheck, FiClock, FiX } from "react-icons/fi";
import styles from "./CommandeTimeline.module.css";

export interface CommandeTimelineData {
  statut: string;
  dateCommande: string;
  dateValidationAdmin: string | null;
  dateAcceptation: string | null;
  dateExpedition: string | null;
  dateConfirmationReception: string | null;
  datePaiement: string | null;
  motifRejet: string | null;
  motifRefus: string | null;
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

export default function CommandeTimeline({ commande }: { commande: CommandeTimelineData }) {
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

  if (s === "REJETEE") {
    steps.push({
      key: "rejetee",
      label: t("commande_timeline.rejetee", "Rejetée par l'admin"),
      date: null,
      state: "error",
      motif: commande.motifRejet,
    });
  } else {
    steps.push({
      key: "validation",
      label: t("commande_timeline.validee", "Validée par l'admin"),
      date: commande.dateValidationAdmin,
      state: commande.dateValidationAdmin ? "done" : s === "EN_ATTENTE_VALIDATION" ? "current" : "pending",
    });

    if (s === "REFUSEE") {
      steps.push({
        key: "refusee",
        label: t("commande_timeline.refusee", "Refusée par le fournisseur"),
        date: null,
        state: "error",
        motif: commande.motifRefus,
      });
    } else {
      steps.push({
        key: "acceptation",
        label: t("commande_timeline.acceptee", "Acceptée par le fournisseur"),
        date: commande.dateAcceptation,
        state: commande.dateAcceptation ? "done" : s === "EN_ATTENTE_ACCEPTATION" ? "current" : "pending",
      });

      steps.push({
        key: "expedition",
        label: t("commande_timeline.expediee", "Expédiée"),
        date: commande.dateExpedition,
        state: commande.dateExpedition ? "done" : s === "ACCEPTEE" ? "current" : "pending",
      });

      if (s === "LITIGE") {
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
          label: t("commande_timeline.annulee", "Annulée (litige en faveur du porteur)"),
          date: null,
          state: "error",
          motif: commande.motifLitige,
        });
      } else {
        steps.push({
          key: "reception",
          label: t("commande_timeline.livree", "Réception confirmée"),
          date: commande.dateConfirmationReception,
          state: commande.dateConfirmationReception ? "done" : s === "EXPEDIEE" ? "current" : "pending",
        });

        steps.push({
          key: "paiement",
          label: t("commande_timeline.payee", "Payée au fournisseur"),
          date: commande.datePaiement,
          state: commande.datePaiement ? "done" : s === "LIVREE" ? "current" : "pending",
        });
      }
    }
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
