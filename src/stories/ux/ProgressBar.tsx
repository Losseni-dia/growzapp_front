// src/components/Atoms/ProgressBar/ProgressBar.tsx
import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, showText = true }) => {
  const percentage = Math.min(Math.max(progress, 0), 100);
  
  // Logique de couleur dynamique
  const getStatusClass = () => {
    if (percentage >= 100) return styles.full;
    if (percentage >= 80) return styles.warning;
    return styles.default;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div 
          className={`${styles.fill} ${getStatusClass()}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && <span className={styles.label}>{percentage.toFixed(0)}%</span>}
    </div>
  );
};

export default ProgressBar;

//