const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');

const { Server } = require('socket.io');

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

const {
  setIO,
  onlineUsers,
} = require('./socket/socketManager');

const app = express();

const server =
  http.createServer(app);

/* ─────────────────────────────────────────────
   SOCKET.IO
───────────────────────────────────────────── */

const io = new Server(server, {
  cors: {
    origin: '*',
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
  onlineUsers.set(
    socket.userId.toString(),
    socket.id
  );

  logger.info(
    `🔌 User connected: ${socket.userId}`
  );

  socket.on('disconnect', () => {
    onlineUsers.delete(
      socket.userId.toString()
    );

    logger.info(
      `❌ User disconnected: ${socket.userId}`
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
    origin: 'http://localhost:5173',
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
   404
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
    logger.info(
      `✅ MongoDB connected: ${MONGO_URI}`
    );

    server.listen(PORT, () => {
      logger.info(
        `🚀 EMS Server running on http://localhost:${PORT} [${NODE_ENV}]`
      );
    });
  })
  .catch((err) => {
    logger.error(
      `❌ DB connection failed: ${err.message}`
    );

    process.exit(1);
  });

module.exports = {
  app,
  io,
};