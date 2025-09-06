// routes/stats.js
const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const Vehicle = require('../models/MarketCar');
const Reservation = require('../models/Reservation');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const News = require('../models/News');
const Review = require('../models/Review');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const [vehicleCount, carCount, reservationCount, activeReservationCount, userCount, notificationCount, newsCount, ReviewCount] =
      await Promise.all([
        Vehicle.countDocuments(),
        Car.countDocuments(),
        Reservation.countDocuments(),
        Reservation.countDocuments({ endDate: null }),
        Customer.countDocuments(),
        Notification.countDocuments(),
        News.countDocuments(),
        Review.countDocuments(),
      ]);

    res.json({
      vehicles: vehicleCount,
      cars: carCount,
      reservations: reservationCount,
      activeReservations: activeReservationCount,
      users: userCount,
      notifications: notificationCount,
      news: newsCount,
      reviews: ReviewCount,
    });
  } catch (err) {
    console.error('Fout bij ophalen statistieken:', err);
    res.status(500).json({ message: 'Serverfout bij ophalen statistieken' });
  }
});

module.exports = router;
