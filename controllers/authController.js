const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Ongeldige gebruikersnaam of wachtwoord' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Serverfout bij inloggen' });
  }
};

exports.seedUsers = async (req, res) => {
  try {
    const existing = await User.find();
    if (existing.length > 0) return res.json({ message: 'Gebruikers al aangemaakt' });

    const defaultUsers = [
      { username: 'thomas1', password: 'Welkom123' },
      { username: 'thomas2', password: 'Welkom123' },
      { username: 'thomas3', password: 'Welkom123' }
    ];

    for (const user of defaultUsers) {
      const newUser = new User(user);
      await newUser.save();
    }

    res.json({ message: 'Gebruikers succesvol toegevoegd' });
  } catch (err) {
    res.status(500).json({ message: 'Fout bij toevoegen gebruikers' });
  }
};
