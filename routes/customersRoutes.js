const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query = {
        $or: [
          // Tekstuele zoekvelden
          { name: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { street: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },

          // Numerieke velden (als string doorzocht)
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$zipCode" },
                regex: search,
                options: "i"
              }
            }
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$houseNumber" },
                regex: search,
                options: "i"
              }
            }
          }
        ]
      };
    }

    const totalCount = await Customer.countDocuments(query);

    const customers = await Customer.find(query)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: customers,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fout bij ophalen klanten' });
  }
});


// Get one customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Klant niet gevonden' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij ophalen klant' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  const { name, firstName, phone, email, zipCode, city, street, houseNumber, drivingLicense, dateOfBirth, placeOfBirth } = req.body;
  try {
    const customer = new Customer({ name, firstName, phone, email, zipCode, city, street, houseNumber, drivingLicense, dateOfBirth, placeOfBirth });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij opslaan klant' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  const { name, firstName, phone, email, zipCode, city, street, houseNumber, drivingLicense, dateOfBirth, placeOfBirth } = req.body;
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Klant niet gevonden' });

    customer.name = name ?? customer.name;
    customer.firstName = firstName ?? customer.firstName;
    customer.phone = phone ?? customer.phone;
    customer.email = email ?? customer.email;
    customer.zipCode = zipCode ?? customer.zipCode;
    customer.city = city ?? customer.city;
    customer.street = street ?? customer.street;
    customer.houseNumber = houseNumber ?? customer.houseNumber;
    customer.drivingLicense = drivingLicense ?? customer.drivingLicense;
    customer.dateOfBirth = dateOfBirth ?? customer.dateOfBirth;
    customer.placeOfBirth = placeOfBirth ?? customer.placeOfBirth;

    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij bijwerken klant' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Klant niet gevonden' });
    res.json({ message: 'Klant verwijderd' });
  } catch (err) {
    res.status(500).json({ message: 'Fout bij verwijderen klant' });
  }
});

module.exports = router;
