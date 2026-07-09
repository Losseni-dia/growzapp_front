import { Bell, Inbox, X, ExternalLink, Newspaper } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../../service/notificationService";
import { Notification } from "../../../types/notification";
import styles from "./NotificationBell.module.css";
import { api } from "../../../service/Api";

const NotificationBell = () => {
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

  const getMotifLabel = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes("refus")) return "Motif du refus";
    if (t.includes("versement") || t.includes("virement"))
      return "Motif du versement";
    if (t.includes("retrait")) return "Motif";
    if (t.includes("kyc")) return "Motif";
    return "Motif";
  };

  // Détermine si c'est une notification d'actualité (projetSlug commence par /news/)
  const isNewsNotif = (n: Notification) =>
    n.projetSlug?.startsWith("/news/") ?? false;

  const handleNotifClick = async (n: Notification) => {
    await markAsRead(n);

    // Notification avec motif → popup
    if (n.motif) {
      setIsOpen(false);
      setPopupNotif(n);
      return;
    }

    // Notification actualité → /news/{id}
    if (isNewsNotif(n)) {
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

    if (isNewsNotif(popupNotif)) {
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
    if (n.motif) return "Voir le motif →";
    if (isNewsNotif(n)) return "Lire l'article →";
    if (n.projetId || n.projetSlug) return "Voir le projet →";
    return null;
  };

  // Label du bouton popup
  const getPopupBtnLabel = (n: Notification) => {
    if (isNewsNotif(n)) return "Lire l'article";
    return "Voir le projet";
  };

  return (
    <>
      <div className={styles.bellContainer} ref={dropdownRef}>
        <div className={styles.bellIconBox} onClick={() => setIsOpen(!isOpen)}>
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
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className={styles.unreadTag}>
                  {unreadCount} nouvelles
                </span>
              )}
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <Inbox size={40} />
                  <p>Aucune notification pour le moment</p>
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
                          {new Date(n.date).toLocaleString("fr-FR", {
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
              <button onClick={() => setIsOpen(false)}>Fermer</button>
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
                Fermer
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
