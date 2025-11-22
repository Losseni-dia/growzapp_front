// src/pages/DividendesPage/DividendesPage.tsx
import { useState, useEffect } from "react";
import { api } from "../../service/api";
import { useAuth } from "../../components/context/AuthContext";
import toast from "react-hot-toast";
import {
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
} from "react-icons/fi";
import styles from "./DividendesPage.module.css";

interface Dividende {
  id: number;
  montantParPart: number;
  statutDividende: "PLANIFIE" | "PAYE";
  datePaiement?: string;
  montantTotal: number;
  projetLibelle: string;
}

export default function DividendesPage() {
  const { user } = useAuth();
  const [dividendes, setDividendes] = useState<Dividende[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDividendes = async () => {
      try {
        setLoading(true);
        const data = await api.get<Dividende[]>("/dividendes/mes-dividendes");
        setDividendes(data);
      } catch (err: any) {
        toast.error(err.message || "Impossible de charger vos dividendes");
      } finally {
        setLoading(false);
      }
    };

    if (user) loadDividendes();
  }, [user]);

  // FONCTION DE TÉLÉCHARGEMENT PDF – PARFAITE
  const downloadFacture = async (dividendeId: number) => {
    try {
      const blob = await api.getBlob(`/dividendes/${dividendeId}/facture`);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `facture-dividende-${dividendeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Facture téléchargée avec succès ! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du téléchargement de la facture");
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
                    <button
                      onClick={() => downloadFacture(dividende.id)}
                      className={styles.downloadBtn}
                      title="Télécharger la facture PDF"
                    >
                      <FiDownload /> PDF
                    </button>
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
