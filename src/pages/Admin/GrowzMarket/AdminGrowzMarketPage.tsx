import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiFileText, FiList, FiSearch, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";
import CommandeMarketTimeline from "../../../components/Commande/CommandeMarketTimeline";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api } from "../../../service/Api";
import styles from "./AdminGrowzMarketPage.module.css";

interface CommandeMarketLigneDTO {
  id: number;
  libelle: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

interface CommandeMarketDTO {
  id: number;
  projetId: number;
  projetLibelle: string;
  porteurNom: string | null;
  acheteurId: number;
  acheteurNom: string;
  montantTotal: number;
  statut: string;
  confirmationLieuRetrait: boolean;
  dateCommande: string;
  datePrete: string | null;
  dateRetraitConfirme: string | null;
  motifLitige: string | null;
  factureUrl: string | null;
  lignes: CommandeMarketLigneDTO[];
}

type Onglet = "LITIGES" | "TOUTES";

const ENDPOINTS: Record<Onglet, string> = {
  LITIGES: "/api/admin/market/commandes/litiges",
  TOUTES: "/api/admin/market/commandes/toutes",
};

const STATUT_LABELS: Record<string, string> = {
  PAYEE: "Payée — à préparer",
  PRETE_AU_RETRAIT: "Prête au retrait",
  RETIREE: "Retirée",
  NON_RETIREE: "Non retirée",
  LITIGE: "En litige",
  ANNULEE: "Annulée — remboursée",
};

export default function AdminGrowzMarketPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [onglet, setOnglet] = useState<Onglet>("LITIGES");
  const [commandes, setCommandes] = useState<CommandeMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [arbitrageId, setArbitrageId] = useState<number | null>(null);
  const [motifArbitrage, setMotifArbitrage] = useState("");

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("ALL");

  const filteredCommandes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commandes.filter((c) => {
      if (onglet === "TOUTES" && statutFilter !== "ALL" && c.statut !== statutFilter) return false;
      if (
        q &&
        !c.projetLibelle.toLowerCase().includes(q) &&
        !(c.porteurNom || "").toLowerCase().includes(q) &&
        !c.acheteurNom.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [commandes, search, statutFilter, onglet]);

  const load = () => {
    setLoading(true);
    api
      .get<{ data: CommandeMarketDTO[] }>(ENDPOINTS[onglet])
      .then((res) => setCommandes(res.data || []))
      .catch(() => toast.error(t("admin.growzmarket.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet]);

  const handleArbitrer = async (enFaveurDuVendeur: boolean) => {
    if (!arbitrageId || motifArbitrage.trim().length < 3) {
      toast.error(t("admin.growzmarket.toast_motif_required", "Le motif est obligatoire"));
      return;
    }
    try {
      await api.post(
        `/api/admin/market/commandes/${arbitrageId}/arbitrer?enFaveurDuVendeur=${enFaveurDuVendeur}`,
        { motif: motifArbitrage },
      );
      toast.success(t("admin.growzmarket.toast_arbitrated", "Litige arbitré"));
      setCommandes((prev) => prev.filter((c) => c.id !== arbitrageId));
      setArbitrageId(null);
      setMotifArbitrage("");
    } catch (err: any) {
      toast.error(err.message || t("admin.growzmarket.toast_error", "Erreur"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiShoppingBag /> {t("admin.growzmarket.title", "GrowzMarket")}
        </h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${onglet === "LITIGES" ? styles.tabBtnActive : ""}`}
          onClick={() => setOnglet("LITIGES")}
        >
          {t("admin.growzmarket.tab_litiges", "Litiges")}
        </button>
        <button
          className={`${styles.tabBtn} ${onglet === "TOUTES" ? styles.tabBtnActive : ""}`}
          onClick={() => setOnglet("TOUTES")}
        >
          <FiList size={13} /> {t("admin.growzmarket.tab_toutes", "Toutes / historique")}
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchInput}>
          <FiSearch size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.growzmarket.search_placeholder", "Rechercher par projet, porteur, acheteur...") as string}
          />
        </div>
        {onglet === "TOUTES" && (
          <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
            <option value="ALL">{t("admin.growzmarket.filter_all", "Tous les statuts")}</option>
            {Object.entries(STATUT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>{t("admin.growzmarket.empty", "Rien à traiter ici pour le moment.")}</p>
        </div>
      ) : filteredCommandes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("admin.growzmarket.no_results", "Aucun résultat pour cette recherche/filtre.")}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredCommandes.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <strong>{c.projetLibelle}</strong>
                  <span className={styles.acheteur}> → {c.acheteurNom}</span>
                </div>
                <span className={styles.total}>{format(Number(c.montantTotal), "XOF")}</span>
              </div>
              {onglet === "TOUTES" && (
                <span className={styles.badgeStatut}>{STATUT_LABELS[c.statut] || c.statut}</span>
              )}
              <p className={styles.date}>{formatDate(new Date(c.dateCommande), "dd MMM yyyy", { locale: fr })}</p>
              <ul className={styles.lignes}>
                {c.lignes.map((l) => (
                  <li key={l.id}>
                    {l.quantite} × {l.libelle} — {format(Number(l.sousTotal), "XOF")}
                  </li>
                ))}
              </ul>

              <CommandeMarketTimeline commande={c} />

              {onglet === "LITIGES" && c.motifLitige && <p className={styles.motifLitige}>{c.motifLitige}</p>}

              {c.factureUrl && (
                <Link to={`/growzmarket/commandes/${c.id}/facture`} className={styles.btnFacture}>
                  <FiFileText size={14} /> {t("admin.growzmarket.btn_facture", "Voir la facture")}
                </Link>
              )}

              {onglet === "LITIGES" && (
                <div className={styles.actions}>
                  <button className={styles.btnValider} onClick={() => setArbitrageId(c.id)}>
                    {t("admin.growzmarket.btn_arbitrate", "Arbitrer")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {arbitrageId !== null && (
        <div className={styles.modalOverlay} onClick={() => setArbitrageId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.growzmarket.arbitrate_title", "Arbitrer le litige")}</h2>
            <textarea
              value={motifArbitrage}
              onChange={(e) => setMotifArbitrage(e.target.value)}
              placeholder={t("admin.growzmarket.arbitrate_placeholder", "Motif de la décision...") as string}
              rows={4}
              maxLength={1000}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setArbitrageId(null)}>
                {t("admin.growzmarket.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnRejeter} onClick={() => handleArbitrer(false)}>
                {t("admin.growzmarket.btn_favor_acheteur", "En faveur de l'acheteur (remboursé)")}
              </button>
              <button className={styles.btnValider} onClick={() => handleArbitrer(true)}>
                {t("admin.growzmarket.btn_favor_vendeur", "En faveur du vendeur")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
