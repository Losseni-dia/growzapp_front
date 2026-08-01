import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit2, FiTrash2, FiRss, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { News, newsService, NEWS_CATEGORIES } from "../../../service/newsService";
import { api, buildFileUrl } from "../../../service/Api";
import styles from "./NewsAdminPage.module.css";

const getImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return buildFileUrl(url.startsWith("/") ? url : "/" + url);
};

interface NewsPage {
  content: News[];
  totalPages: number;
  totalElements: number;
}

export default function NewsAdminPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery<NewsPage>({
    queryKey: ["admin-news", page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "12",
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await api.get<{ data: NewsPage }>(`/api/news/admin?${params}`);
      return res.data;
    },
  });

  const articles = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleDelete = async (article: News) => {
    if (!window.confirm(t("admin.news.confirm_delete", { title: article.title }))) {
      return;
    }
    setDeletingId(article.id);
    try {
      await newsService.delete(article.id);
      toast.success(t("admin.news.delete_success"));
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    } catch (err: any) {
      toast.error(err.message || t("admin.news.delete_error"));
    } finally {
      setDeletingId(null);
    }
  };

  const categoryLabel = (key: string) =>
    NEWS_CATEGORIES.find((c) => c.key === key)?.label || key;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>
            <FiRss /> {t("admin.news.title")}
          </h1>
          <p>{t("admin.news.subtitle", { count: totalElements })}</p>
        </div>
        <Link to="/admin/news/new" className={styles.createBtn}>
          <FiPlus /> {t("admin.news.create")}
        </Link>
      </header>

      <div className={styles.searchBox}>
        <FiSearch size={15} />
        <input
          type="text"
          placeholder={t("admin.news.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className={styles.loading}>{t("common.loading")}</div>
      ) : articles.length === 0 ? (
        <div className={styles.empty}>{t("admin.news.empty")}</div>
      ) : (
        <div className={styles.grid}>
          {articles.map((article) => (
            <div key={article.id} className={styles.card}>
              {article.imageUrl && (
                <img
                  src={getImageUrl(article.imageUrl)}
                  alt=""
                  className={styles.thumb}
                />
              )}
              <div className={styles.cardBody}>
                <span className={styles.category}>
                  {categoryLabel(article.category)}
                </span>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <span className={styles.date}>
                  {article.createdAt
                    ? format(new Date(article.createdAt), "dd MMM yyyy", {
                        locale: currentLocale,
                      })
                    : ""}
                </span>
                <div className={styles.cardActions}>
                  <Link
                    to={`/admin/news/edit/${article.id}`}
                    className={styles.actionBtn}
                  >
                    <FiEdit2 size={15} /> {t("admin.news.edit")}
                  </Link>
                  <button
                    className={styles.actionBtnDanger}
                    onClick={() => handleDelete(article)}
                    disabled={deletingId === article.id}
                  >
                    <FiTrash2 size={15} />
                    {deletingId === article.id
                      ? t("admin.news.deleting")
                      : t("admin.news.delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ‹
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
