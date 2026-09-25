import { Link } from "react-router-dom";
import {
  Newspaper,
  PenLine,
  Edit,
  Trash2,
  Clock,
  X,
  Languages,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { News, newsService } from "../../../service/newsService";
import { useAuth } from "../../../components/Context/AuthContext";
import styles from "./NewsPage.module.css";
import { buildFileUrl } from "../../../service/Api";

// ─── Image URL — gère chemins relatifs via proxy Vite ────────────────────────
const getImageUrl = (url: string): string => {
  if (!url) return "/placeholder-news.jpg";
  if (url.startsWith("http")) return url;
  return buildFileUrl(url.startsWith("/") ? url : "/" + url);
};

// ─── Catégories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "", label: "Tout", icon: "🌍", color: "#1A6B3C", bg: "#E8F5EE" },
  {
    key: "PLATFORM_UPDATE",
    label: "Plateforme",
    icon: "🚀",
    color: "#1565C0",
    bg: "#E3F2FD",
  },
  {
    key: "INVESTMENT_OPPORTUNITY",
    label: "Opportunités",
    icon: "💰",
    color: "#F57C00",
    bg: "#FFF3E0",
  },
  {
    key: "PERFORMANCE_REPORT",
    label: "Performance",
    icon: "📊",
    color: "#6A1B9A",
    bg: "#F3E5F5",
  },
  {
    key: "EDUCATION",
    label: "Éducation",
    icon: "📚",
    color: "#00838F",
    bg: "#E0F7FA",
  },
  {
    key: "SECURITY",
    label: "Sécurité",
    icon: "🛡️",
    color: "#C62828",
    bg: "#FFEBEE",
  },
];

const truncateAtWord = (text: string, maxLen: number): string =>
  text.length <= maxLen ? text : text.slice(0, maxLen).replace(/\s+\S*$/, "");

const getPlainText = (html: string): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const readingTime = (html: string): number =>
  Math.max(1, Math.ceil(getPlainText(html).split(/\s+/).length / 200));

const formatDate = (
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string,
  lang: string,
): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return t("news_page.date_now", { defaultValue: "À l'instant" });
  if (diff < 3600)
    return t("news_page.date_minutes_ago", { defaultValue: "Il y a {{count}} min", count: Math.floor(diff / 60) });
  if (diff < 86400)
    return t("news_page.date_hours_ago", { defaultValue: "Il y a {{count}}h", count: Math.floor(diff / 3600) });
  if (diff < 604800)
    return t("news_page.date_days_ago", { defaultValue: "Il y a {{count}} j", count: Math.floor(diff / 86400) });
  return date.toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getCategoryMeta = (key: string) =>
  CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImg} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonBadge} />
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonText} />
      <div className={styles.skeletonText} style={{ width: "70%" }} />
      <div className={styles.skeletonBtn} />
    </div>
  </div>
);

