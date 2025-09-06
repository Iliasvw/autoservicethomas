const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  notes: { type: String },
  signedContractUrl: { type: String },      // geüpload PDF-bestand
  generatedContractUrl: { type: String },
  car : { 
    make: {
      type: String,
    }, type: {
      type: String,
    }, licensePlate: {
      type: String,
    }, vin: {
      type: String,
    },
   }, 
   mileageStart: { type: String },
   fuelLevel: { type: String },
   costs : {
    insurance: {
      type: Number,
    }, dayCost: {
      type: Number,
    }, days: {
      type: Number,
    }, mileCost: {
      type: Number,
    }, miles: {
      type: Number,
    }, fuelCost: {
      type: Number,
    }, 
   }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
