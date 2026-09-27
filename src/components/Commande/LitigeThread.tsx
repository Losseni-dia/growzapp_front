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
  destinataire: "ACHETEUR" | "VENDEUR" | null;
  dateEnvoi: string;
}

interface LitigeThreadProps {
  commandeId: number;
  statut: string;
  messages: LitigeMessageDTO[];
  apiBase: string; // "/api/market/commandes" ou "/api/admin/market/commandes"
  onSent: () => void;
  isAdmin?: boolean;
}

const roleLabelKey: Record<string, string> = {
  ACHETEUR: "growzmarket.litige_thread.role_acheteur",
  VENDEUR: "growzmarket.litige_thread.role_vendeur",
  ADMIN: "growzmarket.litige_thread.role_admin",
};

export default function LitigeThread({
  commandeId,
  statut,
  messages,
  apiBase,
  onSent,
  isAdmin = false,
}: LitigeThreadProps) {
  const { t } = useTranslation();
  const [contenu, setContenu] = useState("");
  const [destinataire, setDestinataire] = useState<"ACHETEUR" | "VENDEUR" | "">("");
  const [sending, setSending] = useState(false);

  if (statut !== "LITIGE" && messages.length === 0) return null;

  const handleSend = async () => {
    if (contenu.trim().length < 3) {
      toast.error(t("growzmarket.litige_thread.toast_validation", "Le message doit contenir au moins 3 caractères"));
      return;
    }
    if (isAdmin && !destinataire) {
      toast.error(t("growzmarket.litige_thread.toast_destinataire_required", "Choisissez un destinataire (acheteur ou vendeur)"));
      return;
    }
    setSending(true);
    try {
      const body = isAdmin ? { message: contenu.trim(), destinataire } : { message: contenu.trim() };
      await api.post(`${apiBase}/${commandeId}/litige/messages`, body);
      setContenu("");
      setDestinataire("");
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
                  {isAdmin && m.role === "ADMIN" && m.destinataire && (
                    <span className={styles.destinataireTag}>
                      {" → "}
                      {t(roleLabelKey[m.destinataire] || "", m.destinataire)}
                    </span>
                  )}
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
        <div className={styles.replyForm}>
          {isAdmin && (
            <div className={styles.destinataireChoice}>
              <span>{t("growzmarket.litige_thread.destinataire_label", "Envoyer à :")}</span>
              <label>
                <input
                  type="radio"
                  name={`destinataire-${commandeId}`}
                  checked={destinataire === "ACHETEUR"}
                  onChange={() => setDestinataire("ACHETEUR")}
                />
                {t("growzmarket.litige_thread.role_acheteur", "Acheteur")}
              </label>
              <label>
                <input
                  type="radio"
                  name={`destinataire-${commandeId}`}
                  checked={destinataire === "VENDEUR"}
                  onChange={() => setDestinataire("VENDEUR")}
                />
                {t("growzmarket.litige_thread.role_vendeur", "Vendeur")}
              </label>
            </div>
          )}
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
        </div>
      )}
    </div>
  );
}
