import { Link } from "react-router-dom";
import { Newspaper, PenLine, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { News, newsService } from "../../../service/newsService";
import { useAuth } from "../../../components/Context/AuthContext";
import styles from "./NewsPage.module.css";

const NewsPage = () => {
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Vérification des permissions selon les rôles définis dans le SI
  const canPublish = user?.roles?.some((role: string) =>
    ["ADMIN", "COMMUNICANT"].includes(role),
  );
  const canEdit = user?.roles?.some((role: string) =>
    ["ADMIN", "COMMUNICANT"].includes(role),
  );
  const canDelete = user?.roles?.some((role: string) =>
    ["ADMIN"].includes(role),
  );

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    newsService
      .getAll()
      .then(setArticles)
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        "Voulez-vous vraiment supprimer cet article ? Cette action est irréversible.",
      )
    ) {
      try {
        await newsService.delete(id);
        setArticles(articles.filter((a) => a.id !== id));
      } catch (err: any) {
        console.error("Erreur lors de la suppression:", err);
        alert("Une erreur est survenue lors de la suppression.");
      }
    }
  };

  // Nettoyage du HTML pour le résumé de la carte
  const getPlainText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (loading)
    return (
      <div className={styles.loader}>Chargement des actualités Growzapp...</div>
    );

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

              <p>{getPlainText(article.content).substring(0, 130)}...</p>

              <Link to={`/news/${article.id}`} className={styles.readMore}>
                Lire la suite
              </Link>

              {/* ACTIONS D'ADMINISTRATION : Modification et Suppression */}
              {(canEdit || canDelete) && (
                <div className={styles.adminActions}>
                  {canEdit && (
                    <Link
                      to={`/admin/news/edit/${article.id}`}
                      className={styles.editBtn}
                    >
                      <Edit size={16} style={{ marginRight: "5px" }} /> Modifier
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(article.id)}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={16} style={{ marginRight: "5px" }} />{" "}
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
