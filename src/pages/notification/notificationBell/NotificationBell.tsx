import { Bell, Inbox, X, ExternalLink } from "lucide-react";
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

  const handleNotifClick = async (n: Notification) => {
    await markAsRead(n);

    // Si la notification a un motif → popup (ex: refus investissement)
    if (n.motif) {
      setIsOpen(false);
      setPopupNotif(n);
      return;
    }

    // Sinon redirection vers le projet
    if (n.projetSlug) {
      navigate(`/projet/${n.projetSlug}`);
      setIsOpen(false);
    } else if (n.projetId) {
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

  const handlePopupProjet = async () => {
    if (!popupNotif) return;
    setPopupNotif(null);
    if (popupNotif.projetSlug) {
      navigate(`/projet/${popupNotif.projetSlug}`);
    } else if (popupNotif.projetId) {
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
                        {n.motif ? (
                          <small className={styles.clickHint}>
                            Voir le motif →
                          </small>
                        ) : n.projetId ? (
                          <small className={styles.clickHint}>
                            Voir le projet →
                          </small>
                        ) : null}
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

      {/* ── POPUP MOTIF REFUS ──────────────────────────────────── */}
      {popupNotif && (
        <div
          className={styles.popupOverlay}
          onClick={() => setPopupNotif(null)}
        >
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>❌ {popupNotif.title}</h3>
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
                <strong>Motif du refus :</strong>
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
                  onClick={handlePopupProjet}
                >
                  <ExternalLink size={15} /> Voir le projet
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
