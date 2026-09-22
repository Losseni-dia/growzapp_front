import { format as formatDate } from "date-fns";
import { enUS, es, fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiCheckCircle, FiClock, FiMail, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";
import { api } from "../../../service/Api";
import { ApiResponse } from "../../../types/common";
import styles from "./ContactPage.module.css";

interface ContactMessageDTO {
  id: number;
  userId: number;
  userNom: string;
  userEmail: string | null;
  sujet: string;
  message: string;
  statut: "NOUVEAU" | "TRAITE";
  reponse: string | null;
  responduPar: string | null;
  dateEnvoi: string;
  dateReponse: string | null;
}

export default function ContactPage() {
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState<ContactMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const locales: any = { fr, en: enUS, es };
  const currentLocale = locales[i18n.language] || fr;

  const loadMessages = () => {
    api
      .get<ApiResponse<ContactMessageDTO[]>>("/api/contact/mes-messages")
      .then((res) => setMessages(res.data || []))
      .catch(() => toast.error(t("contact_page.toast_load_error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
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
      loadMessages();
    } catch (err: any) {
      toast.error(err.message || t("contact_page.toast_send_error"));
    } finally {
      setSending(false);
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
      ) : messages.length === 0 ? (
        <div className={styles.emptyState}>
          <FiMail size={48} />
          <p>{t("contact_page.empty")}</p>
        </div>
      ) : (
        <div className={styles.messageList}>
          {messages.map((m) => (
            <div key={m.id} className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <strong>{m.sujet}</strong>
                <span
                  className={`${styles.badge} ${
                    m.statut === "TRAITE" ? styles.badgeTraite : styles.badgeNouveau
                  }`}
                >
                  {m.statut === "TRAITE" ? (
                    <>
                      <FiCheckCircle size={12} /> {t("contact_page.status_treated")}
                    </>
                  ) : (
                    <>
                      <FiClock size={12} /> {t("contact_page.status_new")}
                    </>
                  )}
                </span>
              </div>
              <p className={styles.messageBody}>{m.message}</p>
              <p className={styles.messageDate}>
                {formatDate(new Date(m.dateEnvoi), "dd MMM yyyy 'à' HH:mm", {
                  locale: currentLocale,
                })}
              </p>

              {m.reponse && (
                <div className={styles.reponseBlock}>
                  <p className={styles.reponseLabel}>
                    {t("contact_page.reply_label", { name: m.responduPar || "GrowzApp" })}
                  </p>
                  <p className={styles.reponseTexte}>{m.reponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
