const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId:   { type: String, required: true, unique: true },
  firstName:    { type: String, required: true },
  lastName:     { type: String },
  username:     { type: String },
  photoUrl:     { type: String },
  language:     { type: String, default: 'ru' },
  timezone:     { type: String, default: 'Europe/Rome' },
  weightKg:     { type: Number },
  heightCm:     { type: Number },
  botState:     { type: String, default: 'idle' },
  botStateData: { type: mongoose.Schema.Types.Mixed },
  reminders:    {
    morning:  { type: Boolean, default: true },
    evening:  { type: Boolean, default: false },
    morningTime: { type: String, default: '08:00' },
  },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
