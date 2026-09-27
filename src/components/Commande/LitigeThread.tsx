import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiSend } from "react-icons/fi";
import { api } from "../../service/Api";
import styles from "./LitigeThread.module.css";

export interface LitigeMessageDTO {
  id: number;
  auteurId: number;
  auteurNom: string;
  role: "ACHETEUR" | "VENDEUR" | "ADMIN";
  contenu: string;
  dateEnvoi: string;
}

interface LitigeThreadProps {
  commandeId: number;
  statut: string;
  messages: LitigeMessageDTO[];
  apiBase: string; // "/api/market/commandes" ou "/api/admin/market/commandes"
  onSent: () => void;
}

const roleLabelKey: Record<string, string> = {
  ACHETEUR: "growzmarket.litige_thread.role_acheteur",
  VENDEUR: "growzmarket.litige_thread.role_vendeur",
  ADMIN: "growzmarket.litige_thread.role_admin",
};

export default function LitigeThread({ commandeId, statut, messages, apiBase, onSent }: LitigeThreadProps) {
  const { t } = useTranslation();
  const [contenu, setContenu] = useState("");
  const [sending, setSending] = useState(false);

  if (statut !== "LITIGE" && messages.length === 0) return null;

  const handleSend = async () => {
    if (contenu.trim().length < 3) {
      toast.error(t("growzmarket.litige_thread.toast_validation", "Le message doit contenir au moins 3 caractères"));
      return;
    }
    setSending(true);
    try {
      await api.post(`${apiBase}/${commandeId}/litige/messages`, { message: contenu.trim() });
      setContenu("");
      onSent();
    } catch (err: any) {
      toast.error(err.message || t("growzmarket.litige_thread.toast_error", "Erreur lors de l'envoi"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.thread}>
      <p className={styles.title}>{t("growzmarket.litige_thread.title", "Échanges sur le litige")}</p>

      {messages.length === 0 ? (
        <p className={styles.empty}>{t("growzmarket.litige_thread.empty", "Aucun message pour le moment.")}</p>
      ) : (
        <div className={styles.messages}>
          {messages.map((m) => (
            <div key={m.id} className={`${styles.message} ${styles[`role_${m.role.toLowerCase()}`]}`}>
              <div className={styles.messageHeader}>
                <span className={styles.author}>
                  {m.auteurNom} — {t(roleLabelKey[m.role] || "", m.role)}
                </span>
                <span className={styles.date}>
                  {formatDate(new Date(m.dateEnvoi), "dd MMM yyyy HH:mm", { locale: fr })}
                </span>
              </div>
              <p className={styles.content}>{m.contenu}</p>
            </div>
          ))}
        </div>
      )}

      {statut === "LITIGE" && (
        <div className={styles.replyBox}>
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder={t("growzmarket.litige_thread.placeholder", "Votre message...") as string}
            rows={2}
            maxLength={1000}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
            <FiSend size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
