# 🏢 Unified HR Employee Management System v2

Full-stack MERN HR platform with transactional + transformational features.

---

## ⚡ Quick Start (5 steps)

### 1. Prerequisites
```bash
node --version   # v18+
mongod --version # v6+
```

### 2. Install dependencies
```bash
cd server
npm install
```

### 3. Configure environment
```bash
cp .env.example .env   # already provided as .env
# Edit MONGO_URI, JWT_SECRET as needed
```

### 4. Seed the database
```bash
npm run seed
```
This creates departments, 7 test users, attendance records, payroll entries, leave data, learning courses, wellness programs, compliance policies, onboarding tasks, and notifications.

**Test accounts created:**
| Role       | Email                   | Password    |
|------------|-------------------------|-------------|
| Superuser  | admin@example.com       | password123 |
| Admin      | admin@example.com       | password123 |
| HR         | admin@example.com       | password123 |
| Manager    | admin@example.com       | password123 |
| Employee 1 | john@example.com        | password123 |
| Employee 2 | john@example.com        | password123 |

### 5. Start the server
```bash
npm run dev
# Server running on http://localhost:5000
```

---

## 📮 Postman Setup

1. Open Postman
2. **Import** → `EMS_Postman_Collection.json`
3. **Import** → `EMS_Environment.json`
4. Select environment **EMS Local** (top-right dropdown)
5. Run folders **in order** — Auth Flow sets tokens automatically via test scripts

### Run Collection (E2E)
Use **Collection Runner** → select all folders → Run. All tests have assertions.

---

## 🏗️ API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require:
```
Authorization: Bearer <token>
```

### Roles & Permissions
| Endpoint Group    | employee | manager | hr | admin | superuser |
|-------------------|----------|---------|-----|-------|-----------|
| /auth             | ✅       | ✅      | ✅ | ✅    | ✅        |
| /employees (view) | own only | ✅      | ✅ | ✅    | ✅        |
| /employees (add)  | ❌       | ❌      | ✅ | ✅    | ✅        |
| /attendance       | own      | ✅      | ✅ | ✅    | ✅        |
| /leave (apply)    | ✅       | ✅      | ✅ | ✅    | ✅        |
| /leave (approve)  | ❌       | ✅      | ✅ | ✅    | ✅        |
| /payroll/me       | ✅       | ✅      | ✅ | ✅    | ✅        |
| /payroll/finalize | ❌       | ❌      | ✅ | ✅    | ✅        |
| /analytics        | ❌       | ❌      | ✅ | ✅    | ✅        |
| /admin            | ❌       | ❌      | ✅ | ✅    | ✅        |

---

## 📁 Server Structure

```
server/
├── config/
│   └── env.js                   # Centralised env config
├── controllers/                  # Business logic (15 controllers)
│   ├── adminController.js
│   ├── analyticsController.js
│   ├── attendanceController.js   # Clock-in/out rules enforced
│   ├── authController.js
│   ├── careerController.js
│   ├── complianceController.js
│   ├── employeeController.js
│   ├── engagementController.js
│   ├── learningController.js
│   ├── leaveController.js        # Overlap + balance checks
│   ├── notificationController.js
│   ├── onboardingController.js
│   ├── payrollController.js      # Immutable after finalize
│   ├── performanceController.js
│   └── wellnessController.js
├── middleware/
│   ├── authMiddleware.js          # JWT verify + isActive check
│   ├── errorMiddleware.js         # Global error handler
│   ├── rateLimiter.js
│   └── roleMiddleware.js          # RBAC (authorize, authorizeMin)
├── models/                        # 16 Mongoose models
├── routes/                        # 15 route files
├── utils/
│   ├── analyticsHelper.js         # Real DB aggregation helpers
│   ├── emailService.js            # Graceful SMTP failure
│   ├── logger.js                  # Winston logger
│   ├── notificationService.js
│   ├── payrollHelper.js           # Kenya KRA tax engine
│   ├── roles.js                   # Role hierarchy constants
│   └── token.js
└── server.js
```

---

## 🐛 Bug Prevention — Enforced Rules

| Scenario                          | HTTP Response | Error Message                                      |
|-----------------------------------|---------------|----------------------------------------------------|
| Double clock-in                   | 409           | Already clocked in today                          |
| Clock-out before clock-in         | 400           | Cannot clock out without clocking in first        |
| Finalize payroll twice            | 409           | Payroll already finalized for [period]            |
| Leave end < start                 | 400           | End date cannot be before start date              |
| Overlapping leave                 | 409           | Overlapping leave already exists                  |
| Insufficient leave balance        | 400           | Insufficient leave balance. Available: X days     |
| Approve non-pending leave         | 400           | Cannot approve a [status] leave                   |
| Employee accessing admin route    | 403           | Access denied. Requires: admin \| superuser       |
| Invalid / expired token           | 401           | Invalid token / Token expired                     |
| Invalid ObjectId                  | 400           | CastError handled by errorMiddleware              |

---

## 🔐 Security Features

- **JWT** — signed tokens with expiry, password-change invalidation
- **bcrypt** — passwords hashed with salt rounds 12
- **Helmet** — security headers
- **CORS** — configurable origin
- **Rate limiting** — auth (20/15min), API (200/min)
- **RBAC** — role-based middleware on every sensitive route
- **Input validation** — express-validator on auth routes

---

## 🇰🇪 Kenya Payroll Engine

Deductions computed automatically per KRA 2024 rates:
- **PAYE** — progressive bands (10%, 25%, 30%, 32.5%, 35%) minus KES 2,400 personal relief
- **NHIF** — tiered by gross pay (KES 150–1,700)
- **NSSF** — 6% of pensionable pay (Tier I + II, New Act 2022)
- **Overtime** — 1.5× hourly rate beyond 8hrs/day

---

## 📧 Email — Graceful Failure

Emails are suppressed in `development` mode (logged only). In `production`, SMTP failures are caught and logged — they never break an API request. Templates available for: leave approved/rejected, payslip ready, welcome.