// src/components/Investissement/InvestForm/InvestForm.tsx

import { useState } from "react";
import styles from "./InvestForm.module.css";
import { ProjetDTO } from "../../../types/projet";
import toast from "react-hot-toast";
import { FiDollarSign, FiCheckCircle, FiLock } from "react-icons/fi";

interface InvestFormProps {
  projet: ProjetDTO;
  onSuccess: () => void;
}

export default function InvestForm({ projet, onSuccess }: InvestFormProps) {
  const [parts, setParts] = useState(1);
  const [loading, setLoading] = useState(false);

  const maxParts = projet.partsDisponible - projet.partsPrises;
  const total = parts * projet.prixUnePart;

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (parts < 1 || parts > maxParts)
     return toast.error("Nombre de parts invalide");

   setLoading(true);

   try {
     const userStr = localStorage.getItem("user");
     const token = userStr ? JSON.parse(userStr).token : null;
     if (!token) throw new Error("Token manquant");

     const response = await fetch(
       `http://localhost:8080/api/projets/${projet.id}/investir`,
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`, // OBLIGATOIRE
         },
         body: JSON.stringify({ nombrePartsPris: parts }),
         credentials: "include",
       }
     );

     if (!response.ok) {
       const err = await response.text();
       throw new Error(err || "Non autorisé");
     }

     toast.success(
       "Investissement enregistré ! En attente de validation admin."
     );
     onSuccess?.();
   } catch (err: any) {
     toast.error(err.message);
   } finally {
     setLoading(false);
   }
 };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Investir dans "{projet.libelle}"</h3>

      <div className={styles.info}>
        <p>
          <strong>Prix par part :</strong> {projet.prixUnePart.toLocaleString()}{" "}
          €
        </p>
        <p>
          <strong>Parts disponibles :</strong> {maxParts.toLocaleString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Nombre de parts</label>
          <input
            type="number"
            min="1"
            max={maxParts}
            value={parts}
            onChange={(e) =>
              setParts(
                Math.max(1, Math.min(maxParts, parseInt(e.target.value) || 1))
              )
            }
            disabled={loading}
            className={styles.input}
          />
        </div>

        <div className={styles.totalBox}>
          <FiLock /> Montant bloqué :{" "}
          <span className={styles.totalPrice}>{total.toLocaleString()} €</span>
        </div>

        <button
          type="submit"
          disabled={loading || maxParts <= 0}
          className={styles.submitBtn}
        >
          {loading
            ? "Traitement..."
            : `Réserver ${parts} part(s) • ${total.toLocaleString()} €`}
        </button>

        <p className={styles.hint}>
          Votre argent sera bloqué immédiatement.
          <br />
          Validation sous 48h • Contrat envoyé par email.
        </p>
      </form>
    </div>
  );
}
