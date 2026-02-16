import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { newsService, News } from "../../../service/newsService";
import styles from "./NewsDetail.module.css";
import { ArrowLeft, Calendar, Tag, Loader2 } from "lucide-react";

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (id) {
          const data = await newsService.getById(id);
          setArticle(data);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'article:", err);
        // Optionnel : rediriger vers la page news si l'article n'existe pas
        // navigate("/news");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Chargement de l'actualité...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={styles.errorContainer}>
        <h2>Article introuvable</h2>
        <button onClick={() => navigate("/news")} className={styles.backBtn}>
          Retour aux actualités
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* BOUTON RETOUR */}
        <button className={styles.backBtn} onClick={() => navigate("/news")}>
          <ArrowLeft size={20} />
          Retour à la liste
        </button>

        <article className={styles.articleCard}>
          {/* EN-TÊTE DE L'ARTICLE */}
          <header className={styles.header}>
            <div className={styles.badgeRow}>
              <span className={styles.categoryBadge}>
                {article.category.replace(/_/g, " ")}
              </span>
            </div>
            <h1>{article.title}</h1>
            <div className={styles.metaData}>
              <span className={styles.metaItem}>
                <Calendar size={16} />
                {new Date(article.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className={styles.metaItem}>
                <Tag size={16} />
                ID: #{article.id}
              </span>
            </div>
          </header>

          {/* IMAGE PRINCIPALE */}
          {article.imageUrl && (
            <div className={styles.imageContainer}>
              <img src={article.imageUrl} alt={article.title} />
            </div>
          )}

          {/* CONTENU DE L'ARTICLE */}
          <div className={styles.contentSection}>
            {/* Utilisation de dangerouslySetInnerHTML pour supporter le HTML du backend */}
            <div
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;
