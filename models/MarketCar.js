const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  euronorm: { type: String, default: '' },
  carBody: { type: String, default: '' },
  doors: { type: Number, default: 0 },
  transmission: { type: String, default: '' },
  drivetrain: { type: String, default: '' },
  color: { type: String, default: '' },
  interior: { type: String, default: '' },
  upholstery: { type: String, default: '' },
  year: { type: Number, default: null },
  co2: { type: Number, default: null },
  mileage: { type: Number, default: null },
  power: { type: Number, default: null },
  engineSize: { type: Number, default: null },
  carpassUrl: { type: String, default: '' },
  fuel: { type: String, default: '' },
  cilinders: { type: Number, default: '' },
  seats: { type: Number, default: '' },
  gears: { type: Number, default: '' },
  maintenanceBook: { type: Boolean, default: false },
  smokeCar: { type: Boolean, default: false },
  noDamage: { type: Boolean, default: false },
  options: { type: [String], default: [] },
  photos: { type: [String], default: [] }, // hier slaan we URLs of bestandsnamen op
}, { timestamps: true });

module.exports = mongoose.model('MarketCar', vehicleSchema);