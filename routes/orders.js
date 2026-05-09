const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authMiddleware = require('../middleware/auth');

// All order routes are protected
router.use(authMiddleware);

// POST /api/orders — checkout (cart → order)
router.post('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // Calculate total on the backend — never trust frontend price
    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const order = await Order.create({
      userId:     req.user.userId,
      items:      cart.items,
      totalPrice: Math.round(totalPrice * 100) / 100, // round to 2 decimal places
    });

    // Clear the cart after successful order
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// GET /api/orders — order history for logged in user
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 }); // newest first
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;