const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const Customer = require('../models/Customer');
const Reservation = require('../models/Reservation');
const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// Get all cars with customer info populated
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij ophalen autos' });
  }
});

// GET /api/cars/with-status
router.get('/with-status', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const searchRegex = new RegExp(search, 'i');

    // Zoekquery op make, type, licensePlate
    const query = {
      $or: [
        { make: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { licensePlate: { $regex: searchRegex } },
      ],
    };

    // Tel totaal
    const total = await Car.countDocuments(query);

    // Haal auto's met zoekfilter en paginering
    const cars = await Car.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Haal actieve reservaties op voor alle gevonden auto's
    const carIds = cars.map(car => car._id);
    const activeReservations = await Reservation.find({
      carId: { $in: carIds },
      endDate: null,
    }).populate('customerId');

    // Map met leningen
    const lentCarMap = {};
    activeReservations.forEach(reservation => {
      lentCarMap[reservation.carId.toString()] = reservation.customerId?.name || 'Onbekend';
    });

    // Voeg status toe aan auto's
    const carsWithStatus = cars.map(car => ({
      ...car.toObject(),
      isLent: !!lentCarMap[car._id.toString()],
    }));

    res.json({
      data: carsWithStatus,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalItems: total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fout bij ophalen wagenstatussen.' });
  }
});

// Get one car
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Auto niet gevonden' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij ophalen auto' });
  }
});

// Create new car
router.post('/', async (req, res) => {
  const { make, type, licensePlate, maintenanceDate, inspectionDate, dateOfRegistration, vin } = req.body;

  try {
    const car = new Car({
      make,
      type,
      licensePlate,
      maintenanceDate,
      inspectionDate,
      dateOfRegistration,
      vin,
    });

    await car.save();
    res.status(201).json(car);
  } catch (err) {
    console.error('Fout bij opslaan auto:', err);
    res.status(500).json({ message: 'Fout bij opslaan auto', error: err.message });
  }
});


// Update car
router.put('/:id', async (req, res) => {
  const { make, type, licensePlate, maintenanceDate, inspectionDate, dateOfRegistration, vin } = req.body;
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Auto niet gevonden' });

    car.make = make ?? car.make;
    car.type = type ?? car.type;
    car.licensePlate = licensePlate ?? car.licensePlate;
    car.maintenanceDate = maintenanceDate ?? car.maintenanceDate;
    car.inspectionDate = inspectionDate ?? car.inspectionDate;
    car.dateOfRegistration = dateOfRegistration ?? car.dateOfRegistration;
    car.vin = vin ?? car.vin;

    await car.save();
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij bijwerken auto' });
  }
});

// Delete car
router.delete('/:id', async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ message: 'Auto niet gevonden' });
    res.json({ message: 'Auto verwijderd' });
  } catch (err) {
    res.status(500).json({ message: 'Fout bij verwijderen auto' });
  }
});

module.exports = router;
