const { Router } = require('express');
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const FoodLog = require('../models/FoodLog');
const Workout = require('../models/Workout');
const WellbeingLog = require('../models/WellbeingLog');
const WeightLog = require('../models/WeightLog');
const WaterLog = require('../models/WaterLog');
const { calcTotals } = require('../services/nutritionCalc');
const logger = require('../logger');

const router = Router();
router.use(auth);

// GET /api/dashboard/today
router.get('/today', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    // Default to today's date if not passed, but usually frontend just asks for /today
    // We can use a query param ?date=YYYY-MM-DD, or just generate today in user's timezone.
    // For simplicity, let's use the date query param or generate UTC today if not provided.
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // Fetch all related documents for today
    const [goal, foodLogs, workout, wellbeing, weight, water] = await Promise.all([
      Goal.findOne({ userId }).lean(),
      FoodLog.find({ userId, date }).sort({ loggedAt: -1 }).lean(),
      Workout.findOne({ userId, date }).lean(),
      WellbeingLog.findOne({ userId, date }).lean(),
      WeightLog.findOne({ userId, date }).lean(),
      WaterLog.findOne({ userId, date }).lean(),
    ]);

    // 1. Calculate foodTotals
    // foodLogs is an array of meals. We need to sum up their totals.
    const foodTotals = calcTotals(foodLogs.map(f => f.totals).filter(Boolean));
    if (foodTotals.costEur === null) foodTotals.costEur = 0;

    // 2. Calculate remaining (goals - foodTotals, >= 0)
    const remaining = {
      protein: Math.max(0, (goal?.protein || 0) - foodTotals.protein),
      fat: Math.max(0, (goal?.fat || 0) - foodTotals.fat),
      carbs: Math.max(0, (goal?.carbs || 0) - foodTotals.carbs),
      fiber: Math.max(0, (goal?.fiber || 0) - foodTotals.fiber),
      calories: Math.max(0, (goal?.calories || 0) - foodTotals.calories)
    };

    // 3. waterMl
    const waterMl = water ? water.amountMl : 0;

    // 4. recentMeals (last 3 FoodLog entries)
    // Since we already sorted by loggedAt: -1 above, we just take first 3.
    const recentMeals = foodLogs.slice(0, 3);

    // 5. repeatSuggestion
    let repeatSuggestion = null;

    // Determine current meal type roughly by hour
    const tz = goal?.timezone || 'Europe/Rome';
    const hourStr = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(new Date());
    const hour = parseInt(hourStr, 10);
    
    let currentMealType = 'snack';
    if (hour >= 6 && hour < 11) currentMealType = 'breakfast';
    else if (hour >= 11 && hour < 16) currentMealType = 'lunch';
    else if (hour >= 16 && hour < 22) currentMealType = 'dinner';

    const hasCurrentMealToday = foodLogs.some(log => log.mealType === currentMealType);
    
    if (!hasCurrentMealToday) {
      repeatSuggestion = {
        mealType: currentMealType
      };
    }

    res.json({
      date,
      goals: goal || null,
      foodTotals,
      remaining,
      workout: workout || null,
      wellbeing: wellbeing || null,
      weight: weight || null,
      waterMl,
      recentMeals,
      repeatSuggestion
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/week
router.get('/week', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    // Calculate past 7 days based on startDate or today
    const queryDate = req.query.startDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(queryDate);
    
    const daysArr = [];
    const datesToQuery = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      datesToQuery.push(dStr);
    }
    
    datesToQuery.reverse(); // from oldest to newest

    const [goal, foodLogs, workouts, wellbeings, weights] = await Promise.all([
      Goal.findOne({ userId }).lean(),
      FoodLog.find({ userId, date: { $in: datesToQuery } }).lean(),
      Workout.find({ userId, date: { $in: datesToQuery } }).lean(),
      WellbeingLog.find({ userId, date: { $in: datesToQuery } }).lean(),
      WeightLog.find({ userId, date: { $in: datesToQuery } }).lean(),
    ]);

    let totalProtein = 0, totalFat = 0, totalCarbs = 0, totalFiber = 0, totalCalories = 0, weeklyFoodCost = 0;
    let daysWithFood = 0;
    let sumProteinPct = 0, sumFatPct = 0, sumCarbsPct = 0, sumFiberPct = 0, sumCaloriesPct = 0;

    const days = datesToQuery.map(dStr => {
      // Find data for this date
      const dayFoods = foodLogs.filter(f => f.date === dStr);
      const dayWorkout = workouts.find(w => w.date === dStr);
      const dayWellbeing = wellbeings.find(w => w.date === dStr);
      const dayWeight = weights.find(w => w.date === dStr);

      const foodTotals = calcTotals(dayFoods.map(f => f.totals).filter(Boolean));
      if (foodTotals.costEur === null) foodTotals.costEur = 0;

      if (dayFoods.length > 0) {
        daysWithFood++;
        totalProtein += foodTotals.protein;
        totalFat += foodTotals.fat;
        totalCarbs += foodTotals.carbs;
        totalFiber += foodTotals.fiber;
        totalCalories += foodTotals.calories;
        weeklyFoodCost += foodTotals.costEur;

        if (goal) {
          sumProteinPct += Math.min(100, Math.round((foodTotals.protein / goal.protein) * 100) || 0);
          sumFatPct += Math.min(100, Math.round((foodTotals.fat / goal.fat) * 100) || 0);
          sumCarbsPct += Math.min(100, Math.round((foodTotals.carbs / goal.carbs) * 100) || 0);
          sumFiberPct += Math.min(100, Math.round((foodTotals.fiber / goal.fiber) * 100) || 0);
          sumCaloriesPct += Math.min(100, Math.round((foodTotals.calories / goal.calories) * 100) || 0);
        }
      }

      return {
        date: dStr,
        foodTotals,
        hasWorkout: !!dayWorkout,
        wellbeing: dayWellbeing || null,
        weight: dayWeight || null
      };
    });

    const avgNutrients = {
      protein: daysWithFood ? Math.round(totalProtein / daysWithFood) : 0,
      fat: daysWithFood ? Math.round(totalFat / daysWithFood) : 0,
      carbs: daysWithFood ? Math.round(totalCarbs / daysWithFood) : 0,
      fiber: daysWithFood ? Math.round(totalFiber / daysWithFood) : 0,
      calories: daysWithFood ? Math.round(totalCalories / daysWithFood) : 0,
    };

    const goalsCompletion = {
      protein: daysWithFood ? Math.round(sumProteinPct / daysWithFood) : 0,
      fat: daysWithFood ? Math.round(sumFatPct / daysWithFood) : 0,
      carbs: daysWithFood ? Math.round(sumCarbsPct / daysWithFood) : 0,
      fiber: daysWithFood ? Math.round(sumFiberPct / daysWithFood) : 0,
      calories: daysWithFood ? Math.round(sumCaloriesPct / daysWithFood) : 0,
    };

    res.json({
      days,
      weeklyFoodCost: parseFloat(weeklyFoodCost.toFixed(2)),
      avgNutrients,
      goalsCompletion
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
