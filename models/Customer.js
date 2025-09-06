const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: String,
  firstName: String,
  email: String,
  phone: String,
  zipCode: Number,
  city: String,
  street: String,
  houseNumber: Number,
  drivingLicense: String,
  dateOfBirth: Date,
  placeOfBirth: String,
});

module.exports = mongoose.model('Customer', customerSchema);
