import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../api';
import styles from './Recipes.module.css';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingToDiary, setAddingToDiary] = useState(false);
  
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      totalServings: 1,
      ingredients: [{ productId: '', grams: 100 }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients'
  });

  useEffect(() => {
    fetchRecipes();
    fetchProducts();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await api.recipes.list({ limit: 100 });
      setRecipes(res.data.recipes || []);
      if (res.data.recipes?.length > 0 && !selectedRecipe) {
        setSelectedRecipe(res.data.recipes[0]);
      }
    } catch (err) {
      console.error('Failed to fetch recipes', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.products.list({ limit: 100 });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const onSubmit = async (data) => {
    try {
      // API expects ingredients: [{productId, grams}] and totalServings as number
      const payload = {
        name: data.name,
        totalServings: Number(data.totalServings),
        ingredients: data.ingredients.map(i => ({
          productId: i.productId,
          grams: Number(i.grams)
        }))
      };
      
      await api.recipes.create(payload);
      setIsModalOpen(false);
      reset();
      fetchRecipes();
    } catch (err) {
      console.error('Failed to create recipe', err);
    }
  };

  const handleAddToDiary = async () => {
    if (!selectedRecipe || addingToDiary) return;
    setAddingToDiary(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const items = selectedRecipe.ingredients.map(ing => ({
        productId: ing.productId,
        name: ing.productName,
        grams: Math.round(ing.grams / selectedRecipe.totalServings)
      }));

      await api.foodLogs.create({
        date: today,
        mealType: 'snack', // default mealType
        items
      });
      alert('Рецепт успешно добавлен в дневник (как перекус)!');
    } catch (err) {
      console.error('Failed to add to diary', err);
      alert('Ошибка при добавлении в дневник');
    } finally {
      setAddingToDiary(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Мои рецепты</h1>
        <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
          <i className="ti ti-plus" /> Создать
        </button>
      </header>

      <div className={styles.container}>
        <div className={styles.leftColumn}>
          {recipes.length === 0 ? (
            <div className={styles.emptyState}>У вас пока нет рецептов</div>
          ) : (
            recipes.map(recipe => (
              <div 
                key={recipe._id} 
                className={`${styles.recipeCard} ${selectedRecipe?._id === recipe._id ? styles.active : ''}`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className={styles.recipeName}>{recipe.name}</div>
                <div className={styles.recipeInfo}>
                  Порций: {recipe.totalServings} 
                  {recipe.perServingCostEur ? ` • ~€${recipe.perServingCostEur}/порция` : ''}
                </div>
                <div className={styles.macros}>
                  <span className={`${styles.chip} ${styles.chipP}`}>Б {recipe.perServingNutrients?.protein}</span>
                  <span className={`${styles.chip} ${styles.chipF}`}>Ж {recipe.perServingNutrients?.fat}</span>
                  <span className={`${styles.chip} ${styles.chipC}`}>У {recipe.perServingNutrients?.carbs}</span>
                  <span className={`${styles.chip} ${styles.chipKcal}`}>{recipe.perServingNutrients?.calories} ккал</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.rightColumn}>
          {selectedRecipe ? (
            <div className={styles.detailsCard}>
              <h2 className={styles.detailsTitle}>{selectedRecipe.name}</h2>
              <div className={styles.detailsSubtitle}>
                {selectedRecipe.totalServings} порций
              </div>
              
              <div className={styles.sectionHeading}>Ингредиенты</div>
              <div>
                {selectedRecipe.ingredients?.map((ing, idx) => (
                  <div key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientName}>{ing.productName}</span>
                    <span className={styles.ingredientGrams}>{ing.grams} г</span>
                  </div>
                ))}
              </div>

              <div className={styles.totalMacros}>
                <div className={styles.macroBox}>
                  <div className={styles.macroLabel}>Белки</div>
                  <div className={styles.macroValue}>{selectedRecipe.perServingNutrients?.protein}г</div>
                </div>
                <div className={styles.macroBox}>
                  <div className={styles.macroLabel}>Жиры</div>
                  <div className={styles.macroValue}>{selectedRecipe.perServingNutrients?.fat}г</div>
                </div>
                <div className={styles.macroBox}>
                  <div className={styles.macroLabel}>Углеводы</div>
                  <div className={styles.macroValue}>{selectedRecipe.perServingNutrients?.carbs}г</div>
                </div>
                <div className={styles.macroBox}>
                  <div className={styles.macroLabel}>Ккал</div>
                  <div className={styles.macroValue}>{selectedRecipe.perServingNutrients?.calories}</div>
                </div>
              </div>

              <button 
                className={styles.addToDiaryBtn} 
                onClick={handleAddToDiary}
                disabled={addingToDiary}
              >
                <i className="ti ti-plus" /> {addingToDiary ? 'Добавляю...' : 'В дневник (1 порция)'}
              </button>
            </div>
          ) : (
            <div className={styles.detailsCard}>
              <div className={styles.emptyState}>Выберите рецепт слева</div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Новый рецепт</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.formGroup}>
                <label>Название рецепта</label>
                <input 
                  className={styles.input} 
                  {...register('name', { required: true })} 
                  placeholder="Например, Овсяноблин"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Количество порций (итого)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  {...register('totalServings', { required: true, min: 1 })} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ингредиенты</label>
                {fields.map((item, index) => (
                  <div key={item.id} className={styles.ingredientRow}>
                    <select 
                      className={styles.ingredientSelect}
                      {...register(`ingredients.${index}.productId`, { required: true })}
                    >
                      <option value="">Выберите продукт...</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Граммы"
                      className={styles.ingredientGramsInput}
                      {...register(`ingredients.${index}.grams`, { required: true, min: 1 })}
                    />
                    {fields.length > 1 && (
                      <button type="button" className={styles.removeBtn} onClick={() => remove(index)}>
                        <i className="ti ti-trash" />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className={styles.addIngredientBtn} 
                  onClick={() => append({ productId: '', grams: 100 })}
                >
                  + Добавить ингредиент
                </button>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
