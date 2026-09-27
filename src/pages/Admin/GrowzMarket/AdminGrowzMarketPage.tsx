import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiCheck, FiEye, FiEyeOff, FiFileText, FiGlobe, FiList, FiPackage, FiSearch, FiShoppingBag, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import CommandeMarketTimeline from "../../../components/Commande/CommandeMarketTimeline";
import LitigeThread, { LitigeMessageDTO } from "../../../components/Commande/LitigeThread";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildFileUrl } from "../../../service/Api";
import styles from "./AdminGrowzMarketPage.module.css";

interface ArticleMarketDTO {
  id: number;
  projetId: number;
  projetLibelle: string;
  porteurNom: string | null;
  nom: string;
  description: string;
  prix: number;
  unite: string;
  disponible: boolean;
  stock: number | null;
  categorie: string;
  photos: string[];
  pointRetrait: string;
  statutValidation: string;
  motifRejet: string | null;
}

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
  litigeMessages: LitigeMessageDTO[];
}

type Onglet = "LITIGES" | "TOUTES" | "ARTICLES";

const ENDPOINTS: Record<"LITIGES" | "TOUTES", string> = {
  LITIGES: "/api/admin/market/commandes/litiges",
  TOUTES: "/api/admin/market/commandes/toutes",
};

const STATUT_KEYS: Record<string, string> = {
  PAYEE: "Payée — à préparer",
  PRETE_AU_RETRAIT: "Prête au retrait",
  RETIREE: "Retirée",
  NON_RETIREE: "Non retirée",
  LITIGE: "En litige",
  ANNULEE: "Annulée — remboursée",
};

function statutLabel(t: (key: string, options?: { defaultValue: string }) => string, statut: string): string {
  return t(`admin.growzmarket.statut.${statut}`, { defaultValue: STATUT_KEYS[statut] || statut });
}

