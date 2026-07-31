import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit2, FiTrash2, FiRss } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { News, newsService, NEWS_CATEGORIES } from "../../../service/newsService";
import { buildFileUrl } from "../../../service/Api";
import styles from "./NewsAdminPage.module.css";

const getImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return buildFileUrl(url.startsWith("/") ? url : "/" + url);
};

export default function NewsAdminPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const { data: articles = [], isLoading } = useQuery<News[]>({
    queryKey: ["admin-news"],
    queryFn: () => newsService.getAll(),
  });

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
          <p>{t("admin.news.subtitle", { count: articles.length })}</p>
        </div>
        <Link to="/admin/news/new" className={styles.createBtn}>
          <FiPlus /> {t("admin.news.create")}
        </Link>
      </header>

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
    </div>
  );
}
