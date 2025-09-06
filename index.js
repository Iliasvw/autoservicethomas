const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carsRoutes');
const customerRoutes = require('./routes/customersRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const tyreStoreRoutes = require('./routes/tyreStorageRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const marketRoutes = require('./routes/marketRoutes');
const statsRoutes = require('./routes/statsRoutes');
const newsRoutes = require('./routes/newsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const createDefaultAdmin = require('./utils/createDefaultUsers');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tyrestorage', tyreStoreRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reviews', reviewRoutes)
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connectie
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Verbonden met MongoDB');
  await createDefaultAdmin();
  app.listen(5000, () => console.log('🚀 Server draait op poort 5000'));
}).catch(err => console.error('❌ MongoDB-fout:', err));

//require('./utils/notificationScheduler');
