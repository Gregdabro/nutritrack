const mongoose = require('mongoose');

const { Schema } = mongoose;

const FoodItemSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, ref: 'Product', default: null },
  recipeId:    { type: Schema.Types.ObjectId, ref: 'Recipe', default: null },
  name:        { type: String, required: true },
  grams:       { type: Number, required: true },
  servings:    { type: Number, default: null },   // для рецептов
  protein:     Number,
  fat:         Number,
  carbs:       Number,
  fiber:       Number,
  calories:    Number,
  costEur:     { type: Number, default: null },
}, { _id: false });

const FoodLogSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },   // 'YYYY-MM-DD'
  loggedAt:  { type: Date, default: Date.now },
  mealType:  {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack',
  },
  items:     [FoodItemSchema],
  totals: {
    protein:  Number,
    fat:      Number,
    carbs:    Number,
    fiber:    Number,
    calories: Number,
    costEur:  Number,
  },
  source:    { type: String, enum: ['telegram', 'web'], default: 'telegram' },
  rawInput:  { type: String },
});

FoodLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('FoodLog', FoodLogSchema);
