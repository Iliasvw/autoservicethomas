const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Car = require('../models/Car');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// Get all notifications with car info populated
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().populate('carId');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij ophalen meldingen' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate('carId');
    if (!notification) return res.status(404).json({ message: 'Melding niet gevonden' });

    const response = {
      ...notification.toObject(),
      carId: notification.carId === null ? 'Algemeen' : notification.carId,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij ophalen melding' });
  }
});

// POST: Nieuwe melding aanmaken
router.post('/', async (req, res) => {
  try {
    const { type, message, carId } = req.body;

    // Basisvalidatie
    if (!type || !message) {
      return res.status(400).json({ error: 'Type en bericht zijn verplicht.' });
    }

    const newNotification = new Notification({
      type,
      message,
      carId: carId === "Algemeen" || carId === '' ? null : carId,
    });

    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Fout bij aanmaken melding:', error);
    res.status(500).json({ error: 'Serverfout bij aanmaken melding.' });
  }
});

router.post('/cars/onderhoud/:id', async (req, res) => {
  const { newMaintenanceDate } = req.body; // datum doorgeven, of default vandaag
  const carId = req.params.id;

  await Car.findByIdAndUpdate(carId, {
    lastMaintenanceDate: newMaintenanceDate || new Date(),
  });

  // Afhandelen meldingen
  await Notification.updateMany(
    { carId, type: 'Onderhoud', status: 'actief' },
    { status: 'afgehandeld' }
  );

  res.json({ message: 'Onderhoudsdatum bijgewerkt en meldingen gereset' });
});

// PUT: Melding bijwerken
router.put('/:id', async (req, res) => {
  try {
    const { type, message, carId } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'Type en bericht zijn verplicht.' });
    }

    const update = {
      type,
      message,
      carId: carId === "Algemeen" || !carId ? null : carId,
    };

    if (!update.carId) delete update.carId;

    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Melding niet gevonden.' });
    }

    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Fout bij bijwerken melding:', error);
    res.status(500).json({ error: 'Serverfout bij bijwerken melding.' });
  }
});

router.post('/cars/keuring/:id', async (req, res) => {
  const { newInspectionDate } = req.body;
  const carId = req.params.id;

  await Car.findByIdAndUpdate(carId, {
    lastInspectionDate: newInspectionDate || new Date(),
  });

  await Notification.updateMany(
    { carId, type: 'Keuring', status: 'actief' },
    { status: 'afgehandeld' }
  );

  res.json({ message: 'Keuringdatum bijgewerkt en meldingen gereset' });
});

// DELETE: Verwijder melding op ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Melding niet gevonden.' });
    }

    res.status(200).json({ message: 'Melding verwijderd.' });
  } catch (error) {
    console.error('Fout bij verwijderen melding:', error);
    res.status(500).json({ error: 'Serverfout bij verwijderen melding.' });
  }
});

module.exports = router;