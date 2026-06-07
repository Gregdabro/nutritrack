import styles from './FoodEntry.module.css';
import api from '../../api';

/**
 * Displays one FoodLog entry.
 * Props: { entry: FoodLog, onDelete: (id) => void }
 */
export default function FoodEntry({ entry, onDelete }) {
  const time = entry.loggedAt
    ? new Date(entry.loggedAt).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  async function handleDelete() {
    try {
      await api.foodLogs.remove(entry._id);
      onDelete(entry._id);
    } catch (err) {
      console.error('Failed to delete food log:', err);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.time}>{time}</span>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="Удалить запись"
          aria-label="Удалить запись"
        >
          ×
        </button>
      </div>

      <ul className={styles.itemList}>
        {entry.items.map((item, idx) => (
          <li key={idx} className={styles.item}>
            <span className={styles.itemName}>
              {item.name} <span className={styles.itemGrams}>{item.grams}г</span>
            </span>
            <span className={styles.itemMacros}>
              Б{item.protein || 0} Ж{item.fat || 0} У{item.carbs || 0} | {item.calories || 0} ккал
            </span>
          </li>
        ))}
      </ul>

      {entry.totals && (
        <div className={styles.totals}>
          Итого: Б{entry.totals.protein} Ж{entry.totals.fat} У{entry.totals.carbs} |{' '}
          {entry.totals.calories} ккал
        </div>
      )}
    </div>
  );
}
