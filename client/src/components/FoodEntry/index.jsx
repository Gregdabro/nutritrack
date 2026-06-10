import { useState } from 'react';
import styles from './FoodEntry.module.css';
import api from '../../api';

export default function FoodEntry({ entry, onDelete }) {
  const [deleteError, setDeleteError] = useState(null);

  async function handleDelete() {
    setDeleteError(null);
    try {
      await api.foodLogs.remove(entry._id);
      onDelete(entry._id);
    } catch (err) {
      setDeleteError('Не удалось удалить');
    }
  }

  return (
    <>
      {(entry.items || []).map((item, idx) => (
        <div key={idx} className={styles.foodItem}>
          <div className={styles.foodName}>
            {item.name}
            {idx === 0 && entry.product?.pricePer100g && (
              <span className={styles.costBadge}>
                {((entry.product.pricePer100g * item.grams) / 100).toFixed(2)}€
              </span>
            )}
          </div>
          <div className={styles.foodGrams}>{item.grams} г</div>
          <div className={styles.foodMacros}>
            <span className={`${styles.macroChip} ${styles.chipP}`}>Б {item.protein || 0}г</span>
            <span className={`${styles.macroChip} ${styles.chipF}`}>Ж {item.fat || 0}г</span>
            <span className={`${styles.macroChip} ${styles.chipC}`}>У {item.carbs || 0}г</span>
          </div>
          <div className={styles.foodCal}>{item.calories || 0} ккал</div>
          <div className={styles.foodActions}>
            {idx === 0 && (
              <button
                className={styles.iconBtn}
                onClick={handleDelete}
                title="Удалить запись"
                aria-label="Удалить запись"
              >
                <i className="ti ti-trash" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ))}
      {deleteError && (
        <div className={styles.deleteError}>{deleteError}</div>
      )}
    </>
  );
}
