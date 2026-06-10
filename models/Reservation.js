const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  date:    { type: String, required: true },
  time:    { type: String, required: true },
  guests:  { type: Number, required: true, min: 1, max: 20 },
  note:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);