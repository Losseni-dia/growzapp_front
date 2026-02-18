import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { newsService } from "../../../service/newsService";
import styles from "../newsForm/NewsForm.module.css"; // Réutilise tes styles existants
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  Loader2,
} from "lucide-react";

const NewsEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    category: "PLATFORM_UPDATE",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. Chargement des données initiales de l'article
  useEffect(() => {
    if (id) {
      newsService
        .getById(id)
        .then((data) => {
          setFormData({
            title: data.title,
            content: data.content,
            imageUrl: data.imageUrl,
            category: data.category,
          });
        })
        .catch(() =>
          setMessage({
            type: "error",
            text: "Impossible de charger l'article.",
          }),
        )
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);

    setUploading(true);
    try {
      const response = await newsService.uploadImage(data);
      setFormData({ ...formData, imageUrl: response.url });
      setMessage({ type: "success", text: "Nouvelle image prête !" });
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de l'upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);

    try {
      await newsService.update(id, formData);
      setMessage({ type: "success", text: "Article mis à jour avec succès !" });
      setTimeout(() => navigate("/news"), 1500); // Redirection après succès
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className={styles.loaderContainer}>
        <Loader2 size={40} className={styles.spinner} />
      </div>
    );

  return (
    <div className={styles.formContainer}>
      <button onClick={() => navigate("/news")} className={styles.backLink}>
        <ArrowLeft size={18} /> Retour
      </button>

      <div className={styles.card}>
        <header className={styles.formHeader}>
          <h2>Modifier l'actualité #{id}</h2>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Titre</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="PLATFORM_UPDATE">PLATFORM UPDATE</option>
              <option value="INVESTMENT_OPPORTUNITY">
                INVESTMENT OPPORTUNITY
              </option>
              <option value="SECURITY">SECURITY</option>
              {/* Ajoute les autres catégories si besoin */}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Image d'illustration (URL ou Upload)</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
            />
            <input
              type="file"
              ref={fileInputRef}
              hidden
              onChange={handleFileChange}
              accept="image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadBtnMini}
            >
              {uploading ? "Upload..." : "Changer l'image"}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Contenu</label>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val })}
            />
          </div>

          {message.text && (
            <div className={`${styles.alert} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            <Save size={18} />{" "}
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsEdit;
