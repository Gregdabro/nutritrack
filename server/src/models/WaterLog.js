const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  amountMl: { type: Number, required: true, min: 0 },
  loggedAt: { type: Date, default: Date.now },
});

waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WaterLog', waterLogSchema);
