import { Bell, Inbox, X, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../../service/notificationService";
import { Notification } from "../../../types/notification";
import styles from "./NotificationBell.module.css";
import { api } from "../../../service/Api";

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [popupNotif, setPopupNotif] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const [data, count] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications((list) =>
        JSON.stringify(list) !== JSON.stringify(data) ? data : list,
      );
      setUnreadCount(count);
    } catch (err) {
      console.error("Erreur de chargement des notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (n: Notification) => {
    if (!n.read) {
      try {
        await notificationService.markAsRead(n.id);
        setNotifications(
          notifications.map((item) =>
            item.id === n.id ? { ...item, read: true } : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Erreur marquage lue", err);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Erreur marquage global comme lu", err);
    }
  };

  const handleBellClick = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getMotifLabel = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes("refus") || lower.includes("reject") || lower.includes("rechaz"))
      return t("notifications.motif_label_refus", "Motif du refus");
    if (
      lower.includes("versement") ||
      lower.includes("virement") ||
      lower.includes("payment") ||
      lower.includes("pago")
    )
      return t("notifications.motif_label_versement", "Motif du versement");
    return t("notifications.motif_label_default", "Motif");
  };

  // projetSlug peut contenir soit un simple slug de projet ("ferme-solaire"),
  // soit un chemin absolu complet ("/news/12", "/admin/investissements") —
  // dans ce second cas on navigue directement dessus sans le préfixer par
  // "/projet/". Généralisé au-delà du seul cas "/news/" pour permettre aux
  // notifications admin (ex: investissement en attente) de pointer
  // précisément vers l'écran d'action concerné plutôt que la fiche projet.
  const isAbsolutePathNotif = (n: Notification) =>
    n.projetSlug?.startsWith("/") ?? false;

  // Sous-cas spécifique pour le libellé du bouton ("Lire l'article")
  const isNewsNotif = (n: Notification) =>
    n.projetSlug?.startsWith("/news/") ?? false;

  const handleNotifClick = async (n: Notification) => {
    await markAsRead(n);

    // Notification facture → ouvre directement le téléchargement de la facture
    if (n.factureId) {
      navigate(`/mes-factures?open=${n.factureId}`);
      setIsOpen(false);
      return;
    }

    // Notification avec motif → popup
    if (n.motif) {
      setIsOpen(false);
      setPopupNotif(n);
      return;
    }

    // Chemin absolu déjà fourni (actualité "/news/{id}", écran admin
    // "/admin/investissements", etc.) → navigation directe sans préfixe
    if (isAbsolutePathNotif(n)) {
      navigate(n.projetSlug!);
      setIsOpen(false);
      return;
    }

    // Notification projet → /projet/{slug}
    if (n.projetSlug) {
      navigate(`/projet/${n.projetSlug}`);
      setIsOpen(false);
      return;
    }

    // Fallback par ID
    if (n.projetId) {
      try {
        const res = await api.get<{ data: { slug: string } }>(
          `/api/projets/${n.projetId}`,
        );
        navigate(`/projet/${res.data.slug}`);
      } catch {
        navigate("/projets");
      }
      setIsOpen(false);
    }
  };

  const handlePopupNavigation = async () => {
    if (!popupNotif) return;
    setPopupNotif(null);

    if (isAbsolutePathNotif(popupNotif)) {
      navigate(popupNotif.projetSlug!);
      return;
    }
    if (popupNotif.projetSlug) {
      navigate(`/projet/${popupNotif.projetSlug}`);
      return;
    }
    if (popupNotif.projetId) {
      try {
        const res = await api.get<{ data: { slug: string } }>(
          `/api/projets/${popupNotif.projetId}`,
        );
        navigate(`/projet/${res.data.slug}`);
      } catch {
        navigate("/projets");
      }
    }
  };

  // Label du hint selon le type de notification
  const getHint = (n: Notification) => {
    if (n.factureId) return t("notifications.hint_facture", "Ouvrir la facture →");
    if (n.motif) return t("notifications.hint_motif", "Voir le motif →");
    if (isNewsNotif(n)) return t("notifications.hint_news", "Lire l'article →");
    if (isAbsolutePathNotif(n)) return t("notifications.hint_view", "Voir →");
    if (n.projetId || n.projetSlug) return t("notifications.hint_projet", "Voir le projet →");
    return null;
  };

  // Label du bouton popup
  const getPopupBtnLabel = (n: Notification) => {
    if (isNewsNotif(n)) return t("notifications.btn_read_article", "Lire l'article");
    if (isAbsolutePathNotif(n)) return t("notifications.btn_view", "Voir");
    return t("notifications.btn_view_projet", "Voir le projet");
  };

  return (
    <>
      <div className={styles.bellContainer} ref={dropdownRef}>
        <div className={styles.bellIconBox} onClick={handleBellClick}>
          <Bell size={24} className={unreadCount > 0 ? styles.shake : ""} />
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <h3>{t("notifications.title", "Notifications")}</h3>
              {unreadCount > 0 && (
                <span className={styles.unreadTag}>
                  {t("notifications.unread_count", "{{count}} nouvelles", { count: unreadCount })}
                </span>
              )}
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <Inbox size={40} />
                  <p>{t("notifications.empty", "Aucune notification pour le moment")}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`${styles.notifItem} ${!n.read ? styles.unread : ""} ${styles.clickable}`}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div className={styles.notifContent}>
                      <div className={styles.notifTop}>
                        <span className={styles.notifTitle}>{n.title}</span>
                        {!n.read && <div className={styles.unreadDot} />}
                      </div>
                      <p className={styles.notifText}>{n.content}</p>
                      <div className={styles.notifFooter}>
                        <span className={styles.notifDate}>
                          {new Date(n.date).toLocaleString(i18n.language, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        {getHint(n) && (
                          <small className={styles.clickHint}>
                            {getHint(n)}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={styles.dropdownFooter}>
              <button onClick={markAllAsRead} className={styles.markAllReadBtn}>
                {t("notifications.mark_all_read", "Tout marquer comme lu")}
              </button>
              <button onClick={() => setIsOpen(false)}>{t("notifications.close", "Fermer")}</button>
            </div>
          </div>
        )}
      </div>

      {/* ── POPUP MOTIF ───────────────────────────────────────── */}
      {popupNotif && (
        <div
          className={styles.popupOverlay}
          onClick={() => setPopupNotif(null)}
        >
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>{popupNotif.title}</h3>
              <button
                className={styles.popupClose}
                onClick={() => setPopupNotif(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.popupContent}>{popupNotif.content}</p>

            {popupNotif.motif && (
              <div className={styles.popupMotif}>
                <strong>{getMotifLabel(popupNotif.title)} :</strong>
                <p>{popupNotif.motif}</p>
              </div>
            )}

            <div className={styles.popupFooter}>
              <button
                className={styles.popupBtnClose}
                onClick={() => setPopupNotif(null)}
              >
                {t("notifications.close", "Fermer")}
              </button>
              {(popupNotif.projetId || popupNotif.projetSlug) && (
                <button
                  className={styles.popupBtnProjet}
                  onClick={handlePopupNavigation}
                >
                  <ExternalLink size={15} /> {getPopupBtnLabel(popupNotif)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;
