import { useEffect, useState } from "react";
import { FiBriefcase, FiCheckCircle, FiClock, FiUser, FiXCircle } from "react-icons/fi";
import { api } from "../../service/Api";
import { StatutFichePorteur, StatutJuridiquePorteur } from "../../types/enum";
import styles from "./FichePorteurForm.module.css";

interface MaFicheResponse {
  bio?: string;
  statutJuridique?: StatutJuridiquePorteur;
  raisonSociale?: string;
  anneesExperience?: number;
  projetsPrecedents?: string;
  ficheStatut?: StatutFichePorteur;
  commentaireRejet?: string;
}

/**
 * Vue LECTURE SEULE pour le porteur — la fiche de présentation est rédigée
 * et validée exclusivement par l'admin (due diligence interne). Le porteur
 * ne peut que consulter le résultat ici, jamais la créer ou la modifier.
 */
export default function FichePorteurForm() {
  const [loading, setLoading] = useState(true);
  const [fiche, setFiche] = useState<MaFicheResponse | null>(null);

  useEffect(() => {
    api
      .get<{ data: MaFicheResponse }>("/api/porteur/fiche")
      .then((res) => setFiche(res.data))
      .catch(() => setFiche(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.wrapper}>Chargement…</div>;

  const statut = fiche?.ficheStatut ?? StatutFichePorteur.NON_SOUMISE;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <FiUser size={28} />
        <div>
          <h1>Ma fiche de présentation</h1>
          <p>
            Cette fiche est rédigée par l'équipe GrowzApp après vérification de votre profil professionnel.
            Vous ne pouvez pas la modifier vous-même — contactez notre équipe si une information doit être
            corrigée.
          </p>
        </div>
      </div>

      {statut === StatutFichePorteur.NON_SOUMISE && (
        <div className={styles.badgeAttente}>
          <FiClock /> Aucune fiche n'a encore été créée pour vous. Contactez l'équipe GrowzApp pour
          engager la vérification de votre profil — c'est une étape nécessaire avant de pouvoir soumettre un
          projet.
        </div>
      )}

      {statut === StatutFichePorteur.VALIDEE && (
        <div className={styles.badgeValidee}>
          <FiCheckCircle /> Votre fiche est validée. Vous pouvez soumettre vos projets.
        </div>
      )}

      {statut === StatutFichePorteur.REJETEE && (
        <div className={styles.badgeRejetee}>
          <FiXCircle /> Votre fiche a été marquée non conforme
          {fiche?.commentaireRejet ? ` : ${fiche.commentaireRejet}` : "."} Contactez l'équipe GrowzApp pour
          la faire corriger.
        </div>
      )}

      {fiche && statut !== StatutFichePorteur.NON_SOUMISE && (
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Bio</label>
            <p className={styles.readonlyText}>{fiche.bio || "—"}</p>
          </div>
          <div className={styles.field}>
            <label><FiBriefcase /> Statut</label>
            <p className={styles.readonlyText}>
              {fiche.statutJuridique === StatutJuridiquePorteur.SOCIETE
                ? `Société — ${fiche.raisonSociale || "?"}`
                : "Entrepreneur individuel"}
            </p>
          </div>
          <div className={styles.field}>
            <label>Années d'expérience</label>
            <p className={styles.readonlyText}>{fiche.anneesExperience ?? "—"}</p>
          </div>
          {fiche.projetsPrecedents && (
            <div className={styles.field}>
              <label>Projets précédents</label>
              <p className={styles.readonlyText}>{fiche.projetsPrecedents}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
