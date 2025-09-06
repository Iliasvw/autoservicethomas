const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const allowedOrigin = 'http://localhost:3000'; // pas aan naar jouw domein http://www.
  const origin = req.headers.origin;

  if (
    req.method === 'GET' &&
    origin === allowedOrigin
  ) {
    return next(); // geen token nodig voor GET vanaf deze origin
  }

  // Anders: haal token uit Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token ontbreekt' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token ongeldig' });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };

/** Deze middleware voeg je toe aan routes waar alleen geauthenticeerde gebruikers toegang toe mogen hebben.

Bijvoorbeeld in een route:

js
Kopiëren
Bewerken
const { protect } = require('../middlewares/authMiddleware');

router.get('/geheim', protect, (req, res) => {
  res.send('Alleen zichtbaar voor ingelogden');
}); **/