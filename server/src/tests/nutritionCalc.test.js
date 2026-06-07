'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calcItemNutrients, calcTotals } = require('../services/nutritionCalc');

// ─── calcItemNutrients ───────────────────────────────────────────────────────

test('calcItemNutrients: базовый расчёт для 200г куриной грудки', () => {
  const product = {
    per100g: { protein: 23.6, fat: 1.9, carbs: 0.4, fiber: 0, calories: 113 },
    currentPriceEur: null,
  };
  const result = calcItemNutrients(product, 200);
  assert.strictEqual(result.protein, 47.2);
  assert.strictEqual(result.fat, 3.8);
  assert.strictEqual(result.carbs, 0.8);
  assert.strictEqual(result.calories, 226);
  assert.strictEqual(result.costEur, null);
});

test('calcItemNutrients: нулевые граммы дают нули', () => {
  const product = {
    per100g: { protein: 20, fat: 5, carbs: 10, fiber: 2, calories: 165 },
    currentPriceEur: 3.5,
  };
  const result = calcItemNutrients(product, 0);
  assert.strictEqual(result.protein, 0);
  assert.strictEqual(result.fat, 0);
  assert.strictEqual(result.carbs, 0);
  assert.strictEqual(result.fiber, 0);
  assert.strictEqual(result.calories, 0);
  assert.strictEqual(result.costEur, 0);
});

test('calcItemNutrients: нет цены → costEur null', () => {
  const product = {
    per100g: { protein: 10, fat: 5, carbs: 20, fiber: 1, calories: 165 },
    currentPriceEur: null,
  };
  const result = calcItemNutrients(product, 100);
  assert.strictEqual(result.costEur, null);
});

test('calcItemNutrients: есть цена → costEur вычислен корректно', () => {
  const product = {
    per100g: { protein: 20, fat: 5, carbs: 0, fiber: 0, calories: 120 },
    currentPriceEur: 5.90,
  };
  const result = calcItemNutrients(product, 200);
  // 5.90 / 1000 * 200 = 1.18
  assert.strictEqual(result.costEur, 1.18);
});

test('calcItemNutrients: дробные значения округляются до 1 знака', () => {
  const product = {
    per100g: { protein: 7.333, fat: 3.666, carbs: 12.999, fiber: 1.111, calories: 100 },
    currentPriceEur: null,
  };
  const result = calcItemNutrients(product, 100);
  assert.strictEqual(result.protein, 7.3);
  assert.strictEqual(result.fat, 3.7);
  assert.strictEqual(result.carbs, 13.0);
  assert.strictEqual(result.fiber, 1.1);
});

test('calcItemNutrients: большая порция 500г', () => {
  const product = {
    per100g: { protein: 4, fat: 0.5, carbs: 34, fiber: 1, calories: 160 },
    currentPriceEur: 2.0,
  };
  const result = calcItemNutrients(product, 500);
  assert.strictEqual(result.protein, 20);
  assert.strictEqual(result.carbs, 170);
  assert.strictEqual(result.calories, 800);
  // 2.0 / 1000 * 500 = 1.00
  assert.strictEqual(result.costEur, 1.00);
});

// ─── calcTotals ──────────────────────────────────────────────────────────────

test('calcTotals: один элемент', () => {
  const items = [{ protein: 47.2, fat: 3.8, carbs: 0.8, fiber: 0, calories: 226, costEur: 1.18 }];
  const result = calcTotals(items);
  assert.strictEqual(result.protein, 47.2);
  assert.strictEqual(result.fat, 3.8);
  assert.strictEqual(result.calories, 226);
  assert.strictEqual(result.costEur, 1.18);
});

test('calcTotals: несколько элементов — суммирование', () => {
  const items = [
    { protein: 20, fat: 5, carbs: 0, fiber: 0, calories: 100, costEur: 1.00 },
    { protein: 5,  fat: 1, carbs: 30, fiber: 2, calories: 150, costEur: 0.50 },
  ];
  const result = calcTotals(items);
  assert.strictEqual(result.protein, 25);
  assert.strictEqual(result.fat, 6);
  assert.strictEqual(result.carbs, 30);
  assert.strictEqual(result.calories, 250);
  assert.strictEqual(result.costEur, 1.50);
});

test('calcTotals: все costEur заданы → итоговый costEur вычислен', () => {
  const items = [
    { protein: 10, fat: 2, carbs: 5, fiber: 0, calories: 80, costEur: 0.80 },
    { protein: 10, fat: 2, carbs: 5, fiber: 0, calories: 80, costEur: 0.20 },
  ];
  const result = calcTotals(items);
  assert.strictEqual(result.costEur, 1.00);
});

test('calcTotals: один из costEur null → итоговый costEur null', () => {
  const items = [
    { protein: 10, fat: 2, carbs: 5, fiber: 0, calories: 80, costEur: 1.00 },
    { protein: 10, fat: 2, carbs: 5, fiber: 0, calories: 80, costEur: null },
  ];
  const result = calcTotals(items);
  assert.strictEqual(result.costEur, null);
});

test('calcTotals: все costEur null → итоговый costEur null', () => {
  const items = [
    { protein: 10, fat: 2, carbs: 5, fiber: 0, calories: 80, costEur: null },
    { protein: 10, fat: 2, carbs: 5, fiber: 0, calories: 80, costEur: null },
  ];
  const result = calcTotals(items);
  assert.strictEqual(result.costEur, null);
});

test('calcTotals: пустой массив → нули', () => {
  const result = calcTotals([]);
  assert.strictEqual(result.protein, 0);
  assert.strictEqual(result.fat, 0);
  assert.strictEqual(result.carbs, 0);
  assert.strictEqual(result.fiber, 0);
  assert.strictEqual(result.calories, 0);
  assert.strictEqual(result.costEur, 0);
});

test('calcTotals: null items → нули', () => {
  const result = calcTotals(null);
  assert.strictEqual(result.protein, 0);
  assert.strictEqual(result.calories, 0);
});

test('calcItemNutrients: calories округляется до целого', () => {
  const product = {
    per100g: { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 333.3 },
    currentPriceEur: null,
  };
  const result = calcItemNutrients(product, 100);
  assert.strictEqual(result.calories, 333);
});
