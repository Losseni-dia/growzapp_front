import { Bell, Inbox } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { notificationService } from "../../service/notificationService";
import { Notification } from "../../types/notification";
import styles from "./NotificationBell.module.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les données depuis le backend
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
    const interval = setInterval(loadNotifications, 60000); // Polling 1 min

    // Fermer le dropdown si on clique ailleurs
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

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      // Mise à jour locale rapide pour l'UX
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur lors du marquage lue", err);
    }
  };

  return (
    <div className={styles.bellContainer} ref={dropdownRef}>
      {/* Icône de la cloche avec badge */}
      <div className={styles.bellIconBox} onClick={() => setIsOpen(!isOpen)}>
        <Bell size={24} className={unreadCount > 0 ? styles.shake : ""} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Menu déroulant */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className={styles.unreadTag}>{unreadCount} nouvelles</span>
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
                  className={`${styles.notifItem} ${!n.read ? styles.unread : ""}`}
                  onClick={(e) => !n.read && handleMarkAsRead(e, n.id)}
                >
                  <div className={styles.notifContent}>
                    <div className={styles.notifTop}>
                      <span className={styles.notifTitle}>{n.title}</span>
                      {!n.read && <div className={styles.unreadDot} />}
                    </div>
                    <p className={styles.notifText}>{n.content}</p>
                    <span className={styles.notifDate}>
                      {new Date(n.date).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
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
  );
};

export default NotificationBell;
