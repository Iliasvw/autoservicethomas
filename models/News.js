const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, default: null, required: true },
    urlFacebook: { type: String, default: null, required: false },
    urlInstagram: { type: String, default: null, required: false },
    photo: { type: String, default: null, required: true },
    visible: { type: Boolean, default: false },
    localUrl: { type: String, default: null, required: false }
}, {
    timestamps: true,
});

module.exports = mongoose.model('News', newsSchema);