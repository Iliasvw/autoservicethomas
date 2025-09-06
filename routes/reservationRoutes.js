const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Car = require('../models/Car');
const Customer = require('../models/Customer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// Multer voor PDF upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads/contracts';
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// ✅ Nieuwe reservatie aanmaken
router.post('/', async (req, res) => {
    try {
        const { customerId, carId, startDate, notes, car, mileageStart, fuelLevel, costs } = req.body;
        const reservation = new Reservation({ customerId, carId, startDate, notes, car, mileageStart, fuelLevel, costs });
        await reservation.save();
        res.status(201).json(reservation);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Fout bij aanmaken reservatie.' });
    }
});

// ✅ Alle reservaties ophalen met paging en filter op actief
router.get('/', async (req, res) => {
    try {
        const { active, page = 1, limit = 20, search, startDate, endDate } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const regex = search ? new RegExp(search, 'i') : null;

        const aggregatePipeline = [];

        // Filter op actieve reservaties
        if (active === 'true') {
            aggregatePipeline.push({ $match: { endDate: null } });
        }

        // Join klant en wagen
        aggregatePipeline.push(
            { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
            { $unwind: '$customer' },
            { $lookup: { from: 'cars', localField: 'carId', foreignField: '_id', as: 'replacementCar' } },
            { $unwind: '$replacementCar' }
        );

        // Voeg fullName en datum strings toe voor zoeken
        aggregatePipeline.push({
            $addFields: {
                fullName: { $concat: ['$customer.name', ' ', '$customer.firstName'] },
                startDateString: {
                    $dateToString: { format: '%d/%m/%Y', date: '$startDate' }
                },
                endDateString: {
                    $cond: {
                        if: { $ne: ['$endDate', null] },
                        then: { $dateToString: { format: '%d/%m/%Y', date: '$endDate' } },
                        else: null
                    }
                }
            }
        });

        // Zoekveld (search) op meerdere velden
        if (regex) {
            aggregatePipeline.push({
                $match: {
                    $or: [
                        { 'customer.name': regex },
                        { 'customer.firstName': regex },
                        { fullName: regex },
                        { 'replacementCar.make': regex },
                        { 'replacementCar.type': regex },
                        { 'replacementCar.licensePlate': regex },
                        { 'car.make': regex },
                        { 'car.type': regex },
                        { 'car.licensePlate': regex },
                        { startDateString: regex },
                        { endDateString: regex }
                    ]
                }
            });
        }

        // Filter op startDate (exacte match op dag/maand/jaar)
        if (startDate) {
            aggregatePipeline.push({
                $match: {
                    startDateString: { $regex: new RegExp(startDate, 'i') }
                }
            });
        }

        if (endDate) {
            aggregatePipeline.push({
                $match: {
                    endDateString: { $regex: new RegExp(endDate, 'i') }
                }
            });
        }

        // Sorteer en paginatie
        aggregatePipeline.push(
            { $sort: { startDate: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        );

        const reservations = await Reservation.aggregate(aggregatePipeline);

        // Aparte count voor totaal
        const countPipeline = aggregatePipeline.filter(
            stage => !('$skip' in stage) && !('$limit' in stage) && !('$sort' in stage)
        );
        countPipeline.push({ $count: 'total' });

        const countResult = await Reservation.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        res.json({
            data: reservations,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Fout bij ophalen reservaties.' });
    }
});


const generateContractPdf = require('../utils/generateContractPdf');

// ✅ Contract genereren
router.post('/generate-contract/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('customerId').populate('carId');
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // 🟩 Correct de customer en car uit de populates halen:
        const customer = reservation.customerId;
        const car = reservation.carId;

        // 🖨️ Hier genereer je het PDF bestand:
        const pdfPath = `uploads/contracts/reservatie-${reservation._id}.pdf`;
        await generateContractPdf(reservation, customer, car); // jouw puppeteer/pdfkit functie

        // 📌 Opslaan in de reservatie:
        reservation.generatedContractUrl = `/${pdfPath}`; // Let op de '/' voor correcte URL
        await reservation.save();

        // 📤 Terugsturen naar frontend:
        return res.json({ contractUrl: reservation.generatedContractUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generating contract' });
    }
});

// ✅ Reservatie beëindigen
router.put('/edit/:id', async (req, res) => {
    try {
        const updatedReservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reservatie niet gevonden.' });
        }

        res.json(updatedReservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Er ging iets mis bij het updaten van de reservatie.' });
    }
});

// ✅ Reservatie beëindigen
router.put('/end/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { endDate: new Date() },
            { new: true }
        );
        if (!reservation) {
            return res.status(404).json({ message: 'Reservatie niet gevonden' });
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: 'Fout bij beëindigen reservatie.' });
    }
});

// ✅ Contract uploaden
router.post('/upload-contract/:id', upload.single('contract'), async (req, res) => {
    try {
        const fileUrl = `/uploads/contracts/${req.file.filename}`;
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { signedContractUrl: fileUrl },
            { new: true }
        );
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: 'Fout bij uploaden contract.' });
    }
});

// ✅ Enkelvoudige reservatie ophalen
router.get('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('customerId')
            .populate('carId');
        if (!reservation) {
            return res.status(404).json({ message: 'Reservatie niet gevonden' });
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: 'Fout bij ophalen reservatie.' });
    }
});


module.exports = router;
