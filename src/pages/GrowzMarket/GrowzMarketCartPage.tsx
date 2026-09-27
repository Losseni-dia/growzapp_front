import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiSmartphone,
  FiTrash2,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/Context/AuthContext";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { useGrowzMarketCart } from "../../components/Context/GrowzMarketCartContext";
import { api, buildFileUrl } from "../../service/Api";
import styles from "./GrowzMarketCartPage.module.css";

type PaymentMethod = "wallet" | "mobile" | "card";

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
  const [methods, setMethods] = useState<Record<number, PaymentMethod>>({});
  const [soldeDisponible, setSoldeDisponible] = useState(0);
  const [loadingSolde, setLoadingSolde] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get<any>("/api/wallets/solde")
      .then((data) => {
        const solde = typeof data === "object" ? (data?.data?.soldeDisponible ?? data?.soldeDisponible ?? 0) : (data ?? 0);
        setSoldeDisponible(Number(solde));
      })
      .catch(() => setSoldeDisponible(0))
      .finally(() => setLoadingSolde(false));
  }, [user]);

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

  const handlePayerGroupe = async (group: VendorGroup) => {
    if (!confirmations[group.projetId]) {
      toast.error(
        t(
          "growzmarket.cart.confirmation_required_toast",
          "Confirmez le point de retrait pour {{vendeur}} avant de payer",
          { vendeur: group.projetLibelle },
        ),
      );
      return;
    }
    const method = methods[group.projetId] || "wallet";
    if (method === "wallet" && group.sousTotal > soldeDisponible) {
      toast.error(t("growzmarket.cart.toast_insufficient_balance", "Solde insuffisant dans votre portefeuille"));
      return;
    }

    setPayingVendors((prev) => ({ ...prev, [group.projetId]: true }));
    const body = {
      lignes: group.items.map((i) => ({ articleId: i.articleId, quantite: i.quantite })),
      confirmationLieuRetrait: true,
    };
    try {
      if (method === "wallet") {
        await api.post("/api/market/commandes", body);
        toast.success(
          t("growzmarket.cart.toast_vendor_success", "{{vendeur}} : achat effectué", {
            vendeur: group.projetLibelle,
          }),
        );
        clearVendorItems(group.projetId);
      } else if (method === "mobile") {
        const response = await api.post<{ redirectUrl: string }>("/api/market/commandes/mobile", body);
        if (response.redirectUrl) {
          clearVendorItems(group.projetId);
          window.location.href = response.redirectUrl;
        } else {
          toast.error(t("growzmarket.cart.toast_redirect_error", "Erreur de redirection Mobile Money"));
        }
      } else {
        const response = await api.post<{ redirectUrl: string }>("/api/market/commandes/carte", body);
        if (response.redirectUrl) {
          clearVendorItems(group.projetId);
          window.location.href = response.redirectUrl;
        } else {
          toast.error(t("growzmarket.cart.toast_redirect_error_card", "Erreur de redirection Stripe"));
        }
      }
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
  };

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

                <p className={styles.methodsLabel}>
                  {t("growzmarket.cart.choose_payment_method", "Moyen de paiement")}
                </p>
                <div className={styles.methods}>
                  <button
                    type="button"
                    onClick={() => setMethods((prev) => ({ ...prev, [group.projetId]: "wallet" }))}
                    className={`${styles.method} ${(methods[group.projetId] || "wallet") === "wallet" ? styles.methodActive : ""}`}
                  >
                    <div className={styles.methodIcon} style={{ background: "#e8f5e9" }}>
                      <FiDollarSign color="#1B5E20" size={18} />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong>{t("growzmarket.cart.method_wallet", "Portefeuille GrowzApp")}</strong>
                      <span>
                        {loadingSolde
                          ? t("dashboard.loading")
                          : `${format(soldeDisponible, "XOF")} ${t("growzmarket.cart.available", "disponible")}`}
                        {!loadingSolde && group.sousTotal > soldeDisponible && (
                          <em className={styles.insufficient}>
                            {" "}
                            — {t("growzmarket.cart.insufficient", "Solde insuffisant")}
                          </em>
                        )}
                      </span>
                    </div>
                    {(methods[group.projetId] || "wallet") === "wallet" && (
                      <FiCheckCircle className={styles.methodCheck} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethods((prev) => ({ ...prev, [group.projetId]: "mobile" }))}
                    className={`${styles.method} ${methods[group.projetId] === "mobile" ? styles.methodActive : ""}`}
                  >
                    <div className={styles.methodIcon} style={{ background: "#fff3e0" }}>
                      <FiSmartphone color="#e65100" size={18} />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong>{t("growzmarket.cart.method_mobile", "Mobile Money")}</strong>
                      <span>Orange Money · MTN MoMo · Wave</span>
                    </div>
                    {methods[group.projetId] === "mobile" && <FiCheckCircle className={styles.methodCheck} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethods((prev) => ({ ...prev, [group.projetId]: "card" }))}
                    className={`${styles.method} ${methods[group.projetId] === "card" ? styles.methodActive : ""}`}
                  >
                    <div className={styles.methodIcon} style={{ background: "#e3f2fd" }}>
                      <FiCreditCard color="#1565c0" size={18} />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong>{t("growzmarket.cart.method_card", "Carte bancaire")}</strong>
                      <span>Visa · Mastercard — Stripe</span>
                    </div>
                    {methods[group.projetId] === "card" && <FiCheckCircle className={styles.methodCheck} />}
                  </button>
                </div>

                <button
                  className={styles.btnPayGroup}
                  onClick={() => handlePayerGroupe(group)}
                  disabled={!!payingVendors[group.projetId]}
                >
                  {payingVendors[group.projetId]
                    ? t("growzmarket.cart.btn_paying", "Paiement en cours...")
                    : t("growzmarket.cart.btn_pay_vendor", "Payer {{montant}}", {
                        montant: format(Number(group.sousTotal), "XOF"),
                      })}
                </button>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.totalGeneral}>
              {t("growzmarket.cart.total_general", "Total général")} : {format(Number(totalGeneral), "XOF")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
