// src/components/Investissement/InvestForm/InvestForm.tsx
import { useState } from "react";
import styles from "./InvestForm.module.css";
import { api } from "../../../service/api";
import { ProjetDTO } from "../../../types/projet";
import { useAuth } from "../../../components/context/AuthContext";
import toast from "react-hot-toast";
import { FiDollarSign, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface InvestFormProps {
  projet: ProjetDTO;
  onSuccess: () => void; // pour recharger les stats après investissement
}

export default function InvestForm({ projet, onSuccess }: InvestFormProps) {
  const { user } = useAuth();

  const [parts, setParts] = useState(1);
  const [loading, setLoading] = useState(false);

  const maxParts = projet.partsDisponible;
  const prixPart = projet.prixUnePart;
  const total = parts * prixPart;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Vous devez être connecté pour investir");
      return;
    }

    if (parts < 1 || parts > maxParts) {
      toast.error(`Veuillez choisir entre 1 et ${maxParts} part(s)`);
      return;
    }

    setLoading(true);

    try {
      await api.post("/investissements", {
        projetId: projet.id,
        nombrePartsPris: parts,
        // investisseurId est automatiquement ajouté côté backend grâce à l'auth
      });

      toast.success(
        <div className={styles.toastSuccess}>
          <FiCheckCircle size={24} />
          <div>
            <strong>Félicitations !</strong>
            <br />
            Vous avez investi dans <strong>{parts} part(s)</strong> pour un
            total de <strong>{total.toLocaleString()} €</strong>
          </div>
        </div>,
        { duration: 6000 }
      );

      onSuccess(); // recharge les stats du projet + dashboard
    } catch (err: any) {
      const msg = err.message || "Erreur lors de l'investissement";
      toast.error(
        msg.includes("déjà investi")
          ? "Vous avez déjà investi dans ce projet"
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <FiDollarSign /> Investir dans ce projet
      </h3>

      <div className={styles.info}>
        <p>
          <strong>Prix par part :</strong> {prixPart.toLocaleString()} €
        </p>
        <p>
          <strong>Parts disponibles :</strong> {maxParts.toLocaleString()}
        </p>
        <p className={styles.progressText}>
          {Math.round(
            (projet.partsPrises / (projet.partsPrises + maxParts)) * 100
          )}
          % déjà financés
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="parts">Nombre de parts à acheter</label>
          <input
            id="parts"
            type="number"
            min="1"
            max={maxParts}
            value={parts}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setParts(Math.max(1, Math.min(maxParts, val)));
            }}
            disabled={loading}
            className={styles.input}
          />
          {parts > maxParts && (
            <p className={styles.errorText}>
              <FiAlertCircle /> Maximum {maxParts} parts disponibles
            </p>
          )}
        </div>

        <div className={styles.totalBox}>
          <span>Total à payer : </span>
          <span className={styles.totalPrice}>
            {" "}
            {total.toLocaleString()} €
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || parts < 1 || parts > maxParts}
          className={styles.submitBtn}
        >
          {loading ? (
            <>Investissement en cours...</>
          ) : (
            <>Confirmer l'investissement • {total.toLocaleString()} €</>
          )}
        </button>

        <p className={styles.hint}>
          Votre investissement sera validé par l’administrateur sous 48h.
          <br />
          Un contrat vous sera envoyé par email une fois approuvé.
        </p>
      </form>
    </div>
  );
}
