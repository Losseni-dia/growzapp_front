import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiClock, FiEdit2, FiTruck, FiXCircle } from "react-icons/fi";
import { Link, Outlet, useOutletContext } from "react-router-dom";
import { api } from "../../../service/Api";
import styles from "./FournisseurEspace.module.css";

export interface FournisseurDTO {
  id: number;
  statutJuridique: string | null;
  raisonSociale: string | null;
  secteurNom: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  description: string | null;
  statut: "BROUILLON" | "EN_ATTENTE" | "VALIDE" | "REJETE";
  motifRejet: string | null;
  logoUrl: string | null;
}

export interface FournisseurEspaceContext {
  fournisseur: FournisseurDTO;
  reload: () => void;
}

export function useFournisseurEspace() {
  return useOutletContext<FournisseurEspaceContext>();
}

export default function FournisseurEspaceLayout() {
  const { t } = useTranslation();
  const [fournisseur, setFournisseur] = useState<FournisseurDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const fRes = await api.get<{ data: FournisseurDTO }>("/api/fournisseurs/moi");
      setFournisseur(fRes.data);
    } catch {
      setFournisseur(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  if (!fournisseur) {
    return (
      <div className={styles.container}>
        <Link to="/mon-espace" className={styles.backLink}>
          <FiArrowLeft /> {t("my_profile")}
        </Link>
        <div className={styles.emptyState}>
          <FiTruck size={48} />
          <p>{t("fournisseur.espace.no_fiche", "Vous n'êtes pas encore inscrit comme fournisseur.")}</p>
          <Link to="/devenir-fournisseur" className={styles.btnSubmit}>
            {t("fournisseur.espace.btn_register", "Devenir fournisseur")}
          </Link>
        </div>
      </div>
    );
  }

  if (fournisseur.statut === "BROUILLON") {
    return (
      <div className={styles.container}>
        <Link to="/mon-espace" className={styles.backLink}>
          <FiArrowLeft /> {t("my_profile")}
        </Link>
        <div className={styles.emptyState}>
          <FiEdit2 size={48} />
          <p>
            {t(
              "fournisseur.espace.status_draft",
              "Votre fiche fournisseur est en brouillon — terminez-la pour la soumettre.",
            )}
          </p>
          <Link to="/devenir-fournisseur" className={styles.btnSubmit}>
            {t("fournisseur.espace.btn_continue_draft", "Continuer mon inscription")}
          </Link>
        </div>
      </div>
    );
  }

  if (fournisseur.statut !== "VALIDE") {
    return (
      <div className={styles.container}>
        <Link to="/mon-espace" className={styles.backLink}>
          <FiArrowLeft /> {t("my_profile")}
        </Link>
        <div className={styles.emptyState}>
          {fournisseur.statut === "EN_ATTENTE" ? (
            <>
              <FiClock size={48} />
              <p>
                {t(
                  "fournisseur.espace.status_pending",
                  "Votre inscription est en attente de validation par l'équipe GrowzApp.",
                )}
              </p>
            </>
          ) : (
            <>
              <FiXCircle size={48} />
              <p>{t("fournisseur.espace.status_rejected", "Votre inscription a été rejetée.")}</p>
              {fournisseur.motifRejet && <p className={styles.motif}>{fournisseur.motifRejet}</p>}
              <Link to="/devenir-fournisseur" className={styles.btnSubmit}>
                {t("fournisseur.espace.btn_edit_and_resubmit", "Corriger et resoumettre")}
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiTruck /> {fournisseur.raisonSociale || t("fournisseur.espace.title", "Mon espace fournisseur")}
        </h1>
      </div>

      <Outlet context={{ fournisseur, reload: load } satisfies FournisseurEspaceContext} />
    </div>
  );
}
