import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FiBell } from "react-icons/fi";
import { format } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { api } from "../../../service/Api";
import styles from "./NotificationsAdminPage.module.css";

interface NotificationAdmin {
  id: number;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  motif?: string;
  destinataireNom: string;
  destinataireEmail: string;
}

interface NotificationsPage {
  content: NotificationAdmin[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export default function NotificationsAdminPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const { data, isLoading, isError } = useQuery<NotificationsPage>({
    queryKey: ["admin-notifications", page],
    queryFn: async () => {
      const res = await api.get<{ data: NotificationsPage }>(
        `/api/admin/notifications?page=${page}&size=20`,
      );
      return res.data;
    },
  });

  const notifications = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <FiBell /> {t("admin.notifications.title")}
        </h1>
        <p>
          {t("admin.notifications.subtitle", {
            count: data?.totalElements ?? 0,
          })}
        </p>
      </header>

      {isLoading ? (
        <div className={styles.loading}>{t("common.loading")}</div>
      ) : isError ? (
        <div className={styles.empty}>{t("admin.notifications.load_error")}</div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>{t("admin.notifications.empty")}</div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <div key={n.id} className={styles.row}>
              <span
                className={`${styles.statusDot} ${n.isRead ? styles.statusRead : styles.statusUnread}`}
                title={
                  n.isRead
                    ? t("admin.notifications.read")
                    : t("admin.notifications.unread")
                }
              />
              <div className={styles.rowBody}>
                <div className={styles.rowTop}>
                  <strong>{n.title}</strong>
                  <span className={styles.date}>
                    {format(new Date(n.date), "dd MMM yyyy HH:mm", {
                      locale: currentLocale,
                    })}
                  </span>
                </div>
                <p className={styles.content}>{n.content}</p>
                <div className={styles.recipient}>
                  {n.destinataireNom} · {n.destinataireEmail}
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
