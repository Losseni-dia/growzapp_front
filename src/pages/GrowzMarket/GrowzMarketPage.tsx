import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiMinus, FiPlus, FiSearch, FiShoppingBag, FiShoppingCart, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { useGrowzMarketCart } from "../../components/Context/GrowzMarketCartContext";
import { api, buildFileUrl, buildProjetUrl } from "../../service/Api";
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
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useGrowzMarketCart();

  const [articles, setArticles] = useState<ArticleMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("ALL");
  const [quickBuyArticle, setQuickBuyArticle] = useState<ArticleMarketDTO | null>(null);
  const [quickBuyQuantite, setQuickBuyQuantite] = useState(1);

  useEffect(() => {
    api
      .get<{ data: ArticleMarketDTO[] }>(buildProjetUrl("/api/market/articles"))
      .then((res) => setArticles(res.data || []))
      .catch(() => toast.error(t("growzmarket.catalogue.toast_error", "Erreur lors du chargement du catalogue")))
      .finally(() => setLoading(false));
  }, [t, i18n.language]);

  const openQuickBuy = (e: React.MouseEvent, article: ArticleMarketDTO) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    setQuickBuyQuantite(1);
    setQuickBuyArticle(article);
  };

  const confirmQuickBuy = () => {
    if (!quickBuyArticle) return;
    addItem(
      {
        articleId: quickBuyArticle.id,
        nom: quickBuyArticle.nom,
        prix: quickBuyArticle.prix,
        unite: quickBuyArticle.unite,
        photo: quickBuyArticle.photos[0] || null,
        projetId: quickBuyArticle.projetId,
        projetLibelle: quickBuyArticle.projetLibelle,
        pointRetrait: quickBuyArticle.pointRetrait,
        stock: quickBuyArticle.stock,
      },
      quickBuyQuantite,
    );
    setQuickBuyArticle(null);
  };

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
            <div key={a.id} className={styles.card}>
              <Link to={`/growzmarket/${a.id}`} className={styles.cardLink}>
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
                {a.stock !== null && (
                  <p className={`${styles.stockInfo} ${a.stock <= 5 ? styles.stockLow : ""}`}>
                    {a.stock === 0
                      ? t("growzmarket.catalogue.rupture_stock", "Rupture de stock")
                      : t("growzmarket.catalogue.stock_disponible", "{{stock}} en stock", { stock: a.stock })}
                  </p>
                )}
              </Link>
              <button
                type="button"
                className={styles.btnAcheter}
                onClick={(e) => openQuickBuy(e, a)}
                disabled={!a.disponible || a.stock === 0}
              >
                <FiShoppingCart size={14} />
                {t("growzmarket.catalogue.btn_buy", "Acheter")}
              </button>
            </div>
          ))}
        </div>
      )}

      {quickBuyArticle && (
        <div className={styles.modalOverlay} onClick={() => setQuickBuyArticle(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setQuickBuyArticle(null)} aria-label="Fermer">
              <FiX size={18} />
            </button>
            <h3>{quickBuyArticle.nom}</h3>
            <p className={styles.modalVendeur}>{quickBuyArticle.projetLibelle}</p>
            <p className={styles.modalPrix}>
              {format(Number(quickBuyArticle.prix), "XOF")} / {quickBuyArticle.unite}
            </p>
            <div className={styles.modalQteRow}>
              <span>{t("growzmarket.catalogue.quantite", "Quantité")}</span>
              <div className={styles.qteControl}>
                <button
                  type="button"
                  onClick={() => setQuickBuyQuantite((q) => Math.max(1, q - 1))}
                >
                  <FiMinus size={13} />
                </button>
                <span>{quickBuyQuantite}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuickBuyQuantite((q) =>
                      quickBuyArticle.stock != null ? Math.min(quickBuyArticle.stock, q + 1) : q + 1,
                    )
                  }
                >
                  <FiPlus size={13} />
                </button>
              </div>
            </div>
            {quickBuyArticle.stock != null && (
              <p className={styles.modalStock}>
                {t("growzmarket.catalogue.stock_disponible", "{{stock}} en stock", { stock: quickBuyArticle.stock })}
              </p>
            )}
            <p className={styles.modalTotal}>
              {t("growzmarket.catalogue.total", "Total")} : {format(Number(quickBuyArticle.prix) * quickBuyQuantite, "XOF")}
            </p>
            <button type="button" className={styles.btnConfirmBuy} onClick={confirmQuickBuy}>
              {t("growzmarket.catalogue.btn_add_cart", "Ajouter au panier")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