const NewsPage = () => {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [retraducing, setRetraducing] = useState(false);
  const { user } = useAuth();

  const canPublish = user?.roles?.some((r: string) =>
    ["ADMIN", "COMMUNICANT"].includes(r),
  );
  const canEdit = user?.roles?.some((r: string) =>
    ["ADMIN", "COMMUNICANT"].includes(r),
  );
  const canDelete = user?.roles?.some((r: string) => ["ADMIN"].includes(r));

  useEffect(() => {
    newsService
      .getAll()
      .then((res: any) => {
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        setArticles(data);
      })
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("news_page.confirm_delete", "Supprimer cet article ?") as string)) return;
    try {
      await newsService.delete(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert(t("news_page.toast_delete_error", "Erreur lors de la suppression."));
    }
  };

  const handleRetraduireTout = async () => {
    setRetraducing(true);
    try {
      const res = await newsService.retraduireTout();
      toast.success(res.message || t("news_page.toast_retraduit", "Articles retraduits"));
    } catch (err: any) {
      toast.error(err.message || t("news_page.toast_retraduit_error", "Erreur lors de la retraduction"));
    } finally {
      setRetraducing(false);
    }
  };

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { "": articles.length };
    articles.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [articles]);

  const filtered = useMemo(() => {
    let list = articles;
    if (activeCategory)
      list = list.filter((a) => a.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          getPlainText(a.content).toLowerCase().includes(q),
      );
    }
    return list;
  }, [articles, activeCategory, search]);

  const [hero, ...rest] = filtered;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Newspaper size={32} className={styles.icon} />
          <h1>{t("news_page.title", "Actualités & Opportunités")}</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder={t("news_page.search_placeholder", "Rechercher un article...") as string}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {canPublish && (
            <button onClick={handleRetraduireTout} className={styles.adminBtn} disabled={retraducing}>
              <Languages size={18} />{" "}
              {retraducing
                ? t("news_page.retraduire_loading", "Retraduction…")
                : t("news_page.retraduire_tout", "Retraduire les articles (DeepL)")}
            </button>
          )}
          {canPublish && (
            <Link to="/admin/news/new" className={styles.adminBtn}>
              <PenLine size={18} /> {t("news_page.write_article", "Écrire un article")}
            </Link>
          )}
        </div>
      </header>

      {/* CATÉGORIES */}
      <div className={styles.categoriesGrid}>
        {CATEGORIES.map((cat) => {
          const count = countByCategory[cat.key] ?? 0;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              className={`${styles.catCard} ${isActive ? styles.catCardActive : ""}`}
              onClick={() => setActiveCategory(cat.key)}
              style={
                {
                  "--cat-color": cat.color,
                  "--cat-bg": cat.bg,
                } as React.CSSProperties
              }
            >
              <span className={styles.catIcon}>{cat.icon}</span>
              <span className={styles.catLabel}>
                {t(`news_page.category.${cat.key || "ALL"}`, cat.label)}
              </span>
              <span className={styles.catCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENU */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span style={{ fontSize: "3rem" }}>📭</span>
          <h3>{t("news_page.empty_title", "Aucun article trouvé")}</h3>
          <p>{t("news_page.empty_text", "Essayez une autre catégorie ou modifiez votre recherche.")}</p>
        </div>
      ) : (
        <>
          {/* HERO */}
          {hero && !search && (
            <article className={styles.hero}>
              <div className={styles.heroImg}>
                {hero.imageUrl ? (
                  <img
                    src={getImageUrl(hero.imageUrl)}
                    alt={hero.title}
                    onError={(e) => {
                      console.log("Hero image error:", hero.imageUrl);
                      (e.target as HTMLImageElement).src =
                        "/placeholder-news.jpg";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#e8f5ee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                    }}
                  >
                    📰
                  </div>
                )}
                <div className={styles.heroOverlay} />
                {(() => {
                  const meta = getCategoryMeta(hero.category);
                  return (
                    <span
                      className={styles.heroBadge}
                      style={{ background: meta.color }}
                    >
                      {meta.icon} {t(`news_page.category.${hero.category}`, meta.label)}
                    </span>
                  );
                })()}
              </div>
              <div className={styles.heroContent}>
                <div className={styles.heroMeta}>
                  <span className={styles.metaDate}>
                    {formatDate((hero as any).createdAt || "", t, i18n.language)}
                  </span>
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaRead}>
                    <Clock size={13} />{" "}
                    {t("news_page.reading_time", "{{count}} min", { count: readingTime(hero.content) })}
                  </span>
                </div>
                <h2 className={styles.heroTitle}>{hero.title}</h2>
                <p className={styles.heroExcerpt}>
                  {truncateAtWord(getPlainText(hero.content), 200)}...
                </p>
                <div className={styles.heroActions}>
                  <Link to={`/news/${hero.id}`} className={styles.heroCta}>
                    {t("news_page.read_article", "Lire l'article →")}
                  </Link>
                  {(canEdit || canDelete) && (
                    <div className={styles.heroAdmin}>
                      {canEdit && (
                        <Link
                          to={`/admin/news/edit/${hero.id}`}
                          className={styles.editBtn}
                        >
                          <Edit size={14} /> {t("news_page.edit", "Modifier")}
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(hero.id)}
                          className={styles.deleteBtn}
                        >
                          <Trash2 size={14} /> {t("news_page.delete", "Supprimer")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )}

          {/* GRILLE */}
          <div className={styles.grid}>
            {(search ? filtered : rest).map((article) => {
              const meta = getCategoryMeta(article.category);
              return (
                <article key={article.id} className={styles.card}>
                  <div className={styles.imageWrapper}>
                    <img
                      src={getImageUrl(article.imageUrl)}
                      alt={article.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-news.jpg";
                      }}
                    />
                    <span
                      className={styles.cardBadge}
                      style={{ background: meta.color }}
                    >
                      {meta.icon} {t(`news_page.category.${article.category}`, meta.label)}
                    </span>
                  </div>
                  <div className={styles.content}>
                    <div className={styles.cardMeta}>
                      <span>
                        {formatDate((article as any).createdAt || "", t, i18n.language)}
                      </span>
                      <span className={styles.metaDot}>·</span>
                      <span>
                        <Clock size={11} />{" "}
                        {t("news_page.reading_time", "{{count}} min", { count: readingTime(article.content) })}
                      </span>
                    </div>
                    <h2>{article.title}</h2>
                    <p>{truncateAtWord(getPlainText(article.content), 130)}...</p>
                    <Link
                      to={`/news/${article.id}`}
                      className={styles.readMore}
                    >
                      {t("news_page.read_more", "Lire la suite")}
                    </Link>
                    {(canEdit || canDelete) && (
                      <div className={styles.adminActions}>
                        {canEdit && (
                          <Link
                            to={`/admin/news/edit/${article.id}`}
                            className={styles.editBtnSm}
                          >
                            <Edit size={14} /> {t("news_page.edit", "Modifier")}
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(article.id)}
                            className={styles.deleteBtnSm}
                          >
                            <Trash2 size={14} /> {t("news_page.delete", "Supprimer")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default NewsPage;
