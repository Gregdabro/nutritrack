import styles from './NutrientBar.module.css';

/**
 * Progress bar for a single nutrient.
 * Props: { label, current, goal, color }
 */
export default function NutrientBar({ label, current, goal, color = '#4f8ef7' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOver = current > goal && goal > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.values}>
          {current}г / {goal}г
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{
            width: `${pct}%`,
            backgroundColor: isOver ? '#f06060' : color,
          }}
        />
      </div>
    </div>
  );
}
