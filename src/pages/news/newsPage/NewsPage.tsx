import { Link } from "react-router-dom";
import { Newspaper, PenLine } from "lucide-react";
import { useEffect, useState } from "react";
import { News, newsService } from "../../../service/newsService";
import { useAuth } from "../../../components/Context/AuthContext";
import styles from "./NewsPage.module.css";

const NewsPage = () => {
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Vérification des droits d'accès
  const canPublish = user?.roles?.some((role: string) =>
    ["ADMIN", "COMMUNICANT"].includes(role),
  );

  useEffect(() => {
    newsService
      .getAll()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  // Fonction pour extraire le texte brut du HTML pour le résumé
  const getPlainText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (loading)
    return <div className={styles.loader}>Chargement de l'actualité...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Newspaper size={32} className={styles.icon} />
          <h1>Actualités & Opportunités</h1>
        </div>

        {canPublish && (
          <Link to="/admin/news/new" className={styles.adminBtn}>
            <PenLine size={20} />
            Écrire un article
          </Link>
        )}
      </header>

      <div className={styles.grid}>
        {articles.map((article) => (
          <article key={article.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img
                src={article.imageUrl || "/placeholder-news.jpg"}
                alt={article.title}
              />
            </div>
            <div className={styles.content}>
              <span className={styles.badge}>
                {article.category.replace(/_/g, " ")}
              </span>
              <h2>{article.title}</h2>
              <p>{getPlainText(article.content).substring(0, 150)}...</p>

              <Link to={`/news/${article.id}`} className={styles.readMore}>
                Lire la suite
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
