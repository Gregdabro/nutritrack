const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  protein:      { type: Number, default: 100 },
  fat:          { type: Number, default: 100 },
  carbs:        { type: Number, default: 200 },
  fiber:        { type: Number, default: 30 },
  calories:     { type: Number, default: 2100 },
  water:        { type: Number, default: 2000 },
  weeklyBudget: { type: Number, default: null },
  updatedAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Goal', GoalSchema);
