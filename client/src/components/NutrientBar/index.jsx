import styles from './NutrientBar.module.css';

/**
 * Progress bar for a single nutrient.
 * Props: { label, current, goal, color }
 */
export default function NutrientBar({ label, current, goal, color = 'var(--nt-blue-mid)' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOver = current > goal && goal > 0;

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.trackWrap}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              width: `${pct}%`,
              backgroundColor: isOver ? 'var(--nt-coral-mid)' : color,
            }}
          />
        </div>
      </div>
      <span className={styles.values}>
        <span style={{ fontWeight: 500, color: 'var(--nt-text)' }}>{current}</span>/{goal} г
      </span>
    </div>
  );
}
