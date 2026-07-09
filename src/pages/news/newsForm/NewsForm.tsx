// src/pages/news/newsForm/NewsForm.tsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { newsService, NEWS_CATEGORIES } from "../../../service/newsService";
import styles from "./NewsForm.module.css";
import { Send, Image as ImageIcon, AlertCircle, Upload, X } from "lucide-react";

const NewsForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    category: "PLATFORM_UPDATE",
  });

  const [customCategory, setCustomCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await newsService.uploadImage(data);
      setFormData({ ...formData, imageUrl: response.url });
      setMessage({ type: "success", text: "Image chargée avec succès !" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Erreur lors de l'upload de l'image.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await newsService.create(formData);
      setMessage({
        type: "success",
        text: "L'actualité a été publiée avec succès !",
      });
      // Redirection vers la liste des articles après 1 seconde
      setTimeout(() => navigate("/news"), 1000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Une erreur est survenue lors de la publication.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.card}>
        <header className={styles.formHeader}>
          <h2>Publier une actualité</h2>
          <p>Diffusez les dernières informations sur la plateforme Growzapp.</p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* TITRE */}
          <div className={styles.inputGroup}>
            <label htmlFor="title">Titre de l'article</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Lancement du nouveau projet solaire..."
              required
            />
          </div>

          {/* CATÉGORIE */}
          <div className={styles.inputGroup}>
            <label htmlFor="category">Catégorie</label>
            {!customCategory ? (
              <div className={styles.categoryRow}>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={styles.categorySelect}
                >
                  {NEWS_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.newCatBtn}
                  onClick={() => {
                    setCustomCategory(true);
                    setFormData({ ...formData, category: "" });
                  }}
                >
                  + Nouvelle catégorie
                </button>
              </div>
            ) : (
              <div className={styles.categoryRow}>
                <input
                  type="text"
                  placeholder="Ex : PARTENARIAT, EVENEMENT..."
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value.toUpperCase().replace(/ /g, "_"),
                    })
                  }
                  className={styles.categoryInput}
                  required
                />
                <button
                  type="button"
                  className={styles.newCatBtn}
                  onClick={() => {
                    setCustomCategory(false);
                    setFormData({ ...formData, category: "PLATFORM_UPDATE" });
                  }}
                >
                  ← Choisir dans la liste
                </button>
              </div>
            )}
            {customCategory && (
              <span className={styles.categoryHint}>
                La catégorie sera automatiquement mise en majuscules avec
                underscores
              </span>
            )}
          </div>

          {/* IMAGE */}
          <div className={styles.inputGroup}>
            <label>Image d'illustration</label>
            <div className={styles.uploadArea}>
              {formData.imageUrl ? (
                <div className={styles.previewContainer}>
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className={styles.previewImg}
                  />
                  <button
                    type="button"
                    className={styles.removeImg}
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                  >
                    <X size={16} /> Supprimer
                  </button>
                </div>
              ) : (
                <div className={styles.dropzone}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      "Traitement en cours..."
                    ) : (
                      <>
                        <Upload size={20} /> Charger une image
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className={styles.urlInputWrapper}>
                <ImageIcon size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="Ou collez une URL d'image externe"
                />
              </div>
            </div>
          </div>

          {/* ÉDITEUR */}
          <div className={styles.inputGroup}>
            <label>Corps de l'article</label>
            <div className={styles.editorContainer}>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={modules}
                placeholder="Rédigez le contenu détaillé de votre actualité ici..."
              />
            </div>
          </div>

          {/* MESSAGES */}
          {message.text && (
            <div className={`${styles.alert} ${styles[message.type]}`}>
              <AlertCircle size={18} /> {message.text}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || uploading}
          >
            {loading ? (
              "Publication en cours..."
            ) : (
              <>
                <Send size={18} /> Publier l'actualité
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsForm;
