const mongoose = require('mongoose');

const { Schema } = mongoose;

const LoginTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 300 seconds = 5 minutes TTL
  },
});

module.exports = mongoose.model('LoginToken', LoginTokenSchema);
