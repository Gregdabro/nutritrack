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
  const [fetchError, setFetchError] = useState(null);

  // Price form states
  const [priceFormId, setPriceFormId] = useState(null);
  const [priceForm, setPriceForm] = useState({ priceEur: '', store: '' });
  const [priceFormError, setPriceFormError] = useState(null);

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
    setFetchError(null);
    try {
      const params = { limit: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.products.list(params);
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch (err) {
      const msg =
        err.response
          ? err.response.data?.message || 'Ошибка сервера при загрузке продуктов'
          : 'Не удалось подключиться к серверу. Проверьте, что сервер запущен.';
      setFetchError(msg);
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
    setPriceFormId(null);
    setPriceFormError(null);
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
    setPriceFormId(null);
    setPriceFormError(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleOpenPriceForm(product) {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);

    setPriceFormId(product._id);
    setPriceForm({ priceEur: '', store: '' });
    setPriceFormError(null);
  }

  function handleCancelPrice() {
    setPriceFormId(null);
    setPriceForm({ priceEur: '', store: '' });
    setPriceFormError(null);
  }

  async function handleSavePrice(productId) {
    setPriceFormError(null);
    try {
      const priceEurNum = Number(priceForm.priceEur);
      if (isNaN(priceEurNum) || priceEurNum <= 0) {
        setPriceFormError('Цена должна быть положительным числом');
        return;
      }
      if (!priceForm.store.trim()) {
        setPriceFormError('Магазин обязателен для заполнения');
        return;
      }

      await api.products.addPrice(productId, {
        priceEur: priceEurNum,
        store: priceForm.store.trim(),
      });

      handleCancelPrice();
      fetchProducts();
    } catch (err) {
      let msg;
      if (!err.response) {
        msg = 'Не удалось подключиться к серверу. Проверьте, что сервер запущен.';
      } else if (err.response?.data?.error === 'VALIDATION_ERROR') {
        msg = 'Проверьте заполнение полей: ' +
          err.response.data.details?.map((d) => d.message).join(', ');
      } else {
        msg = err.response?.data?.message ||
          'Не удалось добавить цену. Попробуйте ещё раз.';
      }
      setPriceFormError(msg);
    }
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
      let msg;
      if (!err.response) {
        msg = 'Не удалось подключиться к серверу. Проверьте, что сервер запущен.';
      } else if (err.response?.data?.error === 'VALIDATION_ERROR') {
        msg = 'Проверьте заполнение полей: ' +
          err.response.data.details?.map((d) => d.message).join(', ');
      } else {
        msg = err.response?.data?.message ||
          'Не удалось сохранить продукт. Попробуйте ещё раз.';
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Удалить "${product.name}"?`)) return;
    setError(null);
    try {
      await api.products.remove(product._id);
      fetchProducts();
    } catch (err) {
      const msg = err.response
        ? err.response.data?.message || 'Не удалось удалить продукт'
        : 'Не удалось подключиться к серверу';
      setError(msg);
    }
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

        {/* Fetch error */}
        {fetchError && (
          <div className={styles.fetchError}>
            <span>{fetchError}</span>
            <button className={styles.retryBtn} onClick={fetchProducts}>
              Повторить
            </button>
          </div>
        )}

        {/* General error (e.g. delete failure) */}
        {error && !showForm && (
          <div className={styles.fetchError}>{error}</div>
        )}

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
                {priceFormId === p._id ? (
                  <div className={styles.priceFormInline}>
                    <div className={styles.priceFormRow}>
                      <span className={styles.priceFormProductName}>{p.name}</span>
                      <div className={styles.priceFormFields}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="5.90"
                          value={priceForm.priceEur}
                          onChange={(e) => setPriceForm({ ...priceForm, priceEur: e.target.value })}
                          className={`${styles.priceFormInput} ${styles.priceInput}`}
                        />
                        <input
                          type="text"
                          placeholder="Conad"
                          value={priceForm.store}
                          onChange={(e) => setPriceForm({ ...priceForm, store: e.target.value })}
                          className={`${styles.priceFormInput} ${styles.storeInput}`}
                        />
                        <button
                          className={styles.priceFormSaveBtn}
                          onClick={() => handleSavePrice(p._id)}
                          disabled={!priceForm.priceEur || !priceForm.store}
                        >
                          Сохранить
                        </button>
                        <button className={styles.priceFormCancelBtn} onClick={handleCancelPrice}>
                          Отмена
                        </button>
                      </div>
                    </div>
                    {priceFormError && (
                      <div className={styles.priceFormError}>{priceFormError}</div>
                    )}
                  </div>
                ) : (
                  <>
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
                      <button className={styles.priceBtn} onClick={() => handleOpenPriceForm(p)}>
                        + Цена
                      </button>
                      <button className={styles.editBtn} onClick={() => openEditForm(p)}>
                        Изменить
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(p)}>
                        Удалить
                      </button>
                    </div>
                  </>
                )}
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
