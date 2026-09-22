import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
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
  FiTrash2,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
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
}

interface ArticleDTO {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  unite: string;
  disponible: boolean;
  photoUrl: string | null;
}

interface CommandeDTO {
  id: number;
  projetLibelle: string;
  montantTotal: number;
  statut: string;
  dateCommande: string;
  factureUrl: string | null;
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
      const formData = new FormData();
      formData.append(
        "article",
        new Blob([JSON.stringify({ nom, description: description || null, prix: prixNum, unite, disponible })], {
          type: "application/json",
        }),
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

  const [livraisonId, setLivraisonId] = useState<number | null>(null);
  const [factureFile, setFactureFile] = useState<File | null>(null);
  const [livraisonSending, setLivraisonSending] = useState(false);

  const handleConfirmerLivraison = async () => {
    if (!livraisonId || !factureFile) {
      toast.error(t("fournisseur.espace.toast_facture_required", "La facture est obligatoire"));
      return;
    }
    setLivraisonSending(true);
    try {
      const formData = new FormData();
      formData.append("facture", factureFile);
      await api.post(`/api/commandes/${livraisonId}/livrer`, formData, true);
      toast.success(t("fournisseur.espace.toast_delivered", "Commande marquée comme livrée, facture transmise aux investisseurs"));
      setLivraisonId(null);
      setFactureFile(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_delivered_error", "Erreur"));
    } finally {
      setLivraisonSending(false);
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
      </div>

      <div className={styles.sectionHeader}>
        <h2>
          <FiPackage /> {t("fournisseur.espace.catalogue_title", "Mon catalogue")}
        </h2>
        <button className={styles.btnAdd} onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          <FiPlus /> {t("fournisseur.espace.btn_add_article", "Ajouter un article")}
        </button>
      </div>

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
      ) : (
        <div className={styles.articleGrid}>
          {articles.map((a) => (
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

      <h2 className={styles.sectionTitle}>
        <FiTruck /> {t("fournisseur.espace.commandes_title", "Commandes reçues")}
      </h2>

      {commandes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t("fournisseur.espace.commandes_empty", "Aucune commande reçue pour le moment.")}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("fournisseur.espace.table_projet", "Projet")}</th>
                <th>{t("fournisseur.espace.table_montant", "Montant")}</th>
                <th>{t("fournisseur.espace.table_date", "Date")}</th>
                <th>{t("fournisseur.espace.table_statut", "Statut")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((c) => (
                <tr key={c.id}>
                  <td>{c.projetLibelle}</td>
                  <td>{format(Number(c.montantTotal), "XOF")}</td>
                  <td>{formatDate(new Date(c.dateCommande), "dd MMM yyyy", { locale: fr })}</td>
                  <td>
                    <span className={styles.badge}>{c.statut}</span>
                  </td>
                  <td>
                    {c.statut === "VALIDEE" && (
                      <button className={styles.btnAction} onClick={() => setLivraisonId(c.id)}>
                        <FiCheckCircle size={14} /> {t("fournisseur.espace.btn_livrer", "Marquer livrée")}
                      </button>
                    )}
                    {c.factureUrl && (
                      <Link to={`/commandes/${c.id}/facture`} className={styles.btnAction}>
                        {t("fournisseur.espace.btn_voir_facture", "Voir la facture")}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {livraisonId !== null && (
        <div className={styles.modalOverlay} onClick={() => setLivraisonId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t("fournisseur.espace.facture_title", "Confirmer la livraison")}</h2>
            <p className={styles.warningText}>
              {t(
                "fournisseur.espace.facture_notice",
                "La facture est obligatoire — elle sera transmise automatiquement aux investisseurs du projet pour traçabilité.",
              )}
            </p>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFactureFile(e.target.files?.[0] || null)}
            />
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setLivraisonId(null)}>
                {t("fournisseur.espace.btn_cancel", "Annuler")}
              </button>
              <button
                className={styles.btnSubmit}
                onClick={handleConfirmerLivraison}
                disabled={livraisonSending || !factureFile}
              >
                {livraisonSending
                  ? t("fournisseur.espace.btn_saving", "Enregistrement...")
                  : t("fournisseur.espace.btn_confirm_livraison", "Confirmer la livraison")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
