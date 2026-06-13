import React from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon = '🍽', title = 'Пока пусто', description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <button className={styles.actionBtn} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
