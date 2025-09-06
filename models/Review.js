const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    firstName: { type: String, default: null, required: true },
    lastName: { type: String, default: null, required: true },
    rating: { type: Number, default: null, required: true },
    message: { type: String, default: null, required: true },
    date: { type: String, default: null, required: true },
    visible: { type: Boolean, default: false },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Review', reviewSchema);