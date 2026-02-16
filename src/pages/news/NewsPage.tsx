import React, { useEffect, useState } from "react";
import { newsService, News } from "../../service/newsService";
import styles from "./NewsPage.module.css";
import { Newspaper } from "lucide-react";

const NewsPage = () => {
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService
      .getAll()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

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
              <button className={styles.readMore}>Lire la suite</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
