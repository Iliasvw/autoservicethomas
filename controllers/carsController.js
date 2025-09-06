const Car = require('../models/Car');
const Notification = require('../models/Notification');

exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find().populate('assignedTo');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij ophalen van wagens' });
  }
};

exports.createCar = async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij aanmaken van wagen' });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Fout bij updaten van wagen' });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Wagen verwijderd' });
  } catch (err) {
    res.status(500).json({ message: 'Fout bij verwijderen van wagen' });
  }
};
