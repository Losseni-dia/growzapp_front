import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiMapPin, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { useGrowzMarketCart } from "../../components/Context/GrowzMarketCartContext";
import { api, buildFileUrl } from "../../service/Api";
import styles from "./GrowzMarketCartPage.module.css";

interface VendorGroup {
  projetId: number;
  projetLibelle: string;
  pointRetrait: string;
  items: {
    articleId: number;
    nom: string;
    prix: number;
    unite: string;
    photo: string | null;
    quantite: number;
    stock: number | null;
  }[];
  sousTotal: number;
}

export default function GrowzMarketCartPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantite, clearVendorItems } = useGrowzMarketCart();

  const [confirmations, setConfirmations] = useState<Record<number, boolean>>({});
  const [payingVendors, setPayingVendors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const groups = useMemo<VendorGroup[]>(() => {
    const map = new Map<number, VendorGroup>();
    for (const item of items) {
      if (!map.has(item.projetId)) {
        map.set(item.projetId, {
          projetId: item.projetId,
          projetLibelle: item.projetLibelle,
          pointRetrait: item.pointRetrait,
          items: [],
          sousTotal: 0,
        });
      }
      const group = map.get(item.projetId)!;
      group.items.push(item);
      group.sousTotal += item.prix * item.quantite;
    }
    return Array.from(map.values());
  }, [items]);

  const totalGeneral = groups.reduce((sum, g) => sum + g.sousTotal, 0);

  const handlePayer = async () => {
    for (const group of groups) {
      if (!confirmations[group.projetId]) {
        toast.error(
          t(
            "growzmarket.cart.confirmation_required_toast",
            "Confirmez le point de retrait pour {{vendeur}} avant de payer",
            { vendeur: group.projetLibelle },
          ),
        );
        continue;
      }
      setPayingVendors((prev) => ({ ...prev, [group.projetId]: true }));
      try {
        await api.post("/api/market/commandes", {
          lignes: group.items.map((i) => ({ articleId: i.articleId, quantite: i.quantite })),
          confirmationLieuRetrait: true,
        });
        toast.success(
          t("growzmarket.cart.toast_vendor_success", "{{vendeur}} : achat effectué", {
            vendeur: group.projetLibelle,
          }),
        );
        clearVendorItems(group.projetId);
      } catch (err: any) {
        toast.error(
          t("growzmarket.cart.toast_vendor_error", "{{vendeur}} : {{error}}", {
            vendeur: group.projetLibelle,
            error: err.message || "Erreur",
          }),
        );
      } finally {
        setPayingVendors((prev) => ({ ...prev, [group.projetId]: false }));
      }
    }
  };

  const anyPaying = Object.values(payingVendors).some(Boolean);

  if (!user) return null;

  return (
    <div className={styles.container}>
      <Link to="/growzmarket" className={styles.backLink}>
        <FiArrowLeft /> {t("growzmarket.detail.back", "Retour au catalogue")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiShoppingCart /> {t("growzmarket.cart.title", "Mon panier GrowzMarket")}
        </h1>
      </div>

      {groups.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingCart size={48} />
          <p>{t("growzmarket.cart.empty", "Votre panier est vide.")}</p>
          <Link to="/growzmarket" className={styles.btnCatalogue}>
            {t("growzmarket.cart.btn_catalogue", "Découvrir GrowzMarket")}
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.groupList}>
            {groups.map((group) => (
              <div key={group.projetId} className={styles.vendorGroup}>
                <h2 className={styles.vendorTitle}>{group.projetLibelle}</h2>

                {group.items.map((item) => (
                  <div key={item.articleId} className={styles.itemRow}>
                    {item.photo ? (
                      <img src={buildFileUrl(item.photo)} alt={item.nom} className={styles.itemPhoto} />
                    ) : (
                      <div className={styles.itemPhotoPlaceholder} />
                    )}
                    <div className={styles.itemInfo}>
                      <strong>{item.nom}</strong>
                      <span className={styles.itemPrix}>
                        {format(Number(item.prix), "XOF")} / {item.unite}
                      </span>
                    </div>
                    <div className={styles.qteControl}>
                      <button
                        type="button"
                        onClick={() => updateQuantite(item.articleId, item.quantite - 1)}
                      >
                        <FiMinus size={13} />
                      </button>
                      <span>{item.quantite}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantite(item.articleId, item.quantite + 1)}
                      >
                        <FiPlus size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.btnRemove}
                      onClick={() => removeItem(item.articleId)}
                      aria-label={t("growzmarket.cart.btn_remove", "Supprimer")}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}

                <div className={styles.pointRetraitBox}>
                  <p className={styles.pointRetraitLabel}>
                    <FiMapPin size={13} /> {t("growzmarket.cart.point_retrait_title", "Point de retrait")}
                  </p>
                  <p className={styles.pointRetraitValue}>{group.pointRetrait}</p>
                  {group.items.length > 1 && (
                    <p className={styles.pointRetraitHint}>
                      {t(
                        "growzmarket.cart.point_retrait_grouped_hint",
                        "Retrait groupé au point indiqué par le vendeur.",
                      )}
                    </p>
                  )}
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!confirmations[group.projetId]}
                    onChange={(e) =>
                      setConfirmations((prev) => ({ ...prev, [group.projetId]: e.target.checked }))
                    }
                  />
                  {t(
                    "growzmarket.cart.confirmation_label",
                    "Je confirme pouvoir venir retirer cette commande à : {{lieu}}",
                    { lieu: group.pointRetrait },
                  )}
                </label>

                <p className={styles.vendorSousTotal}>
                  {t("growzmarket.cart.vendor_subtotal", "Sous-total")} :{" "}
                  {format(Number(group.sousTotal), "XOF")}
                </p>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.totalGeneral}>
              {t("growzmarket.cart.total_general", "Total général")} : {format(Number(totalGeneral), "XOF")}
            </p>
            <button className={styles.btnPay} onClick={handlePayer} disabled={anyPaying}>
              {anyPaying
                ? t("growzmarket.cart.btn_paying", "Paiement en cours...")
                : t("growzmarket.cart.btn_pay", "Payer")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
