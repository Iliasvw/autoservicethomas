const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  type: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true },
  maintenanceDate: { type: Date, required: true },
  inspectionDate: { type: Date, required: true },
  dateOfRegistration: { type: Date, required: true },
  vin: { type: String, required: true },
});

module.exports = mongoose.model('Car', carSchema);