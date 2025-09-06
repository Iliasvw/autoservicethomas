const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'maintenance', 'keuring'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car', // of het juiste model dat je gebruikt
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  autoCreate: {
    type: Boolean,
  },
});
module.exports = mongoose.model('Notification', notificationSchema);