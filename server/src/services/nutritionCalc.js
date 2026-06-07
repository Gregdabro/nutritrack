'use strict';

/**
 * Calculate nutrients for a product portion.
 * @param {{ per100g: { protein, fat, carbs, fiber, calories }, currentPriceEur: number|null }} product
 * @param {number} grams
 * @returns {{ protein: number, fat: number, carbs: number, fiber: number, calories: number, costEur: number|null }}
 */
function calcItemNutrients(product, grams) {
  const { per100g, currentPriceEur } = product;
  const ratio = grams / 100;

  const protein  = parseFloat((per100g.protein  * ratio).toFixed(1));
  const fat      = parseFloat((per100g.fat      * ratio).toFixed(1));
  const carbs    = parseFloat((per100g.carbs    * ratio).toFixed(1));
  const fiber    = parseFloat((per100g.fiber    * ratio).toFixed(1));
  const calories = parseFloat((per100g.calories * ratio).toFixed(0));

  const costEur = currentPriceEur != null
    ? parseFloat(((currentPriceEur / 1000) * grams).toFixed(2))
    : null;

  return { protein, fat, carbs, fiber, calories, costEur };
}

/**
 * Sum nutrients across multiple items.
 * costEur is null if ANY item has costEur === null.
 * @param {Array<{ protein, fat, carbs, fiber, calories, costEur }>} items
 * @returns {{ protein: number, fat: number, carbs: number, fiber: number, calories: number, costEur: number|null }}
 */
function calcTotals(items) {
  if (!items || items.length === 0) {
    return { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 };
  }

  return items.reduce(
    (acc, item) => ({
      protein:  parseFloat((acc.protein  + (item.protein  || 0)).toFixed(1)),
      fat:      parseFloat((acc.fat      + (item.fat      || 0)).toFixed(1)),
      carbs:    parseFloat((acc.carbs    + (item.carbs    || 0)).toFixed(1)),
      fiber:    parseFloat((acc.fiber    + (item.fiber    || 0)).toFixed(1)),
      calories: parseFloat((acc.calories + (item.calories || 0)).toFixed(0)),
      costEur: acc.costEur !== null && item.costEur !== null
        ? parseFloat((acc.costEur + item.costEur).toFixed(2))
        : null,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 },
  );
}

module.exports = { calcItemNutrients, calcTotals };
