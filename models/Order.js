const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name:       { type: String, required: true },
      price:      { type: Number, required: true },
      quantity:   { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true }, // always calculated on backend
  status:     { type: String, default: 'placed', enum: ['placed', 'preparing', 'delivered'] },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);