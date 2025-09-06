const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { mail, password } = req.body;
  const user = await User.findOne({ mail });
  if (!user) return res.status(401).json({ message: 'Gebruiker niet gevonden' });

  const valid = await user.matchPassword(password);
  if (!valid) return res.status(401).json({ message: 'Wachtwoord ongeldig' });

  const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });

  res.json({ token, username: user.username });
});

module.exports = router;
