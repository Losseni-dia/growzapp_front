import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiSend } from "react-icons/fi";
import { api } from "../../service/Api";
import styles from "./ProjetMessageThread.module.css";

export interface ProjetMessageDTO {
  id: number;
  auteurId: number;
  auteurNom: string;
  role: "ADMIN" | "INVESTISSEUR";
  contenu: string;
  destinataireIds: number[];
  dateEnvoi: string;
}

interface InvestisseurSimpleDTO {
  id: number;
  nomComplet: string;
}

interface ProjetMessageThreadProps {
  projetId: number;
  isAdmin?: boolean;
}

export default function ProjetMessageThread({
  projetId,
  isAdmin = false,
}: ProjetMessageThreadProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ProjetMessageDTO[]>([]);
  const [destinataires, setDestinataires] = useState<InvestisseurSimpleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [contenu, setContenu] = useState("");
  const [cible, setCible] = useState<"TOUS" | "CIBLES">("TOUS");
  const [cibleIds, setCibleIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  const apiBase = isAdmin
    ? `/api/admin/projets/${projetId}/messages`
    : `/api/projets/${projetId}/messages`;

  const charger = () => {
    return api
      .get<{ data: ProjetMessageDTO[] }>(apiBase)
      .then((res) => setMessages(res.data || []))
      .catch(() =>
        toast.error(t("projet_messages.toast_load_error", "Erreur lors du chargement des messages")),
      );
  };

  useEffect(() => {
    setLoading(true);
    const promises: Promise<any>[] = [charger()];
    if (isAdmin) {
      promises.push(
        api
          .get<{ data: InvestisseurSimpleDTO[] }>(`${apiBase}/destinataires`)
          .then((res) => setDestinataires(res.data || []))
          .catch(() => {}),
      );
    }
    Promise.all(promises).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetId, isAdmin]);

  const toggleCibleId = (id: number) => {
    setCibleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSend = async () => {
    if (contenu.trim().length < 1) {
      toast.error(t("projet_messages.toast_validation", "Le message ne peut pas être vide"));
      return;
    }
    if (isAdmin && cible === "CIBLES" && cibleIds.length === 0) {
      toast.error(t("projet_messages.toast_cible_required", "Choisissez au moins un investisseur"));
      return;
    }
    setSending(true);
    try {
      const body = isAdmin
        ? { contenu: contenu.trim(), destinataireType: cible, destinataireIds: cible === "CIBLES" ? cibleIds : [] }
        : { contenu: contenu.trim() };
      await api.post(apiBase, body);
      setContenu("");
      setCibleIds([]);
      setCible("TOUS");
      await charger();
    } catch (err: any) {
      toast.error(err?.message || t("projet_messages.toast_error", "Erreur lors de l'envoi"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className={styles.thread}><p className={styles.empty}>{t("dashboard.loading")}</p></div>;
  }

  return (
    <div className={styles.thread}>
      <p className={styles.title}>
        {t("projet_messages.title", "Messages investisseurs")}
      </p>

      {messages.length === 0 ? (
        <p className={styles.empty}>{t("projet_messages.empty", "Aucun message pour le moment.")}</p>
      ) : (
        <div className={styles.messages}>
          {messages.map((m) => (
            <div key={m.id} className={`${styles.message} ${styles[`role_${m.role.toLowerCase()}`]}`}>
              <div className={styles.messageHeader}>
                <span className={styles.author}>
                  {m.auteurNom} —{" "}
                  {m.role === "ADMIN"
                    ? t("projet_messages.role_admin", "GrowzApp")
                    : t("projet_messages.role_investisseur", "Investisseur")}
                  {isAdmin && m.role === "ADMIN" && m.destinataireIds.length > 0 && (
                    <span className={styles.destinataireTag}>
                      {" → "}
                      {t("projet_messages.cible_count", { count: m.destinataireIds.length })}
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

      <div className={styles.replyForm}>
        {isAdmin && (
          <div className={styles.cibleChoice}>
            <label>
              <input
                type="radio"
                name={`cible-${projetId}`}
                checked={cible === "TOUS"}
                onChange={() => setCible("TOUS")}
              />
              {t("projet_messages.cible_tous", "Tous les investisseurs")}
            </label>
            <label>
              <input
                type="radio"
                name={`cible-${projetId}`}
                checked={cible === "CIBLES"}
                onChange={() => setCible("CIBLES")}
              />
              {t("projet_messages.cible_cibles", "Investisseurs ciblés")}
            </label>
          </div>
        )}
        {isAdmin && cible === "CIBLES" && (
          <div className={styles.investisseursList}>
            {destinataires.length === 0 ? (
              <span className={styles.empty}>
                {t("projet_messages.aucun_investisseur", "Aucun investisseur sur ce projet.")}
              </span>
            ) : (
              destinataires.map((d) => (
                <label key={d.id} className={styles.investisseurItem}>
                  <input
                    type="checkbox"
                    checked={cibleIds.includes(d.id)}
                    onChange={() => toggleCibleId(d.id)}
                  />
                  {d.nomComplet}
                </label>
              ))
            )}
          </div>
        )}
        <div className={styles.replyBox}>
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder={t("projet_messages.placeholder", "Votre message...") as string}
            rows={2}
            maxLength={2000}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
            <FiSend size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
