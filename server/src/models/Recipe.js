const mongoose = require('mongoose');

const { Schema } = mongoose;

const RecipeSchema = new Schema({
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true },
  totalServings: { type: Number, required: true, min: 1 },
  ingredients: [{
    productId:   { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: String,   // денормализовано для быстрого отображения
    grams:       Number,
  }],
  // Кэшированные расчёты (пересчитываются при изменении рецепта)
  totalNutrients: {
    protein:  Number,
    fat:      Number,
    carbs:    Number,
    fiber:    Number,
    calories: Number,
  },
  perServingNutrients: {
    protein:  Number,
    fat:      Number,
    carbs:    Number,
    fiber:    Number,
    calories: Number,
  },
  totalCostEur:      { type: Number, default: null },
  perServingCostEur: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

RecipeSchema.index({ userId: 1, name: 'text' });

module.exports = mongoose.model('Recipe', RecipeSchema);
