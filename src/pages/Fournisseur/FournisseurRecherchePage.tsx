import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiMapPin, FiSearch, FiTruck } from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../../service/Api";
import styles from "./FournisseurRecherchePage.module.css";

interface FournisseurDTO {
  id: number;
  nomContact: string;
  raisonSociale: string | null;
  secteurNom: string | null;
  ville: string;
  pays: string;
  description: string | null;
}

export default function FournisseurRecherchePage() {
  const { t } = useTranslation();

  const [fournisseurs, setFournisseurs] = useState<FournisseurDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("");

  const search = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ville.trim()) params.set("ville", ville.trim());
    if (pays.trim()) params.set("pays", pays.trim());
    api
      .get<{ data: FournisseurDTO[] }>(`/api/fournisseurs?${params.toString()}`)
      .then((res) => setFournisseurs(res.data || []))
      .catch(() => toast.error(t("fournisseur.recherche.toast_error", "Erreur lors de la recherche")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiTruck /> {t("fournisseur.recherche.title", "Trouver un fournisseur")}
        </h1>
        <p>{t("fournisseur.recherche.subtitle", "Commandez du matériel ou des services pour vos projets — paiement direct et sécurisé.")}</p>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder={t("fournisseur.recherche.field_ville", "Ville") as string}
        />
        <input
          type="text"
          value={pays}
          onChange={(e) => setPays(e.target.value)}
          placeholder={t("fournisseur.recherche.field_pays", "Pays") as string}
        />
        <button className={styles.btnSearch} onClick={search}>
          <FiSearch /> {t("fournisseur.recherche.btn_search", "Rechercher")}
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : fournisseurs.length === 0 ? (
        <div className={styles.emptyState}>
          <FiTruck size={48} />
          <p>{t("fournisseur.recherche.empty", "Aucun fournisseur trouvé pour ces critères.")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {fournisseurs.map((f) => (
            <Link key={f.id} to={`/fournisseurs/${f.id}`} className={styles.card}>
              <h3>{f.raisonSociale || f.nomContact}</h3>
              <p className={styles.secteur}>{f.secteurNom}</p>
              <p className={styles.location}>
                <FiMapPin size={14} /> {f.ville}, {f.pays}
              </p>
              {f.description && <p className={styles.description}>{f.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
