import { useEffect, useState } from "react";
import { FiBriefcase, FiCheckCircle, FiClock, FiUser, FiXCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { api } from "../../service/Api";
import { StatutFichePorteur, StatutJuridiquePorteur } from "../../types/enum";
import styles from "./FichePorteurForm.module.css";

interface ProjetPrecedent {
  id: number;
  libelle: string;
  statutProjet: string;
  pourcentageFinance: number;
}

interface MaFicheResponse {
  bio?: string;
  statutJuridique?: StatutJuridiquePorteur;
  raisonSociale?: string;
  anneesExperience?: number;
  projetsPrecedents?: string;
  projetsPrecedentsListe?: ProjetPrecedent[];
  ficheStatut?: StatutFichePorteur;
  commentaireRejet?: string;
}

/**
 * Vue LECTURE SEULE pour le porteur — la fiche de présentation est rédigée
 * et validée exclusivement par l'admin (due diligence interne). Le porteur
 * ne peut que consulter le résultat ici, jamais la créer ou la modifier.
 */
export default function FichePorteurForm() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [fiche, setFiche] = useState<MaFicheResponse | null>(null);

  useEffect(() => {
    api
      .get<{ data: MaFicheResponse }>(`/api/porteur/fiche?langue=${i18n.language}`)
      .then((res) => setFiche(res.data))
      .catch(() => setFiche(null))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  if (loading) return <div className={styles.wrapper}>{t("fiche_porteur.loading", "Chargement…")}</div>;

  const statut = fiche?.ficheStatut ?? StatutFichePorteur.NON_SOUMISE;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <FiUser size={28} />
        <div>
          <h1>{t("fiche_porteur.title", "Ma fiche de présentation")}</h1>
          <p>
            {t(
              "fiche_porteur.intro",
              "Cette fiche est rédigée par l'équipe GrowzApp après vérification de votre profil professionnel. Vous ne pouvez pas la modifier vous-même — contactez notre équipe si une information doit être corrigée."
            )}
          </p>
        </div>
      </div>

      {statut === StatutFichePorteur.NON_SOUMISE && (
        <div className={styles.badgeAttente}>
          <FiClock />{" "}
          {t(
            "fiche_porteur.badge_non_soumise",
            "Aucune fiche n'a encore été créée pour vous. Contactez l'équipe GrowzApp pour engager la vérification de votre profil — c'est une étape nécessaire avant de pouvoir soumettre un projet."
          )}
        </div>
      )}

      {statut === StatutFichePorteur.VALIDEE && (
        <div className={styles.badgeValidee}>
          <FiCheckCircle /> {t("fiche_porteur.badge_validee", "Votre fiche est validée. Vous pouvez soumettre vos projets.")}
        </div>
      )}

      {statut === StatutFichePorteur.REJETEE && (
        <div className={styles.badgeRejetee}>
          <FiXCircle /> {t("fiche_porteur.badge_rejetee", "Votre fiche a été marquée non conforme")}
          {fiche?.commentaireRejet ? ` : ${fiche.commentaireRejet}` : "."}{" "}
          {t("fiche_porteur.badge_rejetee_contact", "Contactez l'équipe GrowzApp pour la faire corriger.")}
        </div>
      )}

      {fiche && statut !== StatutFichePorteur.NON_SOUMISE && (
        <div className={styles.form}>
          <div className={styles.field}>
            <label>{t("fiche_porteur.bio", "Bio")}</label>
            <p className={styles.readonlyText}>{fiche.bio || "—"}</p>
          </div>
          <div className={styles.field}>
            <label><FiBriefcase /> {t("fiche_porteur.statut", "Statut")}</label>
            <p className={styles.readonlyText}>
              {fiche.statutJuridique === StatutJuridiquePorteur.SOCIETE
                ? `${t("fiche_porteur.societe", "Société")} — ${fiche.raisonSociale || "?"}`
                : t("fiche_porteur.individuel", "Entrepreneur individuel")}
            </p>
          </div>
          <div className={styles.field}>
            <label>{t("fiche_porteur.annees_experience", "Années d'expérience")}</label>
            <p className={styles.readonlyText}>{fiche.anneesExperience ?? "—"}</p>
          </div>
          {fiche.projetsPrecedentsListe && fiche.projetsPrecedentsListe.length > 0 ? (
            <div className={styles.field}>
              <label>{t("fiche_porteur.projets_precedents", "Projets précédents")}</label>
              <ul className={styles.readonlyText}>
                {fiche.projetsPrecedentsListe.map((p) => (
                  <li key={p.id}>
                    {p.libelle} —{" "}
                    {t(`admin.projects_list.status.${p.statutProjet}`, { defaultValue: p.statutProjet })} (
                    {p.pourcentageFinance}% {t("fiche_porteur.financed_suffix", "financé")})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            fiche.projetsPrecedents && (
              <div className={styles.field}>
                <label>{t("fiche_porteur.projets_precedents", "Projets précédents")}</label>
                <p className={styles.readonlyText}>{fiche.projetsPrecedents}</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
