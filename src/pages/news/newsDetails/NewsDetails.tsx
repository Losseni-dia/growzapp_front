import { ArrowLeft, Calendar, Loader2, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { News, newsService } from "../../../service/newsService";
import styles from "./NewsDetail.module.css";

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
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading)
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className={styles.spinner} size={48} />
      </div>
    );
  if (!article)
    return (
      <div className={styles.errorContainer}>
        <h2>Article introuvable</h2>
      </div>
    );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate("/news")}>
          <ArrowLeft size={20} /> Retour
        </button>

        <article className={styles.articleCard}>
          <header className={styles.header}>
            <span className={styles.categoryBadge}>
              {article.category.replace(/_/g, " ")}
            </span>
            <h1 className={styles.mainTitle}>{article.title}</h1>
            <div className={styles.metaData}>
              <span className={styles.metaItem}>
                <Calendar size={16} />
                {new Date(article.createdAt).toLocaleDateString("fr-FR")}
              </span>
              <span className={styles.metaItem}>
                <Tag size={16} /> ID: #{article.id}
              </span>
            </div>
          </header>

          {article.imageUrl && (
            <div className={styles.imageContainer}>
              <img
                src={article.imageUrl}
                alt={article.title}
                className={styles.fullImage}
              />
            </div>
          )}

          <div className={styles.contentSection}>
            <div
              className={styles.richContent}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;
