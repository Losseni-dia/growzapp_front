import { Link } from "react-router-dom";
import { Newspaper, PenLine } from "lucide-react"; // Ajout de l'icône PenLine
import { useEffect, useState } from "react";
import { News, newsService } from "../../../service/newsService";
import { useAuth } from "../../../components/Context/AuthContext"; // Import de ton contexte
import styles from "./NewsPage.module.css";

const NewsPage = () => {
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Récupération de l'utilisateur

  // Vérification si l'utilisateur peut publier (ADMIN ou COMMUNICANT)
  const canPublish = user?.roles?.some((role: string) =>
    ["ADMIN", "COMMUNICANT"].includes(role),
  );

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
        <div className={styles.titleArea}>
          <Newspaper size={32} className={styles.icon} />
          <h1>Actualités & Opportunités</h1>
        </div>

        {/* AFFICHAGE CONDITIONNEL DU BOUTON */}
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
            {/* ... ton rendu de carte existant ... */}
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
              <p>
                {article.content.replace(/<[^>]*>/g, "").substring(0, 120)}...
              </p>

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
