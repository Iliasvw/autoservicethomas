const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

const { authenticateToken } = require('../middlewares/authMiddleware');
router.use(authenticateToken);

// GET all reviews (optioneel: sorteer op createdAt)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Fout bij ophalen reviews:', error);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET visible reviews (max 4)
router.get('/visible', async (req, res) => {
  try {
    const visibleReviews = await Review.find({ visible: true }).sort({ createdAt: -1 }).limit(4);
    res.json(visibleReviews);
  } catch (error) {
    console.error('Fout bij ophalen zichtbare reviews:', error);
    res.status(500).json({ error: 'Serverfout' });
  }
});

router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review niet gevonden' });
        }

        res.json(review);
    } catch (error) {
        console.error('Fout bij ophalen review:', error);
        res.status(500).json({ error: 'Serverfout' });
    }
});

// POST nieuwe review
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, rating, message, date, visible } = req.body;

    if (!firstName || !lastName || !rating || !message) {
      return res.status(400).json({ error: 'Vul alle verplichte velden in.' });
    }

    // Optioneel: check of visible = true en max 4 visible niet overschrijdt
    if (visible) {
      const visibleCount = await Review.countDocuments({ visible: true });
      if (visibleCount >= 4) {
        return res.status(400).json({ error: 'Maximum van 4 zichtbare reviews bereikt.' });
      }
    }

    const newReview = new Review({ firstName, lastName, rating, message, date, visible: !!visible });
    const savedReview = await newReview.save();

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Fout bij aanmaken review:', error);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// PUT update review
router.put('/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { firstName, lastName, rating, message, visible, date } = req.body;

    // Vind bestaande review
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review niet gevonden.' });

    // Als author velden meegegeven worden, update author
    if (firstName) review.firstName = firstName;
    if (lastName) review.lastName = lastName;
    if (rating) review.rating = rating;
    if (message) review.message = message;
    if (date) review.date = date;

    // Visible validatie
    if (typeof visible !== 'undefined') {
      if (visible === true && review.visible === false) {
        const visibleCount = await Review.countDocuments({ visible: true, _id: { $ne: reviewId } });
        if (visibleCount >= 4) {
          return res.status(400).json({ error: 'Maximum van 4 zichtbare reviews bereikt.' });
        }
      }
      review.visible = visible;
    }

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (error) {
    console.error('Fout bij updaten review:', error);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// DELETE review
router.delete('/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) return res.status(404).json({ error: 'Review niet gevonden.' });

    res.json({ message: 'Review verwijderd.' });
  } catch (error) {
    console.error('Fout bij verwijderen review:', error);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
