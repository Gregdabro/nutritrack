const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema(
  {
    reps:        { type: Number },
    weightKg:    { type: Number, default: 0 },
    durationSec: { type: Number },
  },
  { _id: false },
);

const ExerciseSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    sets:  { type: [SetSchema], default: [] },
    notes: { type: String },
  },
  { _id: false },
);

const WorkoutSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:             { type: String, required: true }, // 'YYYY-MM-DD'
  name:             { type: String, required: true },
  type:             {
    type: String,
    enum: ['home', 'gym', 'run', 'bike', 'swim', 'other'],
    default: 'home',
  },
  exercises:        { type: [ExerciseSchema], default: [] },
  durationMinutes:  { type: Number },
  perceivedEffort:  { type: Number, min: 1, max: 10 },
  caloriesBurned:   { type: Number, default: 0 },
  notes:            { type: String },
  createdAt:        { type: Date, default: Date.now },
});

WorkoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Workout', WorkoutSchema);
