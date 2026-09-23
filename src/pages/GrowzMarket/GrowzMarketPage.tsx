import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiSearch, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api, buildFileUrl } from "../../service/Api";
import styles from "./GrowzMarketPage.module.css";

interface ArticleMarketDTO {
  id: number;
  projetId: number;
  projetLibelle: string;
  porteurNom: string | null;
  nom: string;
  description: string | null;
  prix: number;
  unite: string;
  disponible: boolean;
  stock: number | null;
  categorie: string;
  delaiPreparation: string | null;
  photos: string[];
  pointRetrait: string;
  telephoneContact: string | null;
}

const CATEGORIES = ["ALIMENTATION", "ARTISANAT", "TEXTILE", "COSMETIQUE", "AGRICULTURE", "SERVICE", "AUTRE"];

export default function GrowzMarketPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [articles, setArticles] = useState<ArticleMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("ALL");

  useEffect(() => {
    api
      .get<{ data: ArticleMarketDTO[] }>("/api/market/articles")
      .then((res) => setArticles(res.data || []))
      .catch(() => toast.error(t("growzmarket.catalogue.toast_error", "Erreur lors du chargement du catalogue")))
      .finally(() => setLoading(false));
  }, [t]);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (categorieFilter !== "ALL" && a.categorie !== categorieFilter) return false;
      if (q && !a.nom.toLowerCase().includes(q) && !(a.description || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [articles, search, categorieFilter]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiShoppingBag /> {t("growzmarket.catalogue.title", "GrowzMarket")}
        </h1>
        <p>
          {t(
            "growzmarket.catalogue.subtitle",
            "Les produits et services des porteurs de projets GrowzApp — paiement par wallet, retrait chez le vendeur.",
          )}
        </p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchInput}>
          <FiSearch size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("growzmarket.catalogue.search_placeholder", "Rechercher un produit ou service...") as string}
          />
        </div>
        <select value={categorieFilter} onChange={(e) => setCategorieFilter(e.target.value)}>
          <option value="ALL">{t("growzmarket.catalogue.filter_all", "Toutes les catégories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`growzmarket.categorie.${c}`, c)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : articles.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>{t("growzmarket.catalogue.empty", "Aucun produit disponible pour le moment.")}</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("growzmarket.catalogue.no_results", "Aucun résultat pour cette recherche/filtre.")}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredArticles.map((a) => (
            <Link key={a.id} to={`/growzmarket/${a.id}`} className={styles.card}>
              {(a.photos || []).length > 0 ? (
                <img src={buildFileUrl(a.photos[0])} alt={a.nom} className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <FiShoppingBag size={28} />
                </div>
              )}
              <span className={styles.badgeCategorie}>{t(`growzmarket.categorie.${a.categorie}`, a.categorie)}</span>
              <h3>{a.nom}</h3>
              <p className={styles.vendeur}>{a.projetLibelle}</p>
              <p className={styles.prix}>
                {format(Number(a.prix), "XOF")} / {a.unite}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
