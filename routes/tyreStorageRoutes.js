const express = require('express');
const router = express.Router();
const TyreStorage = require('../models/TyreStorage');
const Customer = require('../models/Customer');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// POST nieuwe opslag
router.post('/', async (req, res) => {
  const { row, col, customerId, notes } = req.body;
  try {
    const storage = new TyreStorage({ row, col, customerId, notes });
    await storage.save();
    res.status(201).json(storage);
  } catch (err) {
    res.status(400).json({ message: 'Opslaglocatie bestaat al of data is ongeldig' });
  }
});

// PUT opslag bijwerken
router.put('/:row/:col', async (req, res) => {
  const { customerId, notes } = req.body;
  const { row, col } = req.params;
  const storage = await TyreStorage.findOneAndUpdate(
    { row, col },
    { customerId, notes },
    { new: true }
  );
  if (!storage) return res.status(404).json({ message: 'Niet gevonden' });
  res.json(storage);
});

// DELETE opslag verwijderen
router.delete('/:row/:col', async (req, res) => {
  const { row, col } = req.params;
  const deleted = await TyreStorage.findOneAndDelete({ row, col });
  if (!deleted) return res.status(404).json({ message: 'Niet gevonden' });
  res.json({ message: 'Verwijderd' });
});

router.get('/by-customer/:customerId', async (req, res) => {
    const { customerId } = req.params;

    try {
        const tyres = await TyreStorage.find({ customerId });
        
        if (!tyres || tyres.length === 0) {
            return res.status(200).json([]); // Lege array = geen banden
        }

        res.status(200).json(tyres);
    } catch (err) {
        console.error('Fout bij ophalen banden per klant:', err);
        res.status(500).json({ message: 'Serverfout bij ophalen banden.' });
    }
});

// GET opslaglocatie
router.get('/:row/:col', async (req, res) => {
  const { row, col } = req.params;
  const storage = await TyreStorage.findOne({ row, col }).populate('customerId');
  if (!storage) return res.status(200).json(null);
  res.json(storage);
});

module.exports = router;
