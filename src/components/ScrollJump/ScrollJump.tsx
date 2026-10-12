import { useEffect, useState } from "react";
import { Crisp } from "crisp-sdk-web";
import styles from "./ScrollJump.module.css";

// Petit bouton flottant à côté de la bulle Crisp : saute au footer quand on
// est en haut de page, et repasse en haut de page une fois dans le footer —
// un seul bouton qui change de sens selon la position de scroll. Masqué
// pendant que le panneau de chat Crisp est ouvert (il prend toute la zone).
export default function ScrollJump() {
  const [atBottom, setAtBottom] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80;
      setAtBottom(scrolledToBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      Crisp.chat.onChatOpened(() => setChatOpen(true));
      Crisp.chat.onChatClosed(() => setChatOpen(false));
    } catch {
      // Crisp pas encore chargé (consentement chat non donné) — pas grave,
      // le bouton reste simplement toujours visible dans ce cas.
    }
  }, []);

  if (chatOpen) return null;

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document
        .getElementById("site-footer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <button
      type="button"
      className={styles.scrollJumpBtn}
      onClick={handleClick}
      aria-label={atBottom ? "Retour en haut de page" : "Aller au pied de page"}
      title={atBottom ? "Retour en haut de page" : "Aller au pied de page"}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className={atBottom ? styles.iconUp : styles.iconDown}
        aria-hidden="true"
      >
        <path d="M4 7h16l-8 12z" fill="currentColor" />
      </svg>
    </button>
  );
}
