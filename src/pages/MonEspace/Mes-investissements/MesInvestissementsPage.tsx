// src/pages/investisseur/MesInvestissementsPage.tsx → VERSION FINALE PARFAITE 2025

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../service/api";
import { InvestissementDTO } from "../../../types/investissement";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiDownload,
} from "react-icons/fi";
import styles from "./MesInvestissementsPage.module.css";

export default function MesInvestissementsPage() {
  const [investissements, setInvestissements] = useState<InvestissementDTO[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: InvestissementDTO[] }>(
        "/api/investissements/mes-investissements"
      )
      .then((response) => {
        setInvestissements(response.data || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Impossible de charger vos investissements");
      })
      .finally(() => setLoading(false));
  }, []);

  // FONCTION MAGIQUE : TÉLÉCHARGE UN VRAI PDF
  const downloadContract = async (
    fichierUrl: string,
    numeroContrat: string
  ) => {
    if (!fichierUrl) {
      toast.error("Le contrat n'est pas encore disponible");
      return;
    }

    try {
      const response = await fetch(fichierUrl);
      if (!response.ok) throw new Error("PDF non trouvé");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contrat_${numeroContrat}.pdf`; // VRAI NOM DE FICHIER
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Contrat téléchargé avec succès !");
    } catch (err) {
      toast.error("Erreur lors du téléchargement");
      console.error(err);
    }
  };

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return {
          icon: FiClock,
          color: "#e67e22",
          bg: "#fff3e0",
          border: "#ffb74d",
          label: "En attente de validation",
        };
      case "VALIDE":
        return {
          icon: FiCheckCircle,
          color: "#1b5e20",
          bg: "#e8f5e9",
          border: "#4caf50",
          label: "Validé",
        };
      case "REJETE":
      case "ANNULE":
        return {
          icon: FiXCircle,
          color: "#c62828",
          bg: "#ffebee",
          border: "#e57373",
          label: "Refusé",
        };
      default:
        return {
          icon: FiClock,
          color: "#666",
          bg: "#f5f5f5",
          border: "#ccc",
          label: statut,
        };
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Chargement de vos investissements...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Mes Investissements</h1>
        <p>
          Vous avez investi dans <strong>{investissements.length}</strong>{" "}
          projet(s)
        </p>
      </div>

      {/* ÉTAT VIDE */}
      {investissements.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiDollarSign size={80} />
          </div>
          <h2>Aucun investissement pour le moment</h2>
          <p>
            Découvrez les projets en cours et commencez à investir dès
            aujourd'hui !
          </p>
          <Link to="/projets" className={styles.btnInvestir}>
            Voir les projets disponibles
          </Link>
        </div>
      ) : (
        /* LISTE DES INVESTISSEMENTS */
        <div className={styles.grid}>
          {investissements.map((inv) => {
            const config = getStatutConfig(inv.statutPartInvestissement);
            const Icon = config.icon;

            return (
              <div key={inv.id} className={styles.card}>
                {/* POSTER + BADGE STATUT */}
                <div className={styles.poster}>
                  <img
                    src={inv.projetPoster || "/default-projet.jpg"}
                    alt={inv.projetLibelle}
                    className={styles.posterImg}
                  />
                  <div
                    className={styles.statutBadge}
                    style={{
                      background: config.bg,
                      color: config.color,
                      border: `2px solid ${config.border}`,
                    }}
                  >
                    <Icon size={20} />
                    <span>{config.label}</span>
                  </div>
                </div>

                {/* CONTENU */}
                <div className={styles.content}>
                  <h3 className={styles.projetTitle}>{inv.projetLibelle}</h3>

                  <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                      <FiCalendar className={styles.icon} />
                      <div>
                        <small>Date d'investissement</small>
                        <div>
                          {format(new Date(inv.date), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.partsIcon}>Parts</span>
                      <div>
                        <small>Parts acquises</small>
                        <div>
                          <strong>{inv.nombrePartsPris}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MONTANT INVESTI */}
                  <div className={styles.montantInvesti}>
                    <strong>{inv.montantInvesti.toLocaleString()} €</strong>{" "}
                    investis
                  </div>

                  {/* DIVIDENDES */}
                  {inv.dividendes && inv.dividendes.length > 0 && (
                    <div className={styles.dividendes}>
                      <FiTrendingUp size={18} />
                      <span>
                        {inv.dividendesPayes} payé(s) •{" "}
                        {inv.dividendesPlanifies} prévu(s)
                        {" • "}
                        <strong>
                          {inv.montantTotalPercu.toLocaleString()} €
                        </strong>{" "}
                        perçus
                      </span>
                    </div>
                  )}

                  {/* ACTIONS – TÉLÉCHARGEMENT PDF + VOIR CONTRAT */}
                  <div className={styles.actions}>
                    {/* TÉLÉCHARGEMENT DU VRAI PDF */}
                    {inv.statutPartInvestissement === "VALIDE" && inv.contratUrl && (
                  <button
                    onClick={() => downloadContract(inv.contratUrl!, inv.numeroContrat!)}
                    className={styles.btnDownload}
                  >
                    <FiDownload size={20} />
                    Télécharger le contrat (PDF)
                  </button>
                )}

                    {/* VOIR LE CONTRAT DANS LE NAVIGATEUR */}
                    {inv.statutPartInvestissement === "VALIDE" &&
                      inv.numeroContrat && (
                        <Link
                          to={`/contrat/${inv.numeroContrat}`}
                          className={styles.btnContrat}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiFileText size={20} />
                          Voir le contrat
                        </Link>
                      )}

                    {/* MESSAGE EN ATTENTE */}
                    {inv.statutPartInvestissement === "EN_ATTENTE" && (
                      <div className={styles.pendingText}>
                        Validation sous 48h maximum
                      </div>
                    )}

                    {/* VOIR LE PROJET */}
                    <Link
                      to={`/projet/${inv.projetId}`}
                      className={styles.btnVoir}
                    >
                      Voir le projet
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
