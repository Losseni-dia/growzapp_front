import { FiClock } from "react-icons/fi";
import styles from "./AdminPlaceholder.module.css";

interface AdminPlaceholderProps {
  title: string;
  placeholderTitle: string;
  placeholderBody: string;
}

export default function AdminPlaceholder({
  title,
  placeholderTitle,
  placeholderBody,
}: AdminPlaceholderProps) {
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <FiClock size={22} />
        </div>
        <h2 className={styles.cardTitle}>{placeholderTitle}</h2>
        <p className={styles.cardBody}>{placeholderBody}</p>
      </div>
    </div>
  );
}
