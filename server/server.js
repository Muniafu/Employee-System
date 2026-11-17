const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const fs = require('fs');

const { Server } = require('socket.io');
const passport = require('./config/passport');

const {
  PORT,
  MONGO_URI,
  NODE_ENV,
} = require('./config/env');

const logger = require('./utils/logger');

const {
  apiLimiter,
} = require('./middleware/rateLimiter');

const errorMiddleware =
  require('./middleware/errorMiddleware');

const {
  authorize,
} = require('./middleware/roleMiddleware');

const auth =
  require('./middleware/authMiddleware');

const {
  verifyToken,
} = require('./utils/token');


const offboardingScheduler =
  require('./jobs/offboardingScheduler');

const {
  setIO,
  addUserSocket,
  removeUserSocket,
} = require('./socket/socketManager');

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

const corsOrigins = CLIENT_URL.split(',').map((o) => o.trim());

const app = express();

/* Behind a reverse proxy (Render/Heroku/Nginx) in production, trust the
   first proxy hop so express-rate-limit sees real client IPs. */
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const server =
  http.createServer(app);

/* ─────────────────────────────────────────────
   SOCKET.IO
───────────────────────────────────────────── */

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

setIO(io);

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth.token;

    if (!token) {
      return next(
        new Error('Unauthorized')
      );
    }

    const decoded =
      verifyToken(token);

    socket.userId = decoded.id;

    next();
  } catch (err) {
    next(
      new Error('Unauthorized')
    );
  }
});

io.on('connection', (socket) => {
  addUserSocket(
    socket.userId.toString(),
    socket.id 
  );

  logger.info(
    `User connected: ${socket.userId}`
  );

  socket.on('disconnect', () => {
    removeUserSocket(
      socket.userId.toString(),
      socket.id
    );

    logger.info(
      `User disconnected: ${socket.userId}`
    );
  });
});

/* ─────────────────────────────────────────────
   SECURITY + PARSING
───────────────────────────────────────────── */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(
  morgan(
    NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(passport.initialize());

app.use('/api/', apiLimiter);

/* ─────────────────────────────────────────────
   STATIC FILES
───────────────────────────────────────────── */

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

/* ─────────────────────────────────────────────
   HEALTH CHECK
───────────────────────────────────────────── */

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'EMS API is running.',
    version: '2.0.0',
    timestamp: new Date(),
    env: NODE_ENV,
  });
});

/* ─────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────── */

app.use(
  '/api/auth',
  require('./routes/authRoutes')
);

app.use(
  '/api/admin',
  require('./routes/adminRoutes')
);

app.use(
  '/api/employees',
  require('./routes/employeeRoutes')
);

app.use(
  '/api/onboarding',
  require('./routes/onboardingRoutes')
);

app.use(
  '/api/offboarding',
  require('./routes/offboardingRoutes')
);

app.use(
  '/api/attendance',
  require('./routes/attendanceRoutes')
);

app.use(
  '/api/leaves',
  require('./routes/leaveRoutes')
);

app.use(
  '/api/payroll',
  require('./routes/payrollRoutes')
);

app.use(
  '/api/payroll-periods',
  require('./routes/payrollPeriodRoutes')
);

app.use(
  '/api/payroll-settings',
  require('./routes/payrollSettingsRoutes')
);

app.use(
  '/api/compliance',
  require('./routes/complianceRoutes')
);

app.use(
  '/api/performance',
  require('./routes/performanceRoutes')
);

app.use(
  '/api/learning',
  require('./routes/learningRoutes')
);

app.use(
  '/api/career',
  require('./routes/careerRoutes')
);

app.use(
  '/api/engagement',
  require('./routes/engagementRoutes')
);

app.use(
  '/api/analytics',
  require('./routes/analyticsRoutes')
);

app.use(
  '/api/wellness',
  require('./routes/wellnessRoutes')
);

app.use(
  '/api/notifications',
  require('./routes/notificationRoutes')
);

/* ─────────────────────────────────────────────
   ADMIN TEST
───────────────────────────────────────────── */

app.get(
  '/api/admin/test',
  auth,
  authorize(
    'admin',
    'superuser'
  ),
  (req, res) => {
    res.json({
      success: true,
      message:
        'Admin access granted',
      user: req.user.email,
    });
  }
);

/* ─────────────────────────────────────────────
   PRODUCTION SPA SERVING (optional)
   If the client production build exists, serve it
   with an SPA fallback so one deployment works.
   Must be registered BEFORE the 404 catch-all.
───────────────────────────────────────────── */

const clientDist = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

/* ─────────────────────────────────────────────
   404 (API only — SPA routes are handled above)
───────────────────────────────────────────── */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

/* ─────────────────────────────────────────────
   ERROR HANDLER
───────────────────────────────────────────── */

app.use(errorMiddleware);

/* ─────────────────────────────────────────────
   DATABASE + SERVER
───────────────────────────────────────────── */

mongoose
  .connect(MONGO_URI)
  .then(() => {
        logger.info(`MongoDB connected: ${MONGO_URI}`);

    offboardingScheduler.start();

    server.listen(PORT, () => {
      logger.info(`EMS Server running on http://localhost:${PORT} [${NODE_ENV}]`);
    });
  })
  .catch((err) => {
    logger.error(`DB connection failed: ${err.message}`);
    process.exit(1);
  });

module.exports = {
  app,
  io,
};