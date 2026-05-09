const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const authMiddleware = require('../middleware/auth');

// All cart routes are protected
router.use(authMiddleware);

// GET /api/cart — get current user's cart
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart — add item to cart
router.post('/', async (req, res) => {
  try {
    const { menuItemId, name, price, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      // First item — create a new cart
      cart = await Cart.create({
        userId: req.user.userId,
        items: [{ menuItemId, name, price, quantity }]
      });
    } else {
      // Cart exists — check if item already in cart
      const existingItem = cart.items.find(
        item => item.menuItemId.toString() === menuItemId
      );

      if (existingItem) {
        existingItem.quantity += quantity; // bump quantity
      } else {
        cart.items.push({ menuItemId, name, price, quantity }); // add new item
      }

      await cart.save();
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/:itemId — update quantity of an item
router.put('/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in cart' });

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/cart/:itemId — remove item from cart
router.delete('/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

module.exports = router;