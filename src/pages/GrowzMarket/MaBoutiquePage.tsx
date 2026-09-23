import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiImage, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api, buildFileUrl, buildProjetUrl } from "../../service/Api";
import styles from "./MaBoutiquePage.module.css";

interface ProjetLigne {
  id: number;
  libelle: string;
}

interface ArticleMarketDTO {
  id: number;
  projetId: number;
  projetLibelle: string;
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

export default function MaBoutiquePage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [projets, setProjets] = useState<ProjetLigne[]>([]);
  const [articles, setArticles] = useState<ArticleMarketDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projetId, setProjetId] = useState<number | "">("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [unite, setUnite] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [stock, setStock] = useState("");
  const [categorie, setCategorie] = useState("AUTRE");
  const [delaiPreparation, setDelaiPreparation] = useState("");
  const [pointRetrait, setPointRetrait] = useState("");
  const [telephoneContact, setTelephoneContact] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      const [projRes, artRes] = await Promise.all([
        api.get<{ data: ProjetLigne[] }>(buildProjetUrl("/api/projets/mes-projets")),
        api.get<{ data: ArticleMarketDTO[] }>("/api/market/mes-articles"),
      ]);
      setProjets(projRes.data || []);
      setArticles(artRes.data || []);
    } catch {
      // Rien — état vide géré ci-dessous
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
    setProjetId("");
    setNom("");
    setDescription("");
    setPrix("");
    setUnite("");
    setDisponible(true);
    setStock("");
    setCategorie("AUTRE");
    setDelaiPreparation("");
    setPointRetrait("");
    setTelephoneContact("");
    setPhotoFiles([]);
    setShowForm(false);
  };

  const openEdit = (a: ArticleMarketDTO) => {
    setEditingId(a.id);
    setProjetId(a.projetId);
    setNom(a.nom);
    setDescription(a.description || "");
    setPrix(String(a.prix));
    setUnite(a.unite);
    setDisponible(a.disponible);
    setStock(a.stock !== null ? String(a.stock) : "");
    setCategorie(a.categorie);
    setDelaiPreparation(a.delaiPreparation || "");
    setPointRetrait(a.pointRetrait);
    setTelephoneContact(a.telephoneContact || "");
    setPhotoFiles([]);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const prixNum = parseFloat(prix.replace(",", "."));
    if (!projetId || nom.trim().length < 2 || !unite.trim() || isNaN(prixNum) || prixNum <= 0 || !pointRetrait.trim()) {
      toast.error(
        t(
          "growzmarket.boutique.toast_validation",
          "Projet, nom, prix (positif), unité et point de retrait sont obligatoires",
        ),
      );
      return;
    }
    setSaving(true);
    try {
      const stockNum = stock.trim() === "" ? null : parseInt(stock, 10);
      const formData = new FormData();
      formData.append(
        "article",
        new Blob(
          [
            JSON.stringify({
              projetId,
              nom,
              description: description || null,
              prix: prixNum,
              unite,
              disponible,
              stock: stockNum,
              categorie,
              delaiPreparation: delaiPreparation || null,
              pointRetrait,
              telephoneContact: telephoneContact || null,
            }),
          ],
          { type: "application/json" },
        ),
      );
      photoFiles.forEach((f) => formData.append("photos", f));

      if (editingId) {
        await api.put(`/api/market/articles/${editingId}`, formData, true);
      } else {
        await api.post("/api/market/articles", formData, true);
      }
      toast.success(t("growzmarket.boutique.toast_saved", "Article enregistré"));
      resetForm();
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.boutique.toast_error", "Erreur lors de l'enregistrement"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("growzmarket.boutique.confirm_delete", "Supprimer cet article ?") as string)) return;
    try {
      await api.delete(`/api/market/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("growzmarket.boutique.toast_deleted", "Article supprimé"));
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.boutique.toast_error", "Erreur"));
    }
  };

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiShoppingBag /> {t("growzmarket.boutique.title", "Ma Boutique GrowzMarket")}
        </h1>
        <p>
          {t(
            "growzmarket.boutique.subtitle",
            "Vendez vos produits ou services au grand public — le revenu crédite la trésorerie du projet choisi.",
          )}
        </p>
      </div>

      {projets.length === 0 ? (
        <div className={styles.emptyState}>
          <FiShoppingBag size={48} />
          <p>
            {t(
              "growzmarket.boutique.no_projet",
              "Vous devez avoir un projet pour vendre sur GrowzMarket — le revenu de vos ventes crédite la trésorerie de ce projet.",
            )}
          </p>
          <Link to="/projet/creer" className={styles.btnSubmit}>
            {t("growzmarket.boutique.btn_create_projet", "Créer un projet")}
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.sectionHeader}>
            <h2>{t("growzmarket.boutique.catalogue_title", "Mes articles")}</h2>
            <button className={styles.btnAdd} onClick={() => (showForm ? resetForm() : setShowForm(true))}>
              <FiPlus /> {t("growzmarket.boutique.btn_add_article", "Ajouter un article")}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSave} className={styles.articleForm}>
              <select value={projetId} onChange={(e) => setProjetId(e.target.value ? Number(e.target.value) : "")} required>
                <option value="">{t("growzmarket.boutique.field_projet", "Choisir le projet vendeur...")}</option>
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.libelle}
                  </option>
                ))}
              </select>
              <div className={styles.fieldRow}>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder={t("growzmarket.boutique.field_nom", "Nom (ex. Panier de mangues séchées)") as string}
                  maxLength={150}
                  required
                />
                <input
                  type="text"
                  value={unite}
                  onChange={(e) => setUnite(e.target.value)}
                  placeholder={t("growzmarket.boutique.field_unite", "Unité (ex. panier, kg, heure)") as string}
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
                  placeholder={t("growzmarket.boutique.field_prix", "Prix (FCFA)") as string}
                  required
                />
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} />
                  {t("growzmarket.boutique.field_disponible", "Disponible")}
                </label>
              </div>
              <div className={styles.fieldRow}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={t("growzmarket.boutique.field_stock", "Stock (vide = illimité)") as string}
                />
                <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`growzmarket.categorie.${c}`, c)}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={delaiPreparation}
                onChange={(e) => setDelaiPreparation(e.target.value)}
                placeholder={t("growzmarket.boutique.field_delai", "Délai de préparation (ex. Prêt sous 2 jours)") as string}
                maxLength={100}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("growzmarket.boutique.field_description", "Description (facultatif)") as string}
                maxLength={1000}
                rows={2}
              />
              <div className={styles.fieldRow}>
                <input
                  type="text"
                  value={pointRetrait}
                  onChange={(e) => setPointRetrait(e.target.value)}
                  placeholder={t("growzmarket.boutique.field_point_retrait", "Point de retrait (lieu précis)") as string}
                  maxLength={255}
                  required
                />
                <input
                  type="text"
                  value={telephoneContact}
                  onChange={(e) => setTelephoneContact(e.target.value)}
                  placeholder={t("growzmarket.boutique.field_telephone", "Téléphone de contact (facultatif)") as string}
                  maxLength={50}
                />
              </div>
              <p className={styles.hint}>
                {t(
                  "growzmarket.boutique.point_retrait_hint",
                  "Affiché à l'acheteur avant paiement — soyez précis (quartier, repères).",
                )}
              </p>
              <div className={styles.photoField}>
                <label className={styles.photoLabel}>
                  {t("growzmarket.boutique.field_photos", "Photos (plusieurs possibles)")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                  />
                </label>
                {photoFiles.length > 0 && (
                  <span className={styles.photoCount}>
                    {t("growzmarket.boutique.photos_selected", "{{count}} photo(s) sélectionnée(s)", {
                      count: photoFiles.length,
                    })}
                  </span>
                )}
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={resetForm}>
                  {t("growzmarket.boutique.btn_cancel", "Annuler")}
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={saving}>
                  {saving
                    ? t("growzmarket.boutique.btn_saving", "Enregistrement...")
                    : t("growzmarket.boutique.btn_save", "Enregistrer")}
                </button>
              </div>
            </form>
          )}

          {articles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{t("growzmarket.boutique.catalogue_empty", "Aucun article dans votre boutique pour le moment.")}</p>
            </div>
          ) : (
            <div className={styles.articleGrid}>
              {articles.map((a) => (
                <div key={a.id} className={styles.articleCard}>
                  {a.photos.length > 0 ? (
                    <img src={buildFileUrl(a.photos[0])} alt={a.nom} className={styles.articlePhoto} />
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      <FiImage size={22} />
                    </div>
                  )}
                  <div className={styles.articleCardHeader}>
                    <strong>{a.nom}</strong>
                    <span className={`${styles.badge} ${a.disponible ? styles.badgeOk : styles.badgeOff}`}>
                      {a.disponible
                        ? t("growzmarket.boutique.badge_available", "Disponible")
                        : t("growzmarket.boutique.badge_unavailable", "Indisponible")}
                    </span>
                  </div>
                  <p className={styles.articleProjet}>{a.projetLibelle}</p>
                  <p className={styles.articlePrix}>
                    {format(Number(a.prix), "XOF")} / {a.unite}
                  </p>
                  {a.stock !== null && (
                    <p className={styles.articleStock}>
                      {t("growzmarket.boutique.stock_restant", "{{count}} en stock", { count: a.stock })}
                    </p>
                  )}
                  <div className={styles.articleActions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(a)}>
                      {t("growzmarket.boutique.btn_edit", "Modifier")}
                    </button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(a.id)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
