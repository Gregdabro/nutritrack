import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import useAuthStore from '../../store/authStore';
import styles from './Products.module.css';

const CATEGORIES = [
  { value: 'meat', label: 'Мясо' },
  { value: 'fish', label: 'Рыба' },
  { value: 'dairy', label: 'Молочное' },
  { value: 'grain', label: 'Крупы/Злаки' },
  { value: 'vegetable', label: 'Овощи' },
  { value: 'fruit', label: 'Фрукты' },
  { value: 'drink', label: 'Напитки' },
  { value: 'drink_undesirable', label: 'Напитки (нежелат.)' },
  { value: 'supplement', label: 'Добавки' },
  { value: 'other', label: 'Другое' },
];

const EMPTY_FORM = {
  name: '',
  aliases: '',
  category: 'other',
  protein: '',
  fat: '',
  carbs: '',
  fiber: '',
  calories: '',
  currentPriceEur: '',
};

function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toFixed(2) + ' €/кг';
}

function formatMacro(val) {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

export default function Products() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.products.list(params);
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch {
      // error is handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      aliases: (product.aliases || []).join(', '),
      category: product.category,
      protein: product.per100g?.protein ?? '',
      fat: product.per100g?.fat ?? '',
      carbs: product.per100g?.carbs ?? '',
      fiber: product.per100g?.fiber ?? '',
      calories: product.per100g?.calories ?? '',
      currentPriceEur: product.currentPriceEur ?? '',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleFieldChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const aliases = form.aliases
      ? form.aliases.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const body = {
      name: form.name,
      aliases,
      category: form.category,
      per100g: {
        protein: form.protein !== '' ? Number(form.protein) : 0,
        fat: form.fat !== '' ? Number(form.fat) : 0,
        carbs: form.carbs !== '' ? Number(form.carbs) : 0,
        fiber: form.fiber !== '' ? Number(form.fiber) : 0,
        calories: form.calories !== '' ? Number(form.calories) : 0,
      },
      currentPriceEur: form.currentPriceEur !== '' ? Number(form.currentPriceEur) : null,
    };

    try {
      if (editingId) {
        await api.products.update(editingId, body);
      } else {
        await api.products.create(body);
      }

      cancelForm();
      fetchProducts();
    } catch (err) {
      const msg =
        err.response?.data?.error === 'VALIDATION_ERROR'
          ? 'Проверьте заполнение полей: ' +
            err.response.data.details?.map((d) => d.message).join(', ')
          : err.response?.data?.message ||
            'Не удалось сохранить продукт. Попробуйте ещё раз.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Удалить "${product.name}"?`)) return;
    await api.products.remove(product._id);
    fetchProducts();
  }

  if (loading && products.length === 0) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>База продуктов</h1>

        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск продуктов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.addBtn} onClick={openCreateForm}>
            + Добавить
          </button>
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className={styles.form}>
            <div className={styles.formTitle}>
              {editingId ? 'Редактировать продукт' : 'Новый продукт'}
            </div>

            {error && <div className={styles.formError}>{error}</div>}

            <div className={styles.formGrid}>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label>Название</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange('name')}
                  placeholder="Название продукта"
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label>Псевдонимы (через запятую)</label>
                <input
                  type="text"
                  value={form.aliases}
                  onChange={handleFieldChange('aliases')}
                  placeholder="курица, куриное филе, chicken"
                />
              </div>

              <div className={styles.formField}>
                <label>Категория</label>
                <select value={form.category} onChange={handleFieldChange('category')}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label>Цена (€/кг)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.currentPriceEur}
                  onChange={handleFieldChange('currentPriceEur')}
                  placeholder="5.90"
                />
              </div>

              <div className={styles.formField}>
                <label>Белки (г/100г)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.protein}
                  onChange={handleFieldChange('protein')}
                  placeholder="0"
                />
              </div>

              <div className={styles.formField}>
                <label>Жиры (г/100г)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.fat}
                  onChange={handleFieldChange('fat')}
                  placeholder="0"
                />
              </div>

              <div className={styles.formField}>
                <label>Углеводы (г/100г)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.carbs}
                  onChange={handleFieldChange('carbs')}
                  placeholder="0"
                />
              </div>

              <div className={styles.formField}>
                <label>Клетчатка (г/100г)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.fiber}
                  onChange={handleFieldChange('fiber')}
                  placeholder="0"
                />
              </div>

              <div className={styles.formField}>
                <label>Калории (ккал/100г)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.calories}
                  onChange={handleFieldChange('calories')}
                  placeholder="0"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={cancelForm}>
                Отмена
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSubmit}
                disabled={!form.name.trim() || saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && !showForm && (
          <div className={styles.empty}>
            <div>Продукты ещё не добавлены</div>
            <button className={styles.emptyBtn} onClick={openCreateForm}>
              + Добавить первый продукт
            </button>
          </div>
        )}

        {/* Product list */}
        {products.length > 0 && (
          <>
            <div className={styles.tableHeader}>
              <span>Продукт</span>
              <span>Б</span>
              <span>Ж</span>
              <span>У</span>
              <span>Ккал</span>
              <span>Цена</span>
              <span></span>
            </div>

            {products.map((p) => (
              <div key={p._id} className={styles.productRow}>
                <div className={styles.productName}>
                  {p.name}
                  <span className={styles.categoryBadge}>
                    {CATEGORIES.find((c) => c.value === p.category)?.label || p.category}
                  </span>
                </div>
                <span className={styles.macro}>{formatMacro(p.per100g?.protein)}</span>
                <span className={styles.macro}>{formatMacro(p.per100g?.fat)}</span>
                <span className={styles.macro}>{formatMacro(p.per100g?.carbs)}</span>
                <span className={styles.macro}>{formatMacro(p.per100g?.calories)}</span>
                <span className={styles.price}>{formatPrice(p.currentPriceEur)}</span>
                <div className={styles.actions}>
                  <button className={styles.editBtn} onClick={() => openEditForm(p)}>
                    Изменить
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(p)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8, fontSize: 12, color: '#A09F9A' }}>
              Всего: {total} продуктов
            </div>
          </>
        )}
      </div>
    </div>
  );
}
