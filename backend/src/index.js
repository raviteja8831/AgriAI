require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');
require('./models/associations');

const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farms');
const cropRoutes = require('./routes/crops');
const weatherRoutes = require('./routes/weather');
const calendarRoutes = require('./routes/calendar');
const imageRoutes = require('./routes/images');
const expenseRoutes = require('./routes/expenses');
const harvestRoutes = require('./routes/harvests');
const notificationRoutes = require('./routes/notifications');
const soilRoutes = require('./routes/soil');
const recommendationRoutes = require('./routes/recommendations');
const dashboardRoutes = require('./routes/dashboard');
const marketRoutes = require('./routes/market');
const updatesRoutes = require('./routes/updates');

const path = require('path');
const app = express();
const httpServer = createServer(app);

// Express auto-generates an ETag for every JSON response by default. Repeated
// GETs to the same endpoint (react-query refetches, polling, etc.) then get
// a bodyless 304 back — fine for a real browser's own cache, but the app's
// HTTP client doesn't reconstruct the body from that, so callers just see
// empty responses. These are dynamic/authenticated API responses, not static
// assets, so disable conditional caching entirely.
app.set('etag', false);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] },
});
app.set('io', io);

app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8081',  // Expo web dev server
    'http://localhost:19006', // Expo web (older)
    /^http:\/\/192\.168\.\d+\.\d+/,  // LAN devices
    /^http:\/\/10\.\d+\.\d+\.\d+/,
  ],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/harvests', harvestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/updates', updatesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(`user_${userId}`));
});

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
