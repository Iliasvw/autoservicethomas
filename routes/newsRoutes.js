const express = require('express');
const router = express.Router();
const News = require('../models/News');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// 📁 Multer opslagconfiguratie voor nieuws
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/news'); // aangepaste folder
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 📌 GET all
router.get('/', async (req, res) => {
    try {
        const news = await News.find().sort({ _id: -1 });
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/visible', async (req, res) => {
    try {
        const selectedVisible = await News.find({ visible: true })
            .sort({ createdAt: -1 }) // meest recente eerst
            .limit(4); // toon maximaal 4

        return res.json(selectedVisible);
    } catch (error) {
        console.error('Fout bij ophalen zichtbare nieuwsitems:', error);
        res.status(500).json({ error: 'Serverfout' });
    }
});

// 📌 GET one
router.get('/:id', async (req, res) => {
    try {
        const newsItem = await News.findById(req.params.id);
        if (!newsItem) return res.status(404).json({ error: 'Niet gevonden' });
        res.json(newsItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 POST
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        const { title, urlFacebook, urlInstagram, localUrl } = req.body;
        const photo = req.file ? req.file.filename : null;

        const news = new News({
            title,
            urlFacebook,
            urlInstagram,
            photo,
            localUrl
        });

        await news.save();
        res.status(201).json({ message: 'Nieuwsbericht aangemaakt', news });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 PUT
router.put('/:id', upload.single('photo'), async (req, res) => {
    try {
        const { title, urlFacebook, urlInstagram, visible } = req.body;
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ error: 'Niet gevonden' });

        // Als er een nieuwe foto is: verwijder oude
        if (req.file && news.photo) {
            const oldPath = path.join(__dirname, '..', 'uploads', 'news', news.photo);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const updatedData = {
            title,
            urlFacebook,
            urlInstagram,
            photo: req.file ? req.file.filename : news.photo,
            visible,
        };

        const updatedNews = await News.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.json({ message: 'Nieuwsbericht bijgewerkt', news: updatedNews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 DELETE
router.delete('/:id', async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) return res.status(404).json({ error: 'Niet gevonden' });

        // Verwijder foto van schijf
        if (news.photo) {
            const filePath = path.join(__dirname, '..', 'uploads', 'news', news.photo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ message: 'Nieuwsbericht verwijderd' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
