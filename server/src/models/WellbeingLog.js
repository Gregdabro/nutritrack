const mongoose = require('mongoose');

const { Schema } = mongoose;

const WellbeingLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  overall: {
    type: String,
    enum: ['great', 'good', 'ok', 'bad', 'sick'],
    required: true,
  },
  energy: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  sleep: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  stress: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  mood: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  symptoms: {
    type: [String],
    enum: ['back_pain', 'joint_pain', 'fatigue', 'headache', 'stomach', 'other'],
    default: [],
  },
  notes: {
    type: String,
    default: '',
  },
});

WellbeingLogSchema.index({ userId: 1, date: -1 });
WellbeingLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WellbeingLog', WellbeingLogSchema);
