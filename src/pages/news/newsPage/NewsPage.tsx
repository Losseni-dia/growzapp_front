import { Link } from "react-router-dom";
import {
  Newspaper,
  PenLine,
  Edit,
  Trash2,
  Search,
  Clock,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { News, newsService } from "../../../service/newsService";
import { useAuth } from "../../../components/Context/AuthContext";
import styles from "./NewsPage.module.css";

// ─── Image URL — gère chemins relatifs via proxy Vite ────────────────────────
const getImageUrl = (url: string): string => {
  if (!url) return "/placeholder-news.jpg";
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return "/" + url;
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

const getPlainText = (html: string): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const readingTime = (html: string): number =>
  Math.max(1, Math.ceil(getPlainText(html).split(/\s+/).length / 200));

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR", {
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
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
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
        console.log("NEWS RAW:", JSON.stringify(res)?.substring(0, 300));
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        console.log(
          "NEWS articles:",
          data.length,
          "| hero imageUrl:",
          data[0]?.imageUrl,
        );
        setArticles(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cet article ?")) return;
    try {
      await newsService.delete(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
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
          <h1>Actualités & Opportunités</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un article..."
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
            <Link to="/admin/news/new" className={styles.adminBtn}>
              <PenLine size={18} /> Écrire un article
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
              <span className={styles.catLabel}>{cat.label}</span>
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
          <h3>Aucun article trouvé</h3>
          <p>Essayez une autre catégorie ou modifiez votre recherche.</p>
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
                      {meta.icon} {meta.label}
                    </span>
                  );
                })()}
              </div>
              <div className={styles.heroContent}>
                <div className={styles.heroMeta}>
                  <span className={styles.metaDate}>
                    {formatDate((hero as any).createdAt || "")}
                  </span>
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaRead}>
                    <Clock size={13} /> {readingTime(hero.content)} min
                  </span>
                </div>
                <h2 className={styles.heroTitle}>{hero.title}</h2>
                <p className={styles.heroExcerpt}>
                  {getPlainText(hero.content).substring(0, 200)}...
                </p>
                <div className={styles.heroActions}>
                  <Link to={`/news/${hero.id}`} className={styles.heroCta}>
                    Lire l'article →
                  </Link>
                  {(canEdit || canDelete) && (
                    <div className={styles.heroAdmin}>
                      {canEdit && (
                        <Link
                          to={`/admin/news/edit/${hero.id}`}
                          className={styles.editBtn}
                        >
                          <Edit size={14} /> Modifier
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(hero.id)}
                          className={styles.deleteBtn}
                        >
                          <Trash2 size={14} /> Supprimer
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
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  <div className={styles.content}>
                    <div className={styles.cardMeta}>
                      <span>
                        {formatDate((article as any).createdAt || "")}
                      </span>
                      <span className={styles.metaDot}>·</span>
                      <span>
                        <Clock size={11} /> {readingTime(article.content)} min
                      </span>
                    </div>
                    <h2>{article.title}</h2>
                    <p>{getPlainText(article.content).substring(0, 130)}...</p>
                    <Link
                      to={`/news/${article.id}`}
                      className={styles.readMore}
                    >
                      Lire la suite
                    </Link>
                    {(canEdit || canDelete) && (
                      <div className={styles.adminActions}>
                        {canEdit && (
                          <Link
                            to={`/admin/news/edit/${article.id}`}
                            className={styles.editBtnSm}
                          >
                            <Edit size={14} /> Modifier
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(article.id)}
                            className={styles.deleteBtnSm}
                          >
                            <Trash2 size={14} /> Supprimer
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
