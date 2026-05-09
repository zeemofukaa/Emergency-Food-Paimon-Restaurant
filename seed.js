require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const menuData = require('./menu.json');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  await MenuItem.deleteMany(); // clear old data
  await MenuItem.insertMany(menuData);
  console.log('Menu seeded successfully!');
  process.exit();
};

seed();