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
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
