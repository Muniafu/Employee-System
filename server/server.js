const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const { PORT, MONGO_URI } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const learningRoutes = require('./routes/learningRoutes');
const careerRoutes = require('./routes/careerRoutes');
const engagementRoutes = require('./routes/engagementRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const wellnessRoutes = require('./routes/wellnessRoutes');

const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin'}
}));
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wellness', wellnessRoutes);

// Protected route example
const auth = require('./middleware/authMiddleware');
const authorize = require('./middleware/roleMiddleware');
app.get ('/api/admin/test', auth, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Admin access granted' });
});

app.use(errorMiddleware);

mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});