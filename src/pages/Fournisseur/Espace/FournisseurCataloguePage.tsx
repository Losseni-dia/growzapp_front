import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiImage, FiPackage, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useCurrency } from "../../../components/Context/CurrencyContext";
import { api, buildFileUrl } from "../../../service/Api";
import styles from "./FournisseurEspace.module.css";

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

export default function FournisseurCataloguePage() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get<{ data: ArticleDTO[] }>("/api/fournisseurs/moi/articles")
      .then((res) => setArticles(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

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
      load();
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

  if (loading) return <div className={styles.loading}>{t("dashboard.loading")}</div>;

  return (
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
  );
}
