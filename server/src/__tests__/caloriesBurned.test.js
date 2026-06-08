const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calcCaloriesBurned } = require('../services/caloriesBurned');

// Formula: Math.round(MET × weightKg × (durationMinutes / 60))

test('home 60 мин 80 кг → 360', () => {
  // MET home = 4.5; 4.5 × 80 × 1 = 360
  assert.equal(calcCaloriesBurned('home', 60, 80), 360);
});

test('run 60 мин 70 кг', () => {
  // MET run = 8.0; 8.0 × 70 × 1 = 560
  assert.equal(calcCaloriesBurned('run', 60, 70), 560);
});

test('gym 30 мин 80 кг', () => {
  // MET gym = 5.5; 5.5 × 80 × 0.5 = 220
  assert.equal(calcCaloriesBurned('gym', 30, 80), 220);
});

test('bike 90 мин 75 кг', () => {
  // MET bike = 7.5; 7.5 × 75 × 1.5 = 843.75 → 844
  assert.equal(calcCaloriesBurned('bike', 90, 75), 844);
});

test('swim 45 мин 65 кг', () => {
  // MET swim = 7.0; 7.0 × 65 × 0.75 = 341.25 → 341
  assert.equal(calcCaloriesBurned('swim', 45, 65), 341);
});

test('other → MET 4.0', () => {
  // MET other = 4.0; 4.0 × 80 × 1 = 320
  assert.equal(calcCaloriesBurned('other', 60, 80), 320);
});

test('неизвестный тип → MET 4.0 (не падает)', () => {
  // MET unknown = 4.0; 4.0 × 80 × 1 = 320
  assert.equal(calcCaloriesBurned('crossfit', 60, 80), 320);
});

test('граничное значение: 1 минута, 80 кг, home', () => {
  // 4.5 × 80 × (1/60) = 6
  assert.equal(calcCaloriesBurned('home', 1, 80), 6);
});

test('граничное значение: 600 минут, 80 кг, run', () => {
  // 8.0 × 80 × 10 = 6400
  assert.equal(calcCaloriesBurned('run', 600, 80), 6400);
});
