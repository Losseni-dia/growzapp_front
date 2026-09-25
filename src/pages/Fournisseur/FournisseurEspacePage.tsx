import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiImage,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import CommandeTimeline from "../../components/Commande/CommandeTimeline";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api, buildFileUrl } from "../../service/Api";
import styles from "./FournisseurEspacePage.module.css";

interface FournisseurDTO {
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

interface ArticleDTO {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  unite: string;
  disponible: boolean;
  stock: number | null;
  photoUrl: string | null;
}

interface CommandeDTO {
  id: number;
  projetLibelle: string;
  montantTotal: number;
  statut: string;
  dateCommande: string;
  dateValidationAdmin: string | null;
  dateAcceptation: string | null;
  dateExpedition: string | null;
  dateConfirmationReception: string | null;
  datePaiement: string | null;
  motifRejet: string | null;
  motifRefus: string | null;
  motifLitige: string | null;
  factureUrl: string | null;
}

const STATUT_KEYS: Record<string, string> = {
  EN_ATTENTE_VALIDATION: "En attente de validation admin",
  REJETEE: "Rejetée",
  EN_ATTENTE_ACCEPTATION: "À accepter",
  REFUSEE: "Refusée",
  ACCEPTEE: "Acceptée — à expédier",
  EXPEDIEE: "Expédiée",
  LITIGE: "En litige",
  ANNULEE: "Annulée",
  LIVREE: "Livrée — en attente de paiement",
  PAYEE: "Payée",
};

function statutLabel(t: any, statut: string): string {
  return t(`fournisseur.espace.statut.${statut}`, STATUT_KEYS[statut] || statut);
}

export default function FournisseurEspacePage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [fournisseur, setFournisseur] = useState<FournisseurDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [commandes, setCommandes] = useState<CommandeDTO[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [unite, setUnite] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [stock, setStock] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      const [fRes] = await Promise.all([api.get<{ data: FournisseurDTO }>("/api/fournisseurs/moi")]);
      setFournisseur(fRes.data);
      if (fRes.data.statut === "VALIDE") {
        const [artRes, cmdRes] = await Promise.all([
          api.get<{ data: ArticleDTO[] }>("/api/fournisseurs/moi/articles"),
          api.get<{ data: CommandeDTO[] }>("/api/commandes/recues"),
        ]);
        setArticles(artRes.data || []);
        setCommandes(cmdRes.data || []);
      }
    } catch {
      // Pas de fiche fournisseur pour ce compte — géré par le rendu ci-dessous
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNom("");
    setDescription("");
    setPrix("");
    setUnite("");
    setDisponible(true);
    setStock("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(false);
  };

  const openEdit = (a: ArticleDTO) => {
    setEditingId(a.id);
    setNom(a.nom);
    setDescription(a.description || "");
    setPrix(String(a.prix));
    setUnite(a.unite);
    setDisponible(a.disponible);
    setStock(a.stock !== null ? String(a.stock) : "");
    setPhotoFile(null);
    setPhotoPreview(a.photoUrl ? buildFileUrl(a.photoUrl) : null);
    setShowForm(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const prixNum = parseFloat(prix.replace(",", "."));
    if (nom.trim().length < 2 || !unite.trim() || isNaN(prixNum) || prixNum <= 0) {
      toast.error(t("fournisseur.espace.toast_article_validation", "Nom, prix (positif) et unité sont obligatoires"));
      return;
    }
    setSaving(true);
    try {
      const stockNum = stock.trim() === "" ? null : parseInt(stock, 10);
      const formData = new FormData();
      formData.append(
        "article",
        new Blob(
          [JSON.stringify({ nom, description: description || null, prix: prixNum, unite, disponible, stock: stockNum })],
          { type: "application/json" },
        ),
      );
      if (photoFile) formData.append("photo", photoFile);

      if (editingId) {
        await api.put(`/api/fournisseurs/moi/articles/${editingId}`, formData, true);
      } else {
        await api.post("/api/fournisseurs/moi/articles", formData, true);
      }
      toast.success(t("fournisseur.espace.toast_article_saved", "Article enregistré"));
      resetForm();
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_article_error", "Erreur lors de l'enregistrement"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm(t("fournisseur.espace.confirm_delete_article", "Supprimer cet article ?") as string)) return;
    try {
      await api.delete(`/api/fournisseurs/moi/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("fournisseur.espace.toast_article_deleted", "Article supprimé"));
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_article_error", "Erreur"));
    }
  };

  const [savingLogo, setSavingLogo] = useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSavingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      await api.post("/api/fournisseurs/moi/logo", formData, true);
      toast.success(
        t("fournisseur.espace.toast_logo_saved", "Logo enregistré — il apparaîtra parmi nos partenaires"),
      );
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_logo_error", "Erreur lors de l'enregistrement du logo"));
    } finally {
      setSavingLogo(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"fiche" | "catalogue" | "commandes">("catalogue");

  const [articleSearch, setArticleSearch] = useState("");
  const [articleFilter, setArticleFilter] = useState<"ALL" | "DISPONIBLE" | "INDISPONIBLE">("ALL");

  const filteredArticles = useMemo(() => {
    const q = articleSearch.trim().toLowerCase();
    return articles.filter((a) => {
      if (articleFilter === "DISPONIBLE" && !a.disponible) return false;
      if (articleFilter === "INDISPONIBLE" && a.disponible) return false;
      if (q && !a.nom.toLowerCase().includes(q) && !(a.description || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [articles, articleSearch, articleFilter]);

  const [commandeSearch, setCommandeSearch] = useState("");
  const [commandeStatutFilter, setCommandeStatutFilter] = useState<string>("ALL");

  const filteredCommandes = useMemo(() => {
    const q = commandeSearch.trim().toLowerCase();
    return commandes.filter((c) => {
      if (commandeStatutFilter !== "ALL" && c.statut !== commandeStatutFilter) return false;
      if (q && !c.projetLibelle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [commandes, commandeSearch, commandeStatutFilter]);

  const [expeditionId, setExpeditionId] = useState<number | null>(null);
  const [expeditionSending, setExpeditionSending] = useState(false);
  const [refusId, setRefusId] = useState<number | null>(null);
  const [motifRefus, setMotifRefus] = useState("");

  const handleAccepter = async (id: number) => {
    try {
      await api.post(`/api/commandes/${id}/accepter`);
      toast.success(t("fournisseur.espace.toast_accepted", "Commande acceptée"));
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_error", "Erreur"));
    }
  };

  const handleRefuser = async () => {
    if (!refusId || motifRefus.trim().length < 3) {
      toast.error(t("fournisseur.espace.toast_motif_required", "Le motif est obligatoire (3 caractères min.)"));
      return;
    }
    try {
      await api.post(`/api/commandes/${refusId}/refuser`, { motif: motifRefus });
      toast.success(t("fournisseur.espace.toast_refused", "Commande refusée"));
      setRefusId(null);
      setMotifRefus("");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_error", "Erreur"));
    }
  };

  const handleConfirmerExpedition = async () => {
    if (!expeditionId) return;
    setExpeditionSending(true);
    try {
      await api.post(`/api/commandes/${expeditionId}/expedier`);
      toast.success(t("fournisseur.espace.toast_expedited", "Commande marquée comme expédiée"));
      setExpeditionId(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_error", "Erreur"));
    } finally {
      setExpeditionSending(false);
    }
  };

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
          <p>{t("fournisseur.espace.status_draft", "Votre fiche fournisseur est en brouillon — terminez-la pour la soumettre.")}</p>
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
              <p>{t("fournisseur.espace.status_pending", "Votre inscription est en attente de validation par l'équipe GrowzApp.")}</p>
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

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "fiche" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("fiche")}
        >
          {t("fournisseur.espace.tab_fiche", "Ma fiche")}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "catalogue" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("catalogue")}
        >
          {t("fournisseur.espace.tab_catalogue", "Catalogue")} ({articles.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "commandes" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("commandes")}
        >
          {t("fournisseur.espace.tab_commandes", "Commandes")} ({commandes.length})
        </button>
      </div>

      {activeTab === "fiche" && (
      <div className={styles.ficheCard}>
        <div className={styles.ficheCardHeader}>
          <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
            {t("fournisseur.espace.fiche_title", "Ma fiche")}
          </h2>
          <Link to="/devenir-fournisseur" className={styles.btnEdit}>
            <FiEdit2 size={13} /> {t("fournisseur.espace.btn_edit_fiche", "Modifier")}
          </Link>
        </div>
        <div className={styles.ficheGrid}>
          <div>
            <span className={styles.ficheLabel}>{t("fournisseur.espace.fiche_type", "Type")}</span>
            <span className={styles.ficheValue}>
              {fournisseur.statutJuridique === "ENTREPRISE"
                ? t("fournisseur.inscription.type_entreprise", "Entreprise")
                : t("fournisseur.inscription.type_individuel", "Individuel")}
            </span>
          </div>
          <div>
            <span className={styles.ficheLabel}>{t("fournisseur.espace.fiche_secteur", "Secteur")}</span>
            <span className={styles.ficheValue}>{fournisseur.secteurNom || "—"}</span>
          </div>
          <div>
            <span className={styles.ficheLabel}>
              <FiMapPin size={13} /> {t("fournisseur.espace.fiche_location", "Localisation")}
            </span>
            <span className={styles.ficheValue}>
              {fournisseur.ville}, {fournisseur.pays}
            </span>
          </div>
          {fournisseur.telephone && (
            <div>
              <span className={styles.ficheLabel}>
                <FiPhone size={13} /> {t("fournisseur.espace.fiche_telephone", "Téléphone")}
              </span>
              <span className={styles.ficheValue}>{fournisseur.telephone}</span>
            </div>
          )}
          {fournisseur.email && (
            <div>
              <span className={styles.ficheLabel}>
                <FiMail size={13} /> {t("fournisseur.espace.fiche_email", "Email")}
              </span>
              <span className={styles.ficheValue}>{fournisseur.email}</span>
            </div>
          )}
        </div>
        {fournisseur.description && <p className={styles.ficheDescription}>{fournisseur.description}</p>}

        <div className={styles.logoField}>
          {fournisseur.logoUrl ? (
            <img src={buildFileUrl(fournisseur.logoUrl)} alt="" className={styles.logoPreview} />
          ) : (
            <div className={styles.photoPlaceholder}>
              <FiImage size={22} />
            </div>
          )}
          <div>
            <label className={styles.photoLabel}>
              {savingLogo ? (
                t("fournisseur.espace.btn_saving", "Enregistrement...")
              ) : fournisseur.logoUrl ? (
                <FiEdit2 size={14} />
              ) : (
                t("fournisseur.espace.field_logo", "Ajouter/changer mon logo")
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                disabled={savingLogo}
              />
            </label>
            {!fournisseur.logoUrl && (
              <p className={styles.logoHint}>
                {t(
                  "fournisseur.espace.logo_hint",
                  "Affiché publiquement dans la section « Nos partenaires » du site.",
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === "catalogue" && (
      <div>
      <div className={styles.sectionHeader}>
        <h2>
          <FiPackage /> {t("fournisseur.espace.catalogue_title", "Mon catalogue")}
        </h2>
        <button className={styles.btnAdd} onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          <FiPlus /> {t("fournisseur.espace.btn_add_article", "Ajouter un article")}
        </button>
      </div>

      {articles.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.searchInput}>
            <FiSearch size={15} />
            <input
              type="text"
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              placeholder={t("fournisseur.espace.search_article", "Rechercher un article...") as string}
            />
          </div>
          <select value={articleFilter} onChange={(e) => setArticleFilter(e.target.value as any)}>
            <option value="ALL">{t("fournisseur.espace.filter_all", "Tous")}</option>
            <option value="DISPONIBLE">{t("fournisseur.espace.badge_available", "Disponible")}</option>
            <option value="INDISPONIBLE">{t("fournisseur.espace.badge_unavailable", "Indisponible")}</option>
          </select>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSaveArticle} className={styles.articleForm}>
          <div className={styles.fieldRow}>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={t("fournisseur.espace.field_nom", "Nom (ex. Sac de ciment 50kg)") as string}
              maxLength={150}
              required
            />
            <input
              type="text"
              value={unite}
              onChange={(e) => setUnite(e.target.value)}
              placeholder={t("fournisseur.espace.field_unite", "Unité (ex. sac, m³, heure)") as string}
              maxLength={50}
              required
            />
          </div>
          <div className={styles.fieldRow}>
            <input
              type="text"
              inputMode="decimal"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder={t("fournisseur.espace.field_prix", "Prix (FCFA)") as string}
              required
            />
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
              {t("fournisseur.espace.field_disponible", "Disponible")}
            </label>
          </div>
          <div className={styles.fieldRow}>
            <input
              type="text"
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={t("fournisseur.espace.field_stock", "Stock (vide = illimité)") as string}
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fournisseur.espace.field_description", "Description (facultatif)") as string}
            maxLength={1000}
            rows={2}
          />
          <div className={styles.photoField}>
            {photoPreview ? (
              <img src={photoPreview} alt="" className={styles.photoPreview} />
            ) : (
              <div className={styles.photoPlaceholder}>
                <FiImage size={22} />
              </div>
            )}
            <label className={styles.photoLabel}>
              {t("fournisseur.espace.field_photo", "Photo (facultatif)")}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={resetForm}>
              {t("fournisseur.espace.btn_cancel", "Annuler")}
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={saving}>
              {saving ? t("fournisseur.espace.btn_saving", "Enregistrement...") : t("fournisseur.espace.btn_save", "Enregistrer")}
            </button>
          </div>
        </form>
      )}

      {articles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.catalogue_empty", "Aucun article dans votre catalogue pour le moment.")}</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.no_results", "Aucun résultat pour cette recherche/filtre.")}</p>
        </div>
      ) : (
        <div className={styles.articleGrid}>
          {filteredArticles.map((a) => (
            <div key={a.id} className={styles.articleCard}>
              {a.photoUrl && <img src={buildFileUrl(a.photoUrl)} alt={a.nom} className={styles.articlePhoto} />}
              <div className={styles.articleCardHeader}>
                <strong>{a.nom}</strong>
                <span className={`${styles.badge} ${a.disponible ? styles.badgeOk : styles.badgeOff}`}>
                  {a.disponible
                    ? t("fournisseur.espace.badge_available", "Disponible")
                    : t("fournisseur.espace.badge_unavailable", "Indisponible")}
                </span>
              </div>
              {a.description && <p className={styles.articleDesc}>{a.description}</p>}
              <p className={styles.articlePrix}>
                {format(Number(a.prix), "XOF")} / {a.unite}
              </p>
              {a.stock !== null && (
                <p className={styles.articleStock}>
                  {t("fournisseur.espace.stock_restant", "{{count}} en stock", { count: a.stock })}
                </p>
              )}
              <div className={styles.articleActions}>
                <button className={styles.btnEdit} onClick={() => openEdit(a)}>
                  {t("fournisseur.espace.btn_edit", "Modifier")}
                </button>
                <button className={styles.btnDelete} onClick={() => handleDeleteArticle(a.id)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}

      {activeTab === "commandes" && (
      <div>
      <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        <FiTruck /> {t("fournisseur.espace.commandes_title", "Commandes reçues")}
      </h2>

      {commandes.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.searchInput}>
            <FiSearch size={15} />
            <input
              type="text"
              value={commandeSearch}
              onChange={(e) => setCommandeSearch(e.target.value)}
              placeholder={t("fournisseur.espace.search_commande", "Rechercher un projet...") as string}
            />
          </div>
          <select value={commandeStatutFilter} onChange={(e) => setCommandeStatutFilter(e.target.value)}>
            <option value="ALL">{t("fournisseur.espace.filter_all", "Tous")}</option>
            {Object.keys(STATUT_KEYS).map((key) => (
              <option key={key} value={key}>
                {statutLabel(t, key)}
              </option>
            ))}
          </select>
        </div>
      )}

      {commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.commandes_empty", "Aucune commande reçue pour le moment.")}</p>
        </div>
      ) : filteredCommandes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.no_results", "Aucun résultat pour cette recherche/filtre.")}</p>
        </div>
      ) : (
        <div className={styles.commandeList}>
          {filteredCommandes.map((c) => (
            <div key={c.id} className={styles.commandeCard}>
              <div className={styles.commandeCardHeader}>
                <div>
                  <strong>{c.projetLibelle}</strong>
                  <span className={styles.commandeDate}>
                    {" "}
                    — {formatDate(new Date(c.dateCommande), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
                <span className={styles.articlePrix}>{format(Number(c.montantTotal), "XOF")}</span>
              </div>
              <span className={`${styles.badge} ${styles.commandeStatutBadge}`}>
                {statutLabel(t, c.statut)}
              </span>

              <CommandeTimeline commande={c} />

              {c.factureUrl && (
                <Link to={`/commandes/${c.id}/facture`} className={styles.btnAction}>
                  {t("fournisseur.espace.btn_voir_facture", "Voir la facture")}
                </Link>
              )}

              {c.statut === "EN_ATTENTE_ACCEPTATION" && (
                <div className={styles.commandeActions}>
                  <button className={styles.btnAction} onClick={() => handleAccepter(c.id)}>
                    <FiCheckCircle size={14} /> {t("fournisseur.espace.btn_accepter", "Accepter")}
                  </button>
                  <button className={styles.btnDanger} onClick={() => setRefusId(c.id)}>
                    <FiXCircle size={14} /> {t("fournisseur.espace.btn_refuser", "Refuser")}
                  </button>
                </div>
              )}
              {c.statut === "ACCEPTEE" && (
                <div className={styles.commandeActions}>
                  <button className={styles.btnAction} onClick={() => setExpeditionId(c.id)}>
                    <FiTruck size={14} /> {t("fournisseur.espace.btn_expedier", "Marquer expédiée")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
      )}

      {refusId !== null && (
        <div className={styles.modalOverlay} onClick={() => setRefusId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("fournisseur.espace.refus_title", "Motif du refus")}</h2>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              placeholder={t("fournisseur.espace.refus_placeholder", "Expliquez pourquoi vous refusez cette commande...") as string}
              rows={4}
              maxLength={500}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setRefusId(null)}>
                {t("fournisseur.espace.btn_cancel", "Annuler")}
              </button>
              <button className={styles.btnDanger} onClick={handleRefuser}>
                {t("fournisseur.espace.btn_confirm_refus", "Refuser la commande")}
              </button>
            </div>
          </div>
        </div>
      )}

      {expeditionId !== null && (
        <div className={styles.modalOverlay} onClick={() => setExpeditionId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("fournisseur.espace.facture_title", "Confirmer l'expédition")}</h2>
            <p className={styles.warningText}>
              {t(
                "fournisseur.espace.facture_notice",
                "La facture sera générée automatiquement et transmise au porteur et aux investisseurs du projet une fois le paiement exécuté.",
              )}
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setExpeditionId(null)}>
                {t("fournisseur.espace.btn_cancel", "Annuler")}
              </button>
              <button
                className={styles.btnSubmit}
                onClick={handleConfirmerExpedition}
                disabled={expeditionSending}
              >
                {expeditionSending
                  ? t("fournisseur.espace.btn_saving", "Enregistrement...")
                  : t("fournisseur.espace.btn_confirm_expedition", "Confirmer l'expédition")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
