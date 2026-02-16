// MODIFIE TES IMPORTS ICI
import { Link } from "react-router-dom"; // Pour la navigation
import { Newspaper } from "lucide-react"; // Uniquement pour l'icône
import { useEffect, useState } from "react";
import { News, newsService } from "../../../service/newsService";
import styles from "./NewsPage.module.css";

const NewsPage = () => {
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService
      .getAll()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loader}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Newspaper size={32} className={styles.icon} />
        <h1>Actualités & Opportunités</h1>
      </header>

      <div className={styles.grid}>
        {articles.map((article) => (
          <article key={article.id} className={styles.card}>
            {article.imageUrl && (
              <div className={styles.imageWrapper}>
                <img src={article.imageUrl} alt={article.title} />
              </div>
            )}
            <div className={styles.content}>
              <span className={styles.badge}>
                {article.category.replace("_", " ")}
              </span>
              <h2>{article.title}</h2>
              <p>{article.content.substring(0, 120)}...</p>

              {article.id ? (
                <Link to={`/news/${article.id}`} className={styles.readMore}>
                  Lire la suite
                </Link>
              ) : (
                <span className={styles.error}>ID manquant</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
