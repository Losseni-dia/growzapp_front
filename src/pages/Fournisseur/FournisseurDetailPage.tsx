import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiMapPin, FiMinus, FiPlus, FiShoppingCart, FiTruck } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api } from "../../service/Api";
import styles from "./FournisseurDetailPage.module.css";

interface FournisseurDTO {
  id: number;
  nomContact: string;
  raisonSociale: string | null;
  secteurNom: string | null;
  ville: string;
  pays: string;
  telephone: string | null;
  email: string | null;
  description: string | null;
}

interface ArticleDTO {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  unite: string;
}

interface PorteurProjetLigneDTO {
  projetId: number;
  projetLibelle: string;
  statutProjet: string;
  soldeDisponibleWallet: number;
}

export default function FournisseurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [fournisseur, setFournisseur] = useState<FournisseurDTO | null>(null);
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [projets, setProjets] = useState<PorteurProjetLigneDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantites, setQuantites] = useState<Record<number, number>>({});
  const [projetId, setProjetId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<{ data: FournisseurDTO }>(`/api/fournisseurs/${id}`),
      api.get<{ data: ArticleDTO[] }>(`/api/fournisseurs/${id}/articles`),
      api
        .get<{ data: { projets: PorteurProjetLigneDTO[] } }>("/api/projets/mes-projets/dashboard-porteur")
        .catch(() => ({ data: { projets: [] } })),
    ])
      .then(([fRes, artRes, dashRes]) => {
        setFournisseur(fRes.data);
        setArticles(artRes.data || []);
        setProjets(dashRes.data?.projets || []);
      })
      .catch(() => toast.error(t("fournisseur.detail.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const setQte = (articleId: number, delta: number) => {
    setQuantites((prev) => {
      const current = prev[articleId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [articleId]: next };
    });
  };

  const lignesSelectionnees = articles
    .filter((a) => (quantites[a.id] || 0) > 0)
    .map((a) => ({ article: a, quantite: quantites[a.id] }));

  const total = lignesSelectionnees.reduce((sum, l) => sum + l.article.prix * l.quantite, 0);

  const handleCommander = async () => {
    if (!projetId) {
      toast.error(t("fournisseur.detail.toast_no_projet", "Sélectionnez le projet concerné"));
      return;
    }
    if (lignesSelectionnees.length === 0) {
      toast.error(t("fournisseur.detail.toast_no_article", "Sélectionnez au moins un article"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/commandes", {
        projetId,
        fournisseurId: Number(id),
        lignes: lignesSelectionnees.map((l) => ({ articleId: l.article.id, quantite: l.quantite })),
      });
      toast.success(t("fournisseur.detail.toast_sent", "Commande envoyée, en attente de validation par l'équipe GrowzApp"));
      navigate("/mes-commandes");
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.detail.toast_error", "Erreur lors de la commande"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  if (!fournisseur) {
    return (
      <div className={styles.container}>
        <Link to="/fournisseurs" className={styles.backLink}>
          <FiArrowLeft /> {t("fournisseur.detail.back", "Retour")}
        </Link>
        <div className={styles.emptyState}>
          <p>{t("fournisseur.detail.not_found", "Fournisseur introuvable.")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/fournisseurs" className={styles.backLink}>
        <FiArrowLeft /> {t("fournisseur.detail.back", "Retour")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiTruck /> {fournisseur.raisonSociale || fournisseur.nomContact}
        </h1>
        <p className={styles.secteur}>{fournisseur.secteurNom}</p>
        <p className={styles.location}>
          <FiMapPin size={14} /> {fournisseur.ville}, {fournisseur.pays}
        </p>
        {fournisseur.description && <p className={styles.description}>{fournisseur.description}</p>}
      </div>

      <h2 className={styles.sectionTitle}>{t("fournisseur.detail.catalogue_title", "Catalogue")}</h2>

      {articles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.detail.catalogue_empty", "Ce fournisseur n'a pas encore d'articles disponibles.")}</p>
        </div>
      ) : (
        <div className={styles.articleGrid}>
          {articles.map((a) => (
            <div key={a.id} className={styles.articleCard}>
              <strong>{a.nom}</strong>
              {a.description && <p className={styles.articleDesc}>{a.description}</p>}
              <p className={styles.articlePrix}>
                {format(Number(a.prix), "XOF")} / {a.unite}
              </p>
              <div className={styles.qteControl}>
                <button type="button" onClick={() => setQte(a.id, -1)}>
                  <FiMinus size={14} />
                </button>
                <span>{quantites[a.id] || 0}</span>
                <button type="button" onClick={() => setQte(a.id, 1)}>
                  <FiPlus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lignesSelectionnees.length > 0 && (
        <div className={styles.cartBar}>
          <div className={styles.cartInfo}>
            <FiShoppingCart />
            <span>
              {t("fournisseur.detail.cart_total", "Total : {{amount}}", { amount: format(total, "XOF") })}
            </span>
          </div>
          <select
            value={projetId}
            onChange={(e) => setProjetId(e.target.value ? Number(e.target.value) : "")}
            className={styles.projetSelect}
          >
            <option value="">{t("fournisseur.detail.select_projet", "Choisir le projet...")}</option>
            {projets.map((p) => (
              <option key={p.projetId} value={p.projetId}>
                {p.projetLibelle} ({format(Number(p.soldeDisponibleWallet), "XOF")}{" "}
                {t("fournisseur.detail.disponible", "disponible")})
              </option>
            ))}
          </select>
          <button className={styles.btnCommander} onClick={handleCommander} disabled={submitting}>
            {submitting
              ? t("fournisseur.detail.btn_sending", "Envoi...")
              : t("fournisseur.detail.btn_commander", "Commander")}
          </button>
        </div>
      )}
    </div>
  );
}
