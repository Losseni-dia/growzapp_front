import { ArrowLeft, Calendar, Loader2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { News, newsService } from "../../../service/newsService";
import styles from "./NewsDetail.module.css";
import { buildFileUrl } from "../../../service/Api";

// Temps de lecture estimé
const readingTime = (html: string): number => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  const words = (tmp.textContent || "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

// Date formatée relative
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} jours`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getCategoryLabel = (cat: string) => cat.replace(/_/g, " ");

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    newsService
      .getById(id)
      .then((res: any) => {
        // Gère réponse enveloppée { success, data: {...} } ou directe
        const data = res?.data ?? res;
        setArticle(data);
      })
      .catch((err) => console.error("Erreur chargement article:", err))
      .finally(() => setLoading(false));
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
        <span style={{ fontSize: "3rem" }}>📭</span>
        <h2>Article introuvable</h2>
        <button className={styles.backBtn} onClick={() => navigate("/news")}>
          <ArrowLeft size={18} /> Retour aux actualités
        </button>
      </div>
    );

  const minutes = readingTime(article.content);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Bouton retour */}
        <button className={styles.backBtn} onClick={() => navigate("/news")}>
          <ArrowLeft size={18} /> Retour aux actualités
        </button>

        <article className={styles.articleCard}>
          {/* ── IMAGE ───────────────────────────────────────────── */}
          {article.imageUrl && (
            <div className={styles.imageContainer}>
              <img
                src={buildFileUrl(article.imageUrl)}
                alt={article.title}
                className={styles.fullImage}
              />
              <div className={styles.imageOverlay} />
            </div>
          )}

          {/* ── HEADER ──────────────────────────────────────────── */}
          <header className={styles.header}>
            <span className={styles.categoryBadge}>
              {getCategoryLabel(article.category)}
            </span>

            <h1 className={styles.mainTitle}>{article.title}</h1>

            <div className={styles.metaData}>
              <span className={styles.metaItem}>
                <Calendar size={15} />
                {formatDate(article.createdAt)}
              </span>
              <span className={styles.metaDot}>·</span>
              <span className={styles.metaItem}>
                <Clock size={15} />
                {minutes} min de lecture
              </span>
            </div>
          </header>

          {/* ── CONTENU RICHE ────────────────────────────────────── */}
          <div className={styles.contentSection}>
            <div
              className={styles.richContent}
              style={{ maxWidth: "100%", overflow: "hidden" }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <footer className={styles.articleFooter}>
            <button
              className={styles.backBtnFooter}
              onClick={() => navigate("/news")}
            >
              <ArrowLeft size={16} /> Retour aux actualités
            </button>
            <span className={styles.footerCategory}>
              {getCategoryLabel(article.category)}
            </span>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;
