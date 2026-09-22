import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiClock, FiMail, FiSend, FiTrash2 } from "react-icons/fi";
import { api } from "../../../service/Api";
import styles from "./ContactAdminPage.module.css";

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

type Filtre = "TOUS" | "NOUVEAU" | "TRAITE";

export default function ContactAdminPage() {
  const { t } = useTranslation();

  const [threads, setThreads] = useState<ContactMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [selected, setSelected] = useState<ContactMessageDTO | null>(null);
  const [reponseTexte, setReponseTexte] = useState("");
  const [sending, setSending] = useState(false);

  const loadThreads = () => {
    setLoading(true);
    const url =
      filtre === "TOUS" ? "/api/admin/contact" : `/api/admin/contact?statut=${filtre}`;
    api
      .get<{ data: ContactMessageDTO[] }>(url)
      .then((res) => setThreads(res.data || []))
      .catch(() => toast.error(t("admin.contact.toast_load_error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtre]);

  const openThread = (th: ContactMessageDTO) => {
    setSelected(th);
    setReponseTexte("");
  };

  const handleRepondre = async () => {
    if (!selected || reponseTexte.trim().length < 3) {
      toast.error(t("admin.contact.toast_validation_error"));
      return;
    }
    setSending(true);
    try {
      await api.post(`/api/admin/contact/${selected.id}/repondre`, {
        reponse: reponseTexte,
      });
      toast.success(t("admin.contact.toast_sent"));
      setSelected(null);
      loadThreads();
    } catch (err: any) {
      toast.error(err.message || t("admin.contact.toast_send_error"));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(t("admin.contact.confirm_delete") as string)) return;
    try {
      await api.delete(`/api/admin/contact/${id}`);
      setThreads((prev) => prev.filter((th) => th.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success(t("admin.contact.toast_deleted"));
    } catch (err: any) {
      toast.error(err.message || t("admin.contact.toast_delete_error"));
    }
  };

  const nouveauxCount = threads.filter((m) => m.statut === "NOUVEAU").length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FiMail /> {t("admin.contact.title")}
        </h1>
        <p>{t("admin.contact.subtitle", { count: nouveauxCount })}</p>
      </div>

      <div className={styles.filters}>
        {(["TOUS", "NOUVEAU", "TRAITE"] as Filtre[]).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filtre === f ? styles.filterBtnActive : ""}`}
            onClick={() => setFiltre(f)}
          >
            {t(`admin.contact.filter_${f.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>{t("dashboard.loading")}</div>
      ) : threads.length === 0 ? (
        <div className={styles.emptyState}>
          <FiMail size={48} />
          <p>{t("admin.contact.empty")}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("admin.contact.table.user")}</th>
                <th>{t("admin.contact.table.subject")}</th>
                <th>{t("admin.contact.table.date")}</th>
                <th>{t("admin.contact.table.status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {threads.map((th) => (
                <tr key={th.id} onClick={() => openThread(th)} className={styles.row}>
                  <td>
                    <div>{th.userNom}</div>
                    <div className={styles.userEmail}>{th.userEmail}</div>
                  </td>
                  <td>{th.sujet}</td>
                  <td>
                    {formatDate(new Date(th.dateEnvoi), "dd MMM yyyy HH:mm", { locale: fr })}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        th.statut === "TRAITE" ? styles.badgeTraite : styles.badgeNouveau
                      }`}
                    >
                      {th.statut === "TRAITE" ? (
                        <>
                          <FiCheckCircle size={12} /> {t("admin.contact.filter_traite")}
                        </>
                      ) : (
                        <>
                          <FiClock size={12} /> {t("admin.contact.filter_nouveau")}
                        </>
                      )}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.btnOpen}>{t("admin.contact.btn_open")}</button>
                    <button
                      className={styles.btnDelete}
                      onClick={(e) => handleDelete(th.id, e)}
                      title={t("admin.contact.btn_delete") as string}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{selected.sujet}</h2>
            <p className={styles.modalMeta}>
              {selected.userNom} — {selected.userEmail} —{" "}
              {formatDate(new Date(selected.dateEnvoi), "dd MMM yyyy HH:mm", { locale: fr })}
            </p>
            <div className={styles.originalMessage}>{selected.message}</div>

            {selected.reponses.map((r) => (
              <div
                key={r.id}
                className={r.isAdmin ? styles.adminReply : styles.userReply}
              >
                <p className={styles.replyMeta}>
                  <strong>{r.isAdmin ? r.auteurNom : selected.userNom}</strong> —{" "}
                  {formatDate(new Date(r.dateEnvoi), "dd MMM yyyy HH:mm", { locale: fr })}
                </p>
                <p className={styles.replyContenu}>{r.contenu}</p>
              </div>
            ))}

            <label className={styles.reponseLabel}>{t("admin.contact.field_reply")}</label>
            <textarea
              className={styles.reponseInput}
              rows={4}
              value={reponseTexte}
              onChange={(e) => setReponseTexte(e.target.value)}
              placeholder={t("admin.contact.field_reply_placeholder") as string}
              maxLength={3000}
            />

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setSelected(null)}>
                {t("admin.contact.btn_cancel")}
              </button>
              <button className={styles.btnSend} onClick={handleRepondre} disabled={sending}>
                <FiSend /> {sending ? t("contact_page.btn_sending") : t("admin.contact.btn_reply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
