import React, { useState } from "react";
import { newsService } from "../../../service/newsService";
import styles from "./NewsForm.module.css";
import { Send, Image as ImageIcon, AlertCircle } from "lucide-react";

const NewsForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    category: "PLATFORM_UPDATE",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const categories = [
    "PLATFORM_UPDATE",
    "INVESTMENT_OPPORTUNITY",
    "PERFORMANCE_REPORT",
    "EDUCATION",
    "SECURITY",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // On utilise ton instance api.post via newsService (à ajouter dans newsService)
      await newsService.create(formData);
      setMessage({ type: "success", text: "Actualité publiée avec succès !" });
      setFormData({
        title: "",
        content: "",
        imageUrl: "",
        category: "PLATFORM_UPDATE",
      });
    } catch (err: any) {
      setMessage({ type: "error", text: "Erreur lors de la publication." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.card}>
        <h2>Nouvelle Actualité</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Titre de l'article</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Nouveau rendement record..."
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>URL de l'image</label>
            <div className={styles.urlInput}>
              <ImageIcon size={18} />
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Contenu (HTML supporté)</label>
            <textarea
              rows={8}
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Écrivez votre article ici..."
              required
            />
          </div>

          {message.text && (
            <div className={`${styles.alert} ${styles[message.type]}`}>
              <AlertCircle size={18} /> {message.text}
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              "Publication..."
            ) : (
              <>
                <Send size={18} /> Publier l'article
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsForm;
