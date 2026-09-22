import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCurrency } from "../../components/Context/CurrencyContext";
import { api } from "../../service/Api";
import styles from "./FournisseurEspacePage.module.css";

interface FournisseurDTO {
  id: number;
  statutJuridique: string;
  raisonSociale: string | null;
  secteurNom: string | null;
  ville: string;
  pays: string;
  statut: "EN_ATTENTE" | "VALIDE" | "REJETE";
  motifRejet: string | null;
}

interface ArticleDTO {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  unite: string;
  disponible: boolean;
}

interface CommandeDTO {
  id: number;
  projetLibelle: string;
  montantTotal: number;
  statut: string;
  dateCommande: string;
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
    setShowForm(false);
  };

  const openEdit = (a: ArticleDTO) => {
    setEditingId(a.id);
    setNom(a.nom);
    setDescription(a.description || "");
    setPrix(String(a.prix));
    setUnite(a.unite);
    setDisponible(a.disponible);
    setShowForm(true);
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
      const payload = { nom, description: description || null, prix: prixNum, unite, disponible };
      if (editingId) {
        await api.put(`/api/fournisseurs/moi/articles/${editingId}`, payload);
      } else {
        await api.post("/api/fournisseurs/moi/articles", payload);
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

  const handleLivrer = async (id: number) => {
    try {
      await api.post(`/api/commandes/${id}/livrer`);
      toast.success(t("fournisseur.espace.toast_delivered", "Commande marquée comme livrée"));
      loadAll();
    } catch (err: any) {
      toast.error(err.message || t("fournisseur.espace.toast_delivered_error", "Erreur"));
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
        <p>
          {fournisseur.secteurNom} — {fournisseur.ville}, {fournisseur.pays}
        </p>
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
                      <button className={styles.btnAction} onClick={() => handleLivrer(c.id)}>
                        <FiCheckCircle size={14} /> {t("fournisseur.espace.btn_livrer", "Marquer livrée")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
