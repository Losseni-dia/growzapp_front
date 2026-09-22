import { format as formatDate } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiPhone,
  FiSend,
  FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import styles from "./ContactPage.module.css";

interface ContactReplyDTO {
  id: number;
  auteurId: number;
  auteurNom: string;
  isAdmin: boolean;
  contenu: string;
  dateEnvoi: string;
}

interface ContactMessageDTO {
  id: number;
  userId: number;
  userNom: string;
  userEmail: string | null;
  sujet: string;
  message: string;
  statut: "NOUVEAU" | "TRAITE";
  dateEnvoi: string;
  reponses: ContactReplyDTO[];
}

export default function ContactPage() {
  const { t, i18n } = useTranslation();

  const [threads, setThreads] = useState<ContactMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyingId, setReplyingId] = useState<number | null>(null);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const loadThreads = () => {
    api
      .get<ApiResponse<ContactMessageDTO[]>>("/api/contact/mes-messages")
      .then((res) => setThreads(res.data || []))
      .catch(() => toast.error(t("contact_page.toast_load_error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sujet.trim().length < 3 || message.trim().length < 10) {
      toast.error(t("contact_page.toast_validation_error"));
      return;
    }
    setSending(true);
    try {
      await api.post("/api/contact", { sujet, message });
      toast.success(t("contact_page.toast_sent"));
      setSujet("");
      setMessage("");
      loadThreads();
    } catch (err: any) {
      toast.error(err.message || t("contact_page.toast_send_error"));
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (threadId: number) => {
    const contenu = (replyDrafts[threadId] || "").trim();
    if (contenu.length < 3) {
      toast.error(t("contact_page.toast_reply_validation_error"));
      return;
    }
    setReplyingId(threadId);
    try {
      await api.post(`/api/contact/${threadId}/repondre`, { message: contenu });
      setReplyDrafts((prev) => ({ ...prev, [threadId]: "" }));
      loadThreads();
    } catch (err: any) {
      toast.error(err.message || t("contact_page.toast_send_error"));
    } finally {
      setReplyingId(null);
    }
  };

  const handleDelete = async (threadId: number) => {
    if (!window.confirm(t("contact_page.confirm_delete") as string)) return;
    try {
      await api.delete(`/api/contact/${threadId}`);
      setThreads((prev) => prev.filter((th) => th.id !== threadId));
      toast.success(t("contact_page.toast_deleted"));
    } catch (err: any) {
      toast.error(err.message || t("contact_page.toast_delete_error"));
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/mon-espace" className={styles.backLink}>
        <FiArrowLeft /> {t("my_profile")}
      </Link>

      <div className={styles.header}>
        <h1>
          <FiMail /> {t("contact_page.title")}
        </h1>
        <p>{t("contact_page.subtitle")}</p>
        <div className={styles.directContact}>
          <a href="mailto:losdiakite@gmail.com" className={styles.directContactItem}>
            <FiMail /> losdiakite@gmail.com
          </a>
          <a href="tel:0465202022" className={styles.directContactItem}>
            <FiPhone /> 04 65 20 20 22
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="sujet">{t("contact_page.field_subject")}</label>
          <input
            id="sujet"
            type="text"
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder={t("contact_page.field_subject_placeholder") as string}
            maxLength={150}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="message">{t("contact_page.field_message")}</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("contact_page.field_message_placeholder") as string}
            maxLength={3000}
            rows={5}
            required
          />
        </div>
        <button type="submit" className={styles.btnSubmit} disabled={sending}>
          <FiSend /> {sending ? t("contact_page.btn_sending") : t("contact_page.btn_send")}
        </button>
      </form>

      <h2 className={styles.historyTitle}>{t("contact_page.history_title")}</h2>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : threads.length === 0 ? (
        <div className={styles.emptyState}>
          <FiMail size={48} />
          <p>{t("contact_page.empty")}</p>
        </div>
      ) : (
        <div className={styles.messageList}>
          {threads.map((th) => (
            <div key={th.id} className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <strong>{th.sujet}</strong>
                <div className={styles.messageHeaderRight}>
                  <span
                    className={`${styles.badge} ${
                      th.statut === "TRAITE" ? styles.badgeTraite : styles.badgeNouveau
                    }`}
                  >
                    {th.statut === "TRAITE" ? (
                      <>
                        <FiCheckCircle size={12} /> {t("contact_page.status_treated")}
                      </>
                    ) : (
                      <>
                        <FiClock size={12} /> {t("contact_page.status_new")}
                      </>
                    )}
                  </span>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDelete(th.id)}
                    title={t("contact_page.btn_delete") as string}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              <p className={styles.messageBody}>{th.message}</p>
              <p className={styles.messageDate}>
                {formatDate(new Date(th.dateEnvoi), "dd MMM yyyy 'à' HH:mm", {
                  locale: currentLocale,
                })}
              </p>

              {th.reponses.map((r) => (
                <div
                  key={r.id}
                  className={r.isAdmin ? styles.reponseBlock : styles.userReplyBlock}
                >
                  <p className={styles.reponseLabel}>
                    {r.isAdmin
                      ? t("contact_page.reply_label", { name: r.auteurNom || "GrowzApp" })
                      : t("contact_page.my_reply_label")}
                  </p>
                  <p className={styles.reponseTexte}>{r.contenu}</p>
                  <p className={styles.messageDate}>
                    {formatDate(new Date(r.dateEnvoi), "dd MMM yyyy 'à' HH:mm", {
                      locale: currentLocale,
                    })}
                  </p>
                </div>
              ))}

              <div className={styles.replyForm}>
                <textarea
                  className={styles.replyInput}
                  rows={2}
                  value={replyDrafts[th.id] || ""}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [th.id]: e.target.value }))
                  }
                  placeholder={t("contact_page.reply_placeholder") as string}
                  maxLength={3000}
                />
                <button
                  className={styles.btnReplySmall}
                  onClick={() => handleReply(th.id)}
                  disabled={replyingId === th.id}
                >
                  <FiSend size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
