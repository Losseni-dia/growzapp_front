import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiMinus,
  FiPhone,
  FiPlus,
  FiShoppingBag,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { useGrowzMarketCart } from "../../components/Context/GrowzMarketCartContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api, buildFileUrl } from "../../service/Api";
import styles from "./GrowzMarketDetailPage.module.css";

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

export default function GrowzMarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { addItem } = useGrowzMarketCart();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleMarketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [quantite, setQuantite] = useState(1);
  const [confirmationLieu, setConfirmationLieu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: ArticleMarketDTO }>(`/api/market/articles/${id}`)
      .then((res) => setArticle({ ...res.data, photos: res.data.photos || [] }))
      .catch(() => toast.error(t("growzmarket.detail.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleAjouterAuPanier = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!article) return;
    addItem(
      {
        articleId: article.id,
        nom: article.nom,
        prix: article.prix,
        unite: article.unite,
        photo: article.photos[0] || null,
        projetId: article.projetId,
        projetLibelle: article.projetLibelle,
        pointRetrait: article.pointRetrait,
        stock: article.stock,
      },
      quantite,
    );
  };

  const handleAcheter = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!article) return;
    if (!confirmationLieu) {
      toast.error(
        t(
          "growzmarket.detail.toast_confirmation_required",
          "Vous devez confirmer pouvoir venir retirer la commande au point indiqué",
        ),
      );
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/market/commandes", {
        lignes: [{ articleId: article.id, quantite }],
        confirmationLieuRetrait: confirmationLieu,
      });
      toast.success(
        t("growzmarket.detail.toast_bought", "Achat effectué — le vendeur va préparer votre commande."),
      );
      navigate("/mon-espace/mes-achats-market");
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.detail.toast_error", "Erreur lors de l'achat"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  if (!article) {
    return (
      <div className={styles.container}>
        <Link to="/growzmarket" className={styles.backLink}>
          <FiArrowLeft /> {t("growzmarket.detail.back", "Retour au catalogue")}
        </Link>
        <div className={styles.emptyState}>
          <p>{t("growzmarket.detail.not_found", "Article introuvable.")}</p>
        </div>
      </div>
    );
  }

  const stockInsuffisant = article.stock !== null && quantite > article.stock;

  return (
    <div className={styles.container}>
      <Link to="/growzmarket" className={styles.backLink}>
        <FiArrowLeft /> {t("growzmarket.detail.back", "Retour au catalogue")}
      </Link>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          {article.photos.length > 0 ? (
            <>
              <img
                src={buildFileUrl(article.photos[activePhoto])}
                alt={article.nom}
                className={styles.mainPhoto}
              />
              {article.photos.length > 1 && (
                <div className={styles.thumbRow}>
                  {article.photos.map((p, idx) => (
                    <img
                      key={p}
                      src={buildFileUrl(p)}
                      alt=""
                      className={`${styles.thumb} ${idx === activePhoto ? styles.thumbActive : ""}`}
                      onClick={() => setActivePhoto(idx)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.photoPlaceholder}>
              <FiShoppingBag size={48} />
            </div>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.badgeCategorie}>
            {t(`growzmarket.categorie.${article.categorie}`, article.categorie)}
          </span>
          <h1>{article.nom}</h1>
          <p className={styles.vendeur}>
            {t("growzmarket.detail.sold_by", "Vendu par")} <strong>{article.projetLibelle}</strong>
            {article.porteurNom && ` — ${article.porteurNom}`}
          </p>

          {article.description && <p className={styles.description}>{article.description}</p>}

          <p className={styles.prix}>
            {format(Number(article.prix), "XOF")} / {article.unite}
          </p>

          {article.delaiPreparation && (
            <p className={styles.infoLine}>
              <FiClock size={14} /> {article.delaiPreparation}
            </p>
          )}

          <div className={styles.pointRetraitBox}>
            <p className={styles.pointRetraitLabel}>
              <FiMapPin size={14} /> {t("growzmarket.detail.point_retrait_title", "Point de retrait")}
            </p>
            <p className={styles.pointRetraitValue}>{article.pointRetrait}</p>
            {article.telephoneContact && (
              <p className={styles.infoLine}>
                <FiPhone size={13} /> {article.telephoneContact}
              </p>
            )}
            <p className={styles.pointRetraitHint}>
              {t(
                "growzmarket.detail.point_retrait_hint",
                "Pas de livraison à domicile pour le moment — la commande doit être récupérée à cette adresse.",
              )}
            </p>
          </div>

          {article.stock !== null && (
            <p className={styles.stockInfo}>
              {t("growzmarket.detail.stock_restant", "{{count}} en stock", { count: article.stock })}
            </p>
          )}

          <div className={styles.qteControl}>
            <button type="button" onClick={() => setQuantite((q) => Math.max(1, q - 1))}>
              <FiMinus size={14} />
            </button>
            <span>{quantite}</span>
            <button type="button" onClick={() => setQuantite((q) => q + 1)}>
              <FiPlus size={14} />
            </button>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={confirmationLieu}
              onChange={(e) => setConfirmationLieu(e.target.checked)}
            />
            {t(
              "growzmarket.detail.confirmation_label",
              "Je confirme pouvoir venir retirer cette commande à : {{lieu}}",
              { lieu: article.pointRetrait },
            )}
          </label>

          {stockInsuffisant && (
            <p className={styles.stockWarning}>
              {t("growzmarket.detail.stock_insuffisant", "Quantité supérieure au stock disponible.")}
            </p>
          )}

          <div className={styles.actionsRow}>
            <button
              className={styles.btnAddToCart}
              onClick={handleAjouterAuPanier}
              disabled={!user ? false : stockInsuffisant || !article.disponible}
            >
              {t("growzmarket.detail.btn_add_to_cart", "Ajouter au panier")}
            </button>
            <button
              className={styles.btnAcheter}
              onClick={handleAcheter}
              disabled={user ? submitting || !confirmationLieu || stockInsuffisant || !article.disponible : false}
            >
              {!user
                ? t("growzmarket.detail.btn_login_to_buy", "Se connecter pour acheter")
                : submitting
                  ? t("growzmarket.detail.btn_buying", "Achat en cours...")
                  : t("growzmarket.detail.btn_buy", "Acheter — {{amount}}", {
                      amount: format(Number(article.prix) * quantite, "XOF"),
                    })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
