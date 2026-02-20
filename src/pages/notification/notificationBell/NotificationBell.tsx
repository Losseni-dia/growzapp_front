import { Bell, Inbox } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // AJOUT : pour la redirection
import { notificationService } from "../../../service/notificationService";
import { Notification } from "../../../types/notification";
import styles from "./NotificationBell.module.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate(); // AJOUT : Hook de navigation

  // ... loadNotifications reste identique ...
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
    const interval = setInterval(loadNotifications, 60000);
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

  // FONCTION DE CLIC SUR LA NOTIFICATION
  const handleNotifClick = async (n: Notification) => {
    // 1. Marquer comme lue si ce n'est pas déjà fait
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

    // 2. Rediriger si un projetId est présent (à adapter selon le nom de ton champ backend)
    // On suppose ici que ton objet Notification a un champ 'projetId' ou 'targetId'
    if (n.projetId) {
      navigate(`/projet/${n.projetId}`);
      setIsOpen(false); // Fermer le menu après redirection
    }
  };

  return (
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
                  className={`${styles.notifItem} ${!n.read ? styles.unread : ""} ${n.projetId ? styles.clickable : ""}`}
                  onClick={() => handleNotifClick(n)} // MODIFIÉ : Nouvelle logique de clic
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
                      {n.projetId && (
                        <small className={styles.clickHint}>
                          Voir le projet →
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
  );
};

export default NotificationBell;
