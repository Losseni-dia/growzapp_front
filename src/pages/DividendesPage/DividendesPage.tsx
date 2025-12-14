// src/pages/DividendesPage/DividendesPage.tsx
import { useState, useEffect } from "react";
import { api, getFreshToken } from "../../service/api";
import { useAuth } from "../../components/context/AuthContext";
import toast from "react-hot-toast";
import {
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
} from "react-icons/fi";
import styles from "./DividendesPage.module.css";

// Interface mise à jour pour inclure factureId
interface Dividende {
  id: number;
  montantParPart: number;
  statutDividende: "PLANIFIE" | "PAYE";
  datePaiement?: string;
  montantTotal: number;
  projetLibelle: string;
  factureId?: number; // <--- AJOUTÉ ICI POUR CORRIGER L'ERREUR TS
}

export default function DividendesPage() {
  const { user } = useAuth();
  const [dividendes, setDividendes] = useState<Dividende[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDividendes = async () => {
      try {
        setLoading(true);
        const data = await api.get<Dividende[]>(
          "/api/dividendes/mes-dividendes"
        ); // Vérifie le chemin API
        setDividendes(data);
      } catch (err: any) {
        toast.error(err.message || "Impossible de charger vos dividendes");
      } finally {
        setLoading(false);
      }
    };

    if (user) loadDividendes();
  }, [user]);

  // FONCTION DE TÉLÉCHARGEMENT PDF
  const downloadFacture = async (factureId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/factures/${factureId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getFreshToken() || ""}`,
          },
        }
      );

      if (!response.ok) throw new Error("Facture non disponible");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-dividende-${factureId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Facture téléchargée !");
    } catch (err: any) {
      toast.error("Facture non disponible ou erreur de téléchargement");
    }
  };

  if (loading) {
    return <p className={styles.loading}>Chargement de vos dividendes...</p>;
  }

  const totalPercu = dividendes
    .filter((d) => d.statutDividende === "PAYE")
    .reduce((acc, d) => acc + d.montantTotal, 0);

  const totalPlanifie = dividendes
    .filter((d) => d.statutDividende === "PLANIFIE")
    .reduce((acc, d) => acc + d.montantTotal, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          <FiDollarSign /> Mes Dividendes
        </h1>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.label}>Perçus</span>
            <strong className={styles.percu}>
              {totalPercu.toLocaleString()} €
            </strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Planifiés</span>
            <strong className={styles.planifie}>
              {totalPlanifie.toLocaleString()} €
            </strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Total</span>
            <strong className={styles.total}>
              {(totalPercu + totalPlanifie).toLocaleString()} €
            </strong>
          </div>
        </div>
      </header>

      {dividendes.length === 0 ? (
        <div className={styles.empty}>
          <FiDollarSign size={60} />
          <p>Aucun dividende pour le moment.</p>
          <small>Continuez à investir, ils arriveront bientôt !</small>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Projet</th>
                <th>Montant total</th>
                <th>Montant/part</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Facture</th>
              </tr>
            </thead>
            <tbody>
              {dividendes.map((dividende) => (
                <tr key={dividende.id} className={styles.row}>
                  <td>
                    <strong>{dividende.projetLibelle}</strong>
                  </td>
                  <td className={styles.montant}>
                    {dividende.montantTotal.toLocaleString()} €
                  </td>
                  <td>{dividende.montantParPart.toLocaleString()} €</td>
                  <td>
                    <span
                      className={`${styles.statut} ${
                        dividende.statutDividende === "PAYE"
                          ? styles.paye
                          : styles.planifie
                      }`}
                    >
                      {dividende.statutDividende === "PAYE" ? (
                        <>
                          <FiCheckCircle /> Payé
                        </>
                      ) : (
                        <>
                          <FiClock /> Planifié
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {dividende.datePaiement
                      ? new Date(dividende.datePaiement).toLocaleDateString(
                          "fr-FR"
                        )
                      : "-"}
                  </td>
                  <td>
                    {/* Utilisation conditionnelle de factureId */}
                    {dividende.factureId ? (
                      <button
                        onClick={() => downloadFacture(dividende.factureId!)}
                        className={styles.downloadBtn}
                        title="Télécharger la facture PDF"
                      >
                        <FiDownload /> PDF
                      </button>
                    ) : (
                      <span style={{ color: "#999", fontStyle: "italic" }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
