const mongoose = require('mongoose');

const { Schema } = mongoose;

const WeightLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  weightKg: {
    type: Number,
    required: true,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

WeightLogSchema.index({ userId: 1, date: -1 });
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WeightLog', WeightLogSchema);
