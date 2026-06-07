import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import styles from './QuickAdd.module.css';

const TABS = [
  { id: 'search', label: '🔍 Поиск продукта' },
  { id: 'text',   label: '✍️ Свободный текст' },
];

/**
 * Modal for quick food entry.
 * Props: { date, mealType, onClose, onAdded }
 */
export default function QuickAdd({ date, mealType, onClose, onAdded }) {
  const [activeTab, setActiveTab] = useState('search');

  // ── Search tab state ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [grams, setGrams] = useState('100');
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  // ── Text tab state ────────────────────────────────────────────────────────
  const [freeText, setFreeText] = useState('');
  const [parsedItems, setParsedItems] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // ── Saving state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Search with debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.products.list({ search: searchQuery, limit: 10 });
        setSearchResults(res.data.products || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // ── Add from search ───────────────────────────────────────────────────────
  async function handleAddFromSearch(e) {
    e.preventDefault();
    if (!selectedProduct) return;
    const g = parseFloat(grams);
    if (!g || g <= 0) { setError('Введи корректное количество грамм.'); return; }

    setSaving(true);
    setError('');
    try {
      await api.foodLogs.create({
        date,
        mealType: mealType || 'snack',
        items: [{
          productId: selectedProduct._id,
          name:      selectedProduct.name,
          grams:     g,
        }],
      });
      onAdded();
      onClose();
    } catch (err) {
      setError('Ошибка при сохранении. Попробуй ещё раз.');
    } finally {
      setSaving(false);
    }
  }

  // ── Parse free text ───────────────────────────────────────────────────────
  async function handleParse() {
    if (!freeText.trim()) return;
    setParsing(true);
    setParseError('');
    setParsedItems(null);
    try {
      const res = await api.foodLogs.parse(freeText);
      if (res.data.degraded || !res.data.parsed) {
        setParseError('AI недоступен. Попробуй позже или используй поиск продукта.');
      } else {
        setParsedItems(res.data.parsed);
      }
    } catch {
      setParseError('Ошибка распознавания. Попробуй ещё раз.');
    } finally {
      setParsing(false);
    }
  }

  // ── Save all parsed items ─────────────────────────────────────────────────
  async function handleSaveParsed() {
    if (!parsedItems?.length) return;
    setSaving(true);
    setError('');
    try {
      await api.foodLogs.create({
        date,
        mealType: mealType || 'snack',
        items: parsedItems.map((it) => ({
          productId: it.matchedProductId,
          name:      it.name,
          grams:     it.grams,
        })),
      });
      onAdded();
      onClose();
    } catch {
      setError('Ошибка при сохранении.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Добавить еду</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search tab ── */}
        {activeTab === 'search' && (
          <form className={styles.tabContent} onSubmit={handleAddFromSearch}>
            <input
              id="quickadd-search"
              className={styles.input}
              type="text"
              placeholder="Название продукта..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedProduct(null);
              }}
              autoFocus
            />

            {searching && <p className={styles.hint}>Поиск...</p>}

            {searchResults.length > 0 && !selectedProduct && (
              <ul className={styles.resultList}>
                {searchResults.map((p) => (
                  <li
                    key={p._id}
                    className={styles.resultItem}
                    onClick={() => {
                      setSelectedProduct(p);
                      setSearchQuery(p.name);
                      setSearchResults([]);
                    }}
                  >
                    <span className={styles.resultName}>{p.name}</span>
                    <span className={styles.resultMacros}>
                      {p.per100g?.calories || 0} ккал/100г
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selectedProduct && (
              <div className={styles.selectedCard}>
                <span className={styles.selectedName}>{selectedProduct.name}</span>
                <span className={styles.selectedMeta}>
                  Б{selectedProduct.per100g?.protein || 0} Ж{selectedProduct.per100g?.fat || 0}{' '}
                  У{selectedProduct.per100g?.carbs || 0} | {selectedProduct.per100g?.calories || 0} ккал / 100г
                </span>
              </div>
            )}

            <div className={styles.gramsRow}>
              <label className={styles.gramsLabel} htmlFor="quickadd-grams">Граммы:</label>
              <input
                id="quickadd-grams"
                className={`${styles.input} ${styles.gramsInput}`}
                type="number"
                min="1"
                max="10000"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              id="quickadd-submit-search"
              type="submit"
              className={styles.saveBtn}
              disabled={!selectedProduct || saving}
            >
              {saving ? 'Сохраняю...' : '+ Добавить'}
            </button>
          </form>
        )}

        {/* ── Text tab ── */}
        {activeTab === 'text' && (
          <div className={styles.tabContent}>
            <textarea
              id="quickadd-freetext"
              className={styles.textarea}
              placeholder="Напиши что ты съел, например: 3 яйца и 150г гречки..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={4}
            />

            <button
              id="quickadd-parse-btn"
              className={styles.parseBtn}
              onClick={handleParse}
              disabled={!freeText.trim() || parsing}
            >
              {parsing ? '⏳ Распознаю...' : '🤖 Распознать'}
            </button>

            {parseError && <p className={styles.error}>{parseError}</p>}

            {parsedItems && parsedItems.length > 0 && (
              <div className={styles.parsedList}>
                <p className={styles.parsedTitle}>Распознано:</p>
                <ul className={styles.resultList}>
                  {parsedItems.map((it, i) => (
                    <li key={i} className={styles.resultItem}>
                      <span className={styles.resultName}>{it.name}</span>
                      <span className={styles.resultMacros}>{it.grams}г</span>
                    </li>
                  ))}
                </ul>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  id="quickadd-save-all"
                  className={styles.saveBtn}
                  onClick={handleSaveParsed}
                  disabled={saving}
                >
                  {saving ? 'Сохраняю...' : '✅ Сохранить всё'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
