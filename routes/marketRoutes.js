const express = require('express');
const router = express.Router();
const Vehicle = require('../models/MarketCar');
const News = require('../models/News');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'uploads', 'vehicles');
const uploadDirNews = path.join(__dirname, '..', 'uploads', 'news');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// Multer configuratie voor upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/vehicles');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// GET route om alle voertuigen op te halen
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 }); // nieuwste eerst
        res.json(vehicles);
    } catch (error) {
        console.error('Fout bij ophalen voertuigen:', error);
        res.status(500).json({ error: 'Serverfout bij ophalen voertuigen' });
    }
});

// GET route om één voertuig op te halen via ID
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Voertuig niet gevonden' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error('Fout bij ophalen voertuig:', error);
        res.status(500).json({ error: 'Serverfout bij ophalen voertuig' });
    }
});

// Protect middleware kan je hier toevoegen, bv:
// const { authenticateToken } = require('../middleware/auth');

// POST route voor nieuwe voertuig
router.post('/', /* authenticateToken, */ upload.array('photos'), async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            brand,
            model,
            euronorm,
            carBody,
            doors,
            transmission,
            drivetrain,
            color,
            interior,
            upholstery,
            year,
            co2,
            mileage,
            power,
            engineSize,
            carpassUrl,
            options,
            fuel,
            seats,
            gears,
            cilinders,
            maintenanceBook,
            noDamage,
            smokeCar,
        } = req.body;

        // Opties kunnen als string komen (één optie) of als array van strings
        let optionsArr = [];
        if (options) {
            if (Array.isArray(options)) {
                optionsArr = options;
            } else if (typeof options === 'string') {
                optionsArr = [options];
            }
        }

        // Foto-bestanden: multer heeft ze geüpload, we bewaren alleen de bestandsnamen
        const photos = req.files.map(file => file.filename);

        const newVehicle = new Vehicle({
            title,
            description,
            price: Number(price),
            brand,
            model,
            euronorm,
            carBody,
            doors: Number(doors),
            transmission,
            drivetrain,
            color,
            interior,
            upholstery,
            fuel,
            year: year ? Number(year) : null,
            co2: co2 ? Number(co2) : null,
            mileage: mileage ? Number(mileage) : null,
            power: power ? Number(power) : null,
            engineSize: engineSize ? Number(engineSize) : null,
            carpassUrl,
            seats,
            gears,
            cilinders,
            maintenanceBook,
            noDamage,
            smokeCar,
            options: optionsArr,
            photos: allPhotos, // ✅ hier zit alles in
        });

        const savedVehicle = await newVehicle.save();

        const originalPhotoPath = path.join(uploadDir, savedVehicle.photos[0]);
        const newsPhotoPath = path.join(uploadDirNews, savedVehicle.photos[0]);

        // Kopieer bestand van vehicles/ naar news/
        fs.copyFileSync(originalPhotoPath, newsPhotoPath);

        const newNews = new News({
            title: `Te koop: ${brand} ${model}`,
            photo: savedVehicle.photos[0],
            visible: false,
            localUrl: `http://localhost:3000/tweedehands/${savedVehicle._id}`,
        })

        await newNews.save();

        res.status(201).json({ message: 'Voertuig succesvol toegevoegd', vehicle: newVehicle });
    } catch (error) {
        console.error('Fout bij opslaan voertuig:', error);
        res.status(500).json({ error: 'Serverfout bij opslaan voertuig' });
    }
});

// PUT route om een voertuig te bewerken
router.put('/:id', upload.array('photos'), async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            brand,
            model,
            euronorm,
            carBody,
            doors,
            transmission,
            drivetrain,
            color,
            interior,
            upholstery,
            year,
            co2,
            mileage,
            power,
            engineSize,
            carpassUrl,
            options,
            fuel,
            seats,
            gears,
            cilinders,
            maintenanceBook,
            noDamage,
            smokeCar,
        } = req.body;

        // 1. 🧠 Verwerk 'options'
        const optionsArr = Array.isArray(options)
            ? options
            : typeof options === 'string' ? [options] : [];

        // 2. 🧠 Verwerk bestaande foto's (meegegeven via FormData)
        let existingPhotos = [];
        if (req.body.existingPhotos) {
            existingPhotos = Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos];
        }

        // 3. 🧠 Verwerk nieuwe geüploade foto's
        const newPhotos = req.files ? req.files.map(file => file.filename) : [];

        // 4. 🔄 Combineer bestaande + nieuwe foto's
        const allPhotos = [...existingPhotos, ...newPhotos];

        // 5. 📂 Haal het huidige voertuig op uit de database
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Voertuig niet gevonden' });
        }

        // 6. 🗑 Verwijder foto's van server die niet meer in 'allPhotos' zitten
        const removedPhotos = vehicle.photos.filter(p => !allPhotos.includes(p));
        for (const filename of removedPhotos) {
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 7. 📦 Stel update data samen
        const updatedData = {
            title,
            description,
            price: Number(price),
            brand,
            model,
            euronorm,
            carBody,
            doors: Number(doors),
            transmission,
            drivetrain,
            color,
            interior,
            upholstery,
            fuel,
            year: year ? Number(year) : null,
            co2: co2 ? Number(co2) : null,
            mileage: mileage ? Number(mileage) : null,
            power: power ? Number(power) : null,
            engineSize: engineSize ? Number(engineSize) : null,
            carpassUrl,
            seats,
            gears,
            cilinders,
            maintenanceBook,
            noDamage,
            smokeCar,
            options: optionsArr,
            photos: allPhotos, // ✅ hier zit alles in
        };

        // 8. ✅ Voertuig bijwerken
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        res.json({ message: 'Voertuig succesvol bijgewerkt', vehicle: updatedVehicle });

    } catch (error) {
        console.error('Fout bij updaten voertuig:', error);
        res.status(500).json({ error: 'Serverfout bij updaten voertuig' });
    }
});

// DELETE route om een voertuig te verwijderen
router.delete('/:id', async (req, res) => {
    try {
        const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!deletedVehicle) {
            return res.status(404).json({ error: 'Voertuig niet gevonden' });
        }

        const fs = require('fs');
        const path = require('path');

        // Verwijder foto's van schijf
        deletedVehicle.photos.forEach(photo => {
            const filePath = path.join(__dirname, '..', 'uploads', 'vehicles', photo);
            fs.unlink(filePath, err => {
                if (err) console.warn('Kon foto niet verwijderen:', filePath);
            });
        });

        res.json({ message: 'Voertuig succesvol verwijderd' });
    } catch (error) {
        console.error('Fout bij verwijderen voertuig:', error);
        res.status(500).json({ error: 'Serverfout bij verwijderen voertuig' });
    }
});

module.exports = router;
