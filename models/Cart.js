const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      name:       { type: String, required: true },
      price:      { type: Number, required: true },
      quantity:   { type: Number, required: true, default: 1 },
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);