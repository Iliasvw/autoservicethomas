const mongoose = require('mongoose');

const tyreStorageSchema = new mongoose.Schema({
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    notes: String
});

module.exports = mongoose.model('TyreStorage', tyreStorageSchema);