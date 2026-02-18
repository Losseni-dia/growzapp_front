// src/pages/news/newsForm/NewsForm.tsx
import React, { useState, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { newsService } from "../../../service/newsService";
import styles from "./NewsForm.module.css";
import { Send, Image as ImageIcon, AlertCircle, Upload, X } from "lucide-react";

const NewsForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    category: "PLATFORM_UPDATE",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    "PLATFORM_UPDATE",
    "INVESTMENT_OPPORTUNITY",
    "PERFORMANCE_REPORT",
    "EDUCATION",
    "SECURITY",
  ];

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
    data.append("file", file); // Le nom "file" correspond au @RequestParam du backend Java

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      // Utilisation du mode isFormData = true défini dans newsService
      const response = await newsService.uploadImage(data);

      // On récupère l'URL renvoyée par FileStorageService (ex: /uploads/posters/...)
      setFormData({ ...formData, imageUrl: response.url });
      setMessage({ type: "success", text: "Image chargée avec succès !" });
    } catch (err: any) {
      console.error("Erreur upload:", err);
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
      // Réinitialisation après succès
      setFormData({
        title: "",
        content: "",
        imageUrl: "",
        category: "PLATFORM_UPDATE",
      });
    } catch (err: any) {
      console.error("Erreur publication:", err);
      setMessage({
        type: "error",
        text: "Une erreur est survenue lors de la publication de l'article.",
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
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* IMAGE (UPLOAD + URL) */}
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
                        <Upload size={20} /> Charger une image locale
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className={styles.urlInputWrapper}>
                <ImageIcon size={18} className={styles.inputIcon} />
                <input
                  type="text" // Changé de "url" à "text" pour accepter les deux formats (/uploads/ ou http://)
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="Collez une URL externe ou utilisez le bouton charger"
                />
              </div>
            </div>
          </div>

          {/* ÉDITEUR RICHE */}
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

          {/* MESSAGES D'ALERTE */}
          {message.text && (
            <div className={`${styles.alert} ${styles[message.type]}`}>
              <AlertCircle size={18} /> {message.text}
            </div>
          )}

          {/* VALIDATION */}
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
