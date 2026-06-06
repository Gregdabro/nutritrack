const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  aliases:  [{ type: String }],
  per100g: {
    protein:  { type: Number, default: 0 },
    fat:      { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fiber:    { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
  },
  currentPriceEur: { type: Number, default: null },
  priceHistory: [{
    priceEur: Number,
    store:    String,
    date:     { type: Date, default: Date.now },
  }],
  category: {
    type: String,
    enum: ['meat', 'fish', 'dairy', 'grain', 'vegetable', 'fruit',
           'drink', 'drink_undesirable', 'supplement', 'other'],
    default: 'other',
  },
  createdAt: { type: Date, default: Date.now },
});

ProductSchema.index({ userId: 1, name: 'text', aliases: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