export default function AdminGrowzMarketPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [onglet, setOnglet] = useState<Onglet>("TOUTES");
  const [commandes, setCommandes] = useState<CommandeMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [arbitrageId, setArbitrageId] = useState<number | null>(null);
  const [motifArbitrage, setMotifArbitrage] = useState("");

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("ALL");

  const [articles, setArticles] = useState<ArticleMarketDTO[]>([]);
  const [statutArticleFilter, setStatutArticleFilter] = useState<"ALL" | "EN_ATTENTE" | "VALIDE" | "REJETE">("ALL");
  const [rejectArticleId, setRejectArticleId] = useState<number | null>(null);
  const [motifRejetArticle, setMotifRejetArticle] = useState("");
  const [retraducing, setRetraducing] = useState(false);

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

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (statutArticleFilter !== "ALL" && a.statutValidation !== statutArticleFilter) return false;
      if (
        q &&
        !a.nom.toLowerCase().includes(q) &&
        !(a.porteurNom || "").toLowerCase().includes(q) &&
        !a.projetLibelle.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [articles, search, statutArticleFilter]);

  const loadArticles = () => {
    setLoading(true);
    api
      .get<{ data: ArticleMarketDTO[] }>("/api/admin/market/articles")
      .then((res) => setArticles(res.data || []))
      .catch(() => toast.error(t("admin.growzmarket.toast_load_error", "Erreur lors du chargement")))
      .finally(() => setLoading(false));
  };

  const load = () => {
    if (onglet === "ARTICLES") {
      loadArticles();
      return;
    }
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

  const handleToggleDisponibilite = async (article: ArticleMarketDTO) => {
    try {
      await api.post(
        `/api/admin/market/articles/${article.id}/disponibilite?disponible=${!article.disponible}`,
        {},
      );
      toast.success(
        article.disponible
          ? t("admin.growzmarket.toast_article_hidden", "Article masqué du catalogue")
          : t("admin.growzmarket.toast_article_shown", "Article réaffiché dans le catalogue"),
      );
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, disponible: !a.disponible } : a)),
      );
    } catch (err: any) {
      toast.error(err.message || t("admin.growzmarket.toast_error", "Erreur"));
    }
  };

  const handleValiderArticle = async (article: ArticleMarketDTO) => {
    try {
      await api.post(`/api/admin/market/articles/${article.id}/valider`, {});
      toast.success(t("admin.growzmarket.toast_article_valide", "Article validé"));
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, statutValidation: "VALIDE", motifRejet: null } : a)),
      );
    } catch (err: any) {
      toast.error(err.message || t("admin.growzmarket.toast_error", "Erreur"));
    }
  };

  const handleRejeterArticle = async () => {
    if (!rejectArticleId || motifRejetArticle.trim().length < 3) {
      toast.error(t("admin.growzmarket.toast_motif_required", "Le motif est obligatoire"));
      return;
    }
    try {
      await api.post(`/api/admin/market/articles/${rejectArticleId}/rejeter`, { motif: motifRejetArticle });
      toast.success(t("admin.growzmarket.toast_article_rejete", "Article rejeté"));
      setArticles((prev) =>
        prev.map((a) =>
          a.id === rejectArticleId ? { ...a, statutValidation: "REJETE", motifRejet: motifRejetArticle } : a,
        ),
      );
      setRejectArticleId(null);
      setMotifRejetArticle("");
    } catch (err: any) {
      toast.error(err.message || t("admin.growzmarket.toast_error", "Erreur"));
    }
  };

  const handleDeleteArticle = async (article: ArticleMarketDTO) => {
    if (
      !window.confirm(
        t(
          "admin.growzmarket.confirm_delete_article",
          "Supprimer définitivement l'article \"{{nom}}\" ? Cette action est irréversible.",
          { nom: article.nom },
        ) as string,
      )
    )
      return;
    try {
      await api.delete(`/api/admin/market/articles/${article.id}`);
      toast.success(t("admin.growzmarket.toast_article_deleted", "Article supprimé"));
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err: any) {
      toast.error(err.message || t("admin.growzmarket.toast_error", "Erreur"));
    }
  };

  const handleRetraduireArticles = async () => {
    setRetraducing(true);
    try {
      const res = await api.post<{ message?: string }>("/api/admin/market/articles/retraduire-tout", {});
      toast.success(res.message || t("admin.growzmarket.toast_retraduit", "Articles retraduits"));
    } catch (err: any) {
      toast.error(err.message || t("admin.growzmarket.toast_error", "Erreur"));
    } finally {
      setRetraducing(false);
    }
  };

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
        <button
          className={`${styles.tabBtn} ${onglet === "ARTICLES" ? styles.tabBtnActive : ""}`}
          onClick={() => setOnglet("ARTICLES")}
        >
          <FiPackage size={13} /> {t("admin.growzmarket.tab_articles", "Catalogue")}
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchInput}>
          <FiSearch size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              onglet === "ARTICLES"
                ? (t("admin.growzmarket.search_placeholder_articles", "Rechercher par article, porteur, projet...") as string)
                : (t("admin.growzmarket.search_placeholder", "Rechercher par projet, porteur, acheteur...") as string)
            }
          />
        </div>
        {onglet === "TOUTES" && (
          <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
            <option value="ALL">{t("admin.growzmarket.filter_all", "Tous les statuts")}</option>
            {Object.keys(STATUT_KEYS).map((key) => (
              <option key={key} value={key}>
                {statutLabel(t, key)}
              </option>
            ))}
          </select>
        )}
        {onglet === "ARTICLES" && (
          <select value={statutArticleFilter} onChange={(e) => setStatutArticleFilter(e.target.value as any)}>
            <option value="ALL">{t("admin.growzmarket.filter_all", "Tous les statuts")}</option>
            <option value="EN_ATTENTE">{t("admin.growzmarket.article_en_attente", "En attente")}</option>
            <option value="VALIDE">{t("admin.growzmarket.article_valide", "Validé")}</option>
            <option value="REJETE">{t("admin.growzmarket.article_rejete", "Rejeté")}</option>
          </select>
        )}
        {onglet === "ARTICLES" && (
          <button
            className={styles.btnCancel}
            disabled={retraducing}
            onClick={handleRetraduireArticles}
            title={t(
              "admin.growzmarket.retraduire_hint",
              "Retraduit via DeepL le nom et la description de tous les articles déjà publiés (à utiliser une fois après le déploiement)",
            ) as string}
          >
            <FiGlobe size={14} />{" "}
            {retraducing
              ? t("admin.growzmarket.retraduire_loading", "Retraduction…")
              : t("admin.growzmarket.retraduire_articles", "Retraduire les produits (DeepL)")}
          </button>
        )}
      </div>

      {onglet === "ARTICLES" ? (
        loading ? (
          <div className={styles.loading}>{t("dashboard.loading")}</div>
        ) : articles.length === 0 ? (
          <div className={styles.emptyState}>
            <FiPackage size={48} />
            <p>{t("admin.growzmarket.empty_articles", "Aucun article publié pour le moment.")}</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t("admin.growzmarket.no_results", "Aucun résultat pour cette recherche/filtre.")}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredArticles.map((a) => (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {a.photos?.[0] && (
                      <img
                        src={buildFileUrl(a.photos[0])}
                        alt={a.nom}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <strong>{a.nom}</strong>
                      <div className={styles.acheteur}>
                        {a.projetLibelle} — {a.porteurNom}
                      </div>
                    </div>
                  </div>
                  <span className={styles.total}>{format(Number(a.prix), "XOF")}</span>
                </div>
                <span
                  className={styles.badgeStatut}
                  style={
                    a.statutValidation === "EN_ATTENTE"
                      ? { background: "#fff3cd", color: "#8a6d00" }
                      : a.statutValidation === "REJETE"
                      ? { background: "#fde3e3", color: "#a12727" }
                      : !a.disponible
                      ? { background: "#eee", color: "#666" }
                      : undefined
                  }
                >
                  {a.statutValidation === "EN_ATTENTE"
                    ? t("admin.growzmarket.article_en_attente", "En attente")
                    : a.statutValidation === "REJETE"
                    ? t("admin.growzmarket.article_rejete", "Rejeté")
                    : a.disponible
                    ? t("admin.growzmarket.article_disponible", "Disponible")
                    : t("admin.growzmarket.article_masque", "Masqué")}
                </span>
                {a.description && <p className={styles.date}>{a.description}</p>}
                {a.statutValidation === "REJETE" && a.motifRejet && (
                  <p className={styles.motifLitige}>{a.motifRejet}</p>
                )}
                <div className={styles.actions}>
                  {a.statutValidation === "EN_ATTENTE" ? (
                    <>
                      <button className={styles.btnValider} onClick={() => handleValiderArticle(a)}>
                        <FiCheck size={14} /> {t("admin.growzmarket.btn_valider", "Valider")}
                      </button>
                      <button className={styles.btnRejeter} onClick={() => setRejectArticleId(a.id)}>
                        <FiX size={14} /> {t("admin.growzmarket.btn_rejeter", "Rejeter")}
                      </button>
                    </>
                  ) : a.statutValidation === "REJETE" ? (
                    <button className={styles.btnValider} onClick={() => handleValiderArticle(a)}>
                      <FiCheck size={14} /> {t("admin.growzmarket.btn_valider", "Valider")}
                    </button>
                  ) : (
                    <button className={styles.btnValider} onClick={() => handleToggleDisponibilite(a)}>
                      {a.disponible ? <FiEyeOff size={14} /> : <FiEye size={14} />}{" "}
                      {a.disponible
                        ? t("admin.growzmarket.btn_masquer", "Masquer")
                        : t("admin.growzmarket.btn_afficher", "Afficher")}
                    </button>
                  )}
                  <button className={styles.btnRejeter} onClick={() => handleDeleteArticle(a)}>
                    <FiTrash2 size={14} /> {t("admin.growzmarket.btn_supprimer", "Supprimer")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
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
                <span className={styles.badgeStatut}>{statutLabel(t, c.statut)}</span>
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

              {onglet === "LITIGES" && (
                <LitigeThread
                  commandeId={c.id}
                  statut={c.statut}
                  messages={c.litigeMessages || []}
                  apiBase="/api/admin/market/commandes"
                  onSent={load}
                />
              )}

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

      {rejectArticleId !== null && (
        <div className={styles.modalOverlay} onClick={() => setRejectArticleId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("admin.growzmarket.reject_article_title", "Rejeter l'article")}</h2>
            <textarea
              value={motifRejetArticle}
              onChange={(e) => setMotifRejetArticle(e.target.value)}
              placeholder={t("admin.growzmarket.reject_article_placeholder", "Motif du rejet...") as string}
              rows={4}
              maxLength={500}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setRejectArticleId(null)}>
                {t("admin.growzmarket.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnRejeter} onClick={handleRejeterArticle}>
                {t("admin.growzmarket.btn_rejeter", "Rejeter")}
              </button>
            </div>
          </div>
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
