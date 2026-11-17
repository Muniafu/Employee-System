# Employee Management System (EMS)
​
A full-stack **Employee Management System** covering the complete employee lifecycle — hiring, onboarding, attendance, leave, payroll, performance, career growth, compliance, and offboarding — built with **React 19 + Vite** on the frontend and **Node.js + Express 5 + MongoDB** on the backend, with real-time notifications via **Socket.IO**.
​
Every module is protected by JWT authentication, a four-tier role hierarchy, ownership checks (IDOR protection), rate limiting, and hardened production configuration.
​
---
​
## Table of Contents
​
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Quick Start (Local Development)](#quick-start-local-development)
6. [Environment Variables](#environment-variables)
7. [Seeded Demo Accounts](#seeded-demo-accounts)
8. [Verifying the Installation](#verifying-the-installation)
9. [Roles & Permissions](#roles--permissions)
10. [Security Features](#security-features)
11. [Project Structure](#project-structure)
12. [API Overview](#api-overview)
13. [Email (SMTP) Setup](#email-smtp-setup)
14. [Social Login (OAuth) Setup — Optional](#social-login-oauth-setup--optional)
15. [Deployment](#deployment)
16. [Troubleshooting](#troubleshooting)
17. [License & Author](#license--author)
​
---
​
## Features
​
The system ships **15 functional modules**:
​
| Module | What it does |
|---|---|
| **Auth** | Email/password login, JWT sessions, self-registration with HR approval workflow, password reset via email, optional Google/Microsoft/Facebook/LinkedIn/GitHub OAuth |
| **Analytics** | Dashboard KPIs, headcount trends, turnover, department breakdowns, period-filtered charts (Recharts) |
| **Employee** | Employee directory with search/filter, rich profiles, self-service profile editing, HR/admin-only fields (salary, department, manager), account suspension/reactivation |
| **Attendance** | Clock-in/clock-out, daily status, attendance history, shift scheduling, admin views of all records |
| **Leave** | Leave requests (annual, sick, maternity, paternity, unpaid), approve/reject/cancel workflows, who-is-on-leave view |
| **Onboarding** | Structured onboarding checklists with phases (pre-boarding → first day → first week → first month), employee/HR/IT task assignment, progress tracking |
| **Offboarding** | Exit workflows: clearance checklists, asset return, knowledge transfer, access revocation, HR approval & termination, a **daily scheduler** that auto-revokes system access on the last working day |
| **Payroll** | Payroll engine (PAYE, NHIF, NSSF, housing levy — Kenya statutory), payslip generation with ownership checks, payroll periods with attendance locking, payroll settings, approvals, payments |
| **Performance** | Quarterly reviews, self-ratings, manager reviews with comments, goal tracking with completion status |
| **Career** | Career pathing with milestones, skills matrix, progress bars, succession-candidate flagging |
| **Learning** | Course catalog, enrollment, progress updates, mandatory/compliance training, certificates |
| **Compliance** | Policy publishing (mandatory/optional), digital-signature acknowledgment (logged & timestamped), compliance status tracking |
| **Engagement** | Pulse surveys, NPS scoring, anonymous responses, results dashboards |
| **Wellness** | Wellness programs (mental health, physical, financial, social, EAP), capacity-limited enrollment, completion feedback, EAP contact banner |
| **Notifications** | Real-time notifications pushed over Socket.IO, unread counts, notification history |
​
Plus an **Admin Panel** for user role management, department management, user approvals, and an audit log.
​
---
​
## Tech Stack
​
### Frontend (`client/`)
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/) | UI framework + build tool |
| [React Router 7](https://reactrouter.com/) | Client-side routing (SPA) |
| [Axios](https://axios-http.com/) | HTTP client with JWT interceptor (token in `localStorage` under `ems_token`) |
| [Socket.IO Client](https://socket.io/) | Real-time notifications |
| [Recharts](https://recharts.org/) | Analytics charts |
| [lucide-react](https://lucide.dev/) | Icon system (SVG — no emoji in the UI) |
| [React Toastify](https://fkhadra.github.io/react-toastify/) | Toast notifications |
| Custom CSS design system | Tokens in `styles/variables.css` — no CSS framework |
​
### Backend (`server/`)
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/) | REST API (CommonJS) |
| [MongoDB](https://www.mongodb.com/) + [Mongoose 8](https://mongoosejs.com/) | Database + ODM |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT auth tokens |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing (cost 12) |
| [Socket.IO](https://socket.io/) | Real-time push (JWT-verified handshakes) |
| [node-cron](https://github.com/node-cron/node-cron) | Offboarding access-revocation scheduler |
| [Nodemailer 10](https://nodemailer.com/) | Email (verification, password reset, notifications) |
| [Passport](http://www.passportjs.org/) | Optional OAuth (Google, Microsoft, Facebook, LinkedIn, GitHub) |
| [Helmet](https://helmetjs.github.io/) | Security headers |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | API rate limiting |
| [Winston](https://github.com/winstonjs/winston) + [Morgan](https://github.com/expressjs/morgan) | Logging |
| [dotenv](https://github.com/motdotla/dotenv) | Environment configuration |
​
---
​
## Architecture
​
```
┌──────────────────────────────┐         ┌──────────────────────────────────┐
│  React SPA (Vite dev :5173)  │  /api   │  Express 5 API (:5000)           │
│  client/src                  │ ──────► │  server/server.js                │
│                              │ proxy   │                                  │
│  axios → baseURL '/api'      │         │  authMiddleware (JWT)            │
│  socket.io-client ◄──────────┼─ WS ────┤  roleMiddleware (RBAC)           │
│                              │         │  rateLimiter (/api/*)            │
└──────────────────────────────┘         │  errorMiddleware                 │
                                         │        │                         │
              ┌──────────────────────────┼────────┼──────────────┐          │
              ▼                          ▼        ▼              ▼          │
        ┌──────────┐              ┌──────────┐  ┌─────────┐  ┌────────────┐  │
        │ MongoDB  │              │ Socket.IO│  │ node-   │  │ SMTP       │  │
        │ (16      │              │ (real-   │  │ cron    │  │ (Nodema-   │  │
        │ models)  │              │ time push)│ │ (jobs/) │  │ iler)      │  │
        └──────────┘              └──────────┘  └─────────┘  └────────────┘  │
                                         └──────────────────────────────────┘
```
​
**Development mode:** the Vite dev server proxies `/api` → `http://localhost:5000` (configured in `client/vite.config.js`), so the frontend and API are same-origin in the browser — no CORS setup needed locally.
​
**Production mode:** build the React app (`client/dist/`) and the Express server serves it as a single service with an HTML5-history fallback, so the API and SPA share one origin and one deployment.
​
---
​
## Prerequisites
​
| Tool | Version | Check with |
|---|---|---|
| Node.js | **v18 or later** (v20+ recommended) | `node -v` |
| npm | v9+ | `npm -v` |
| MongoDB | v6/v7 — local or [MongoDB Atlas](https://www.mongodb.com/atlas) | `mongod --version` |
| Git | any recent | `git --version` |
​
> **MongoDB local install:** on Ubuntu/Debian follow the [official MongoDB install guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/), then `sudo systemctl start mongod`. On macOS: `brew install mongodb-community` then `brew services start mongodb-community`.
​
---
​
## Quick Start (Local Development)
​
### 1. Clone the repository
​
```bash
git clone https://github.com/Muniafu/Employee-System.git
cd Employee-System
```
​
### 2. Install dependencies
​
```bash
# Backend
cd server
npm install
​
# Frontend
cd ../client
npm install
```
​
### 3. Configure the backend environment
​
Create a file `server/.env` (copy the template below):
​
```bash
cd ../server
cat > .env <<'EOF'
# ── APPLICATION ─────────────────────────────
NODE_ENV=development
PORT=5000
​
# ── DATABASE ────────────────────────────────
MONGO_URI=mongodb://127.0.0.1:27017/employee_system
​
# ── JWT ─────────────────────────────────────
# Generate a real secret below — never commit it:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=paste_a_long_random_generated_secret_here
JWT_EXPIRES_IN=7d
​
# ── SMTP (email sending) ────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
​
# ── OAuth (optional — leave blank to skip) ──
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
FB_CLIENT_ID=
FB_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
​
# ── URLS ────────────────────────────────────
CLIENT_URL=http://localhost:5173
API_URL=http://localhost:5000
EOF
```
​
>  **Generate a real `JWT_SECRET`** (48 random bytes) and paste it in. In `development` you'll get a warning if it's weak; in `production` the server **refuses to start** with a placeholder or short secret.
​
> No `.env` is needed in `client/` — the Vite dev proxy handles API routing, and in production the SPA is served by the same origin as the API.
​
### 4. Start MongoDB
​
```bash
# Linux (systemd)
sudo systemctl start mongod
​
# macOS (Homebrew)
brew services start mongodb-community
```
​
Or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and put the connection string in `MONGO_URI`.
​
### 5. Seed demo data (recommended)
​
```bash
cd server
node scripts/seed.js         # departments + users
node scripts/seedActivity.js # payroll, attendance, leave, notifications
```
​
You should see:
​
```
Departments seeded (6).
Created hr: hr1@example.com
Created manager: eng.manager@example.com
...
Seed complete.
All seeded accounts use password: Password123!
```
​
### 6. Run the system
​
**Terminal 1 — backend:**
​
```bash
cd server
npm run dev
```
​
Expected output:
​
```
info: MongoDB connected: mongodb://127.0.0.1:27017/employee_system
info: Offboarding access-revocation scheduler started.
info: EMS Server running on http://localhost:5000 [development]
info:  SMTP Server Ready
```
​
**Terminal 2 — frontend:**
​
```bash
cd client
npm run dev
```
​
Expected output:
​
```
VITE v7.x  ready in ~300 ms
➜  Local:   http://localhost:5173/
```
​
### 7. Open the app
​
Visit **http://localhost:5173** and log in with a seeded account (table below) or register a new account — the **first account ever registered on a fresh database automatically becomes the `admin`** (system bootstrap).
​
---
​
## Environment Variables
​
All backend configuration lives in `server/.env`:
​
| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `production` enables hardened checks (strong JWT, CORS allow-list, `trust proxy`, SPA serving) |
| `PORT` | no | `5000` | API port |
| `MONGO_URI` | **yes** | — | e.g. `mongodb://127.0.0.1:27017/employee_system` or an Atlas URI |
| `JWT_SECRET` | **yes** | — | Must be **32+ random chars in production** — the server throws on startup otherwise. Placeholder values only warn in dev |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime (`15m`, `12h`, `7d`…) |
| `SMTP_HOST` | no | — | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | no | `587` | SMTP port |
| `SMTP_USER` | no | — | SMTP username (Gmail: full address) |
| `SMTP_PASS` | no | — | SMTP password (Gmail: **App Password**, not your login password) |
| `CLIENT_URL` | **yes in prod** | `http://localhost:5173` | Allowed browser origin(s) for CORS **and** Socket.IO. Multiple origins: comma-separated, no spaces |
| `API_URL` | no | — | Public API base URL (used in OAuth callbacks / email links) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | — | Enables Google social login |
| `MS_CLIENT_ID` / `MS_CLIENT_SECRET` | no | — | Enables Microsoft social login |
| `FB_CLIENT_ID` / `FB_CLIENT_SECRET` | no | — | Enables Facebook social login |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | no | — | Enables LinkedIn social login |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | no | — | Enables GitHub social login |
​
Providers with missing credentials are **skipped automatically** at boot (you'll see `[passport] Skipping "google" — missing client ID/secret in .env`). That is normal, not an error.
​
---
​
## Seeded Demo Accounts
​
After running both seed scripts, log in with `Password123!`:
​
| Email | Role | Department | Position |
|---|---|---|---|
| `hr1@example.com` | **hr** | HR | HR Manager |
| `eng.manager@example.com` | **manager** | Engineering | Engineering Manager |
| `mkt.manager@example.com` | **manager** | Marketing | Marketing Manager |
| `brian.kiptoo@example.com` | employee | Engineering | Backend Developer |
| `faith.achieng@example.com` | employee | — | — |
| `peter.mwangi@example.com` | employee | — | — |
| `lucy.chebet@example.com` | employee | — | — |
| `pending.user@example.com` | employee | — | — *(status PENDING — cannot log in until approved; useful for testing the approval flow)* |
​
The activity seed also creates: payroll periods and payslips for 7 employees (net ≈ KES 39,910.65 each), 70 attendance records, an approved leave for Brian, a pending leave for Faith, and engagement/compliance/wellness activity.
​
> There is **no seeded `admin`** by design — register the first account yourself (any email) and it bootstraps to `admin`.
​
---
​
## Verifying the Installation
​
Run these from another terminal while the server is up:
​
```bash
# 1. Health check — expect {"success":true,...,"env":"development"}
curl http://localhost:5000/api/health
​
# 2. Login and capture a JWT
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"brian.kiptoo@example.com","password":"Password123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.token))")
​
echo $TOKEN   # should print eyJhbGci...
​
# 3. Employee sees their own payslip — expect 200 with payroll data
curl -s http://localhost:5000/api/payroll/me -H "Authorization: Bearer $TOKEN"
​
# 4. RBAC check — an employee is denied the employee directory: expect {"message":"Forbidden."}
curl -s http://localhost:5000/api/employees -H "Authorization: Bearer $TOKEN"
```
​
>  Pass the header as `Authorization: Bearer $TOKEN` — never paste the raw token into the shell after `$` (zsh will not expand `$eyJhbGci...` and you'll get `401 Invalid token`).
​
Then click through the UI as each seeded user to confirm each module renders and functions.
​
**Production dependency audit (no dev-chain advisories):**
​
```bash
cd server && npm audit --omit=dev   # expect: found 0 vulnerabilities
cd ../client                        # client advisories are dev-only (vite toolchain)
```
​
---
​
## Roles & Permissions
​
Roles form a strict hierarchy — `employee` < `manager` < `hr` < `admin`:
​
| Role | Level | Capabilities |
|---|---|---|
| `employee` | 1 | Own profile, own payslips (`/api/payroll/me`), own leave & attendance, clock in/out, self-reviews, enroll in learning & wellness, respond to surveys, acknowledge policies, view own notifications |
| `manager` | 2 | Everything above + team-scoped views, leave approval for reports, team attendance, initiate offboarding, complete assigned onboarding/offboarding tasks |
| `hr` | 3 | Everything above + full employee management, onboarding/offboarding initiation & approval, access revocation, payroll review/finalize, policy publishing, course creation, survey creation, compliance tracking |
| `admin` | 4 | Everything + user role changes, account approve/suspend/reactivate, payroll lifecycle (approve/lock/pay), employee deletion, Admin Panel, audit log |
​
Key rules enforced server-side:
​
- The **first registered account** bootstraps to `admin` with `protectedAccount`/`isSystem` flags (cannot be deleted or demoted).
- Middleware order on every protected route: `auth` (verify JWT + `isActive` + `status: APPROVED`) → `authorize('...roles')` → controller-level **ownership checks** (e.g. employees can only ever read their own payslip, even by guessing other IDs).
- `PENDING` or suspended accounts cannot authenticate, even with a valid token.
​
---
​
## Security Features
​
- **JWT authentication** — Bearer tokens, expiry enforced, secret strength validated at boot (hard failure in production).
- **RBAC middleware** — centralized `authorize(...roles)` on every route; a four-level role hierarchy; no phantom roles.
- **IDOR / ownership checks** — payroll reads validate the requesting user owns the record; employee profile mutations validate manager-of-record via the Employee reference (not the User id).
- **Password hashing** — bcryptjs, cost factor 12; passwords never leave the server in responses.
- **Account state machine** — registration → `PENDING` → HR/admin `APPROVED`; `isActive` suspension flag checked on every request.
- **Rate limiting** — `express-rate-limit` on all `/api/*` routes; `trust proxy` enabled in production so real client IPs are used behind Nginx/PaaS proxies.
- **CORS allow-list** — Express and Socket.IO both restrict origins to `CLIENT_URL` (comma-separated list supported). No `origin: '*'` in production.
- **Security headers** — Helmet, configured to allow cross-origin static resources.
- **Socket.IO authentication** — handshake requires a valid JWT (`socket.handshake.auth.token`); unauthenticated sockets are rejected before connection.
- **Mass-assignment safety** — role-based field restrictions (salary/department/manager changes are HR/admin only).
- **Audit logging** — admin actions recorded (audit log in Admin Panel).
- **Input validation & centralized error handling** — `errorMiddleware` returns consistent `{ success, message }` JSON; no stack traces leaked to clients.
- **Scheduled access revocation** — offboarded employees lose system access automatically on their last working day.
​
---
​
## Project Structure
​
```
Employee-System/
├── client/                          # React 19 + Vite frontend
│   ├── index.html
│   ├── vite.config.js               # dev proxy: /api → localhost:5000
│   └── src/
│       ├── main.jsx                 # entry: providers + styles + App
│       ├── App.jsx                  # routes + AppLayout (shell + sidebar)
│       ├── components/              # Modal, Table, Sidebar, Navbar, Admin panel
│       ├── context/                 # AuthProvider, ThemeProvider, NotificationContext
│       ├── pages/
│       │   ├── Analytics/  Attendance/  Auth/  Career/  Compliance/
│       │   ├── Employee/   Engagement/  Learning/  Leave/
│       │   ├── Notifications/  Onboarding/  Payroll/  Performance/  Wellness/
│       ├── services/                # one axios service per module + api.js + socket.js
│       └── styles/                  # variables.css (design tokens) + module CSS
│
└── server/                          # Express 5 + MongoDB backend (CommonJS)
    ├── server.js                    # app wiring: security → routes → SPA → errors
    ├── .env                         # secrets (never commit)
    ├── config/                      # env.js (validated), db, passport, mailer
    ├── constants/
    ├── controllers/                 # one controller per module
    ├── jobs/                        # offboardingScheduler (node-cron)
    ├── middleware/                  # authMiddleware, roleMiddleware, rateLimiter, errorMiddleware
    ├── models/                      # 16 Mongoose models
    ├── routes/                      # 18 route files mounted under /api/*
    ├── scripts/                     # seed.js, seedActivity.js
    ├── services/                    # payroll engine, social auth, email
    ├── socket/                      # socketManager (userId → socket ids)
    ├── uploads/                     # local file storage (served at /uploads)
    └── utils/                       # token, logger, responseHandler, roles helpers
```
​
---
​
## API Overview
​
Base URL: `http://localhost:5000/api` — all responses use `{ success: boolean, message?: string, data?: any }`.
​
| Route group | Purpose | Auth |
|---|---|---|
| `GET /health` | Liveness probe | public |
| `/auth` | register, login, me, password reset, OAuth callbacks | public/protected |
| `/admin` | users, roles, approvals, departments, audit log | admin |
| `/employees` | directory + profile CRUD | role-specific |
| `/onboarding` · `/offboarding` | checklists, tasks, access revocation, approval | role-specific |
| `/attendance` | clock in/out, today, history | protected |
| `/leaves` | apply, approve, reject, cancel, on-leave | protected |
| `/payroll` · `/payroll-periods` · `/payroll-settings` | payslips (`/me`), generation, periods, statutory settings | role-specific |
| `/compliance` · `/performance` · `/learning` · `/career` · `/engagement` · `/wellness` | module CRUD + workflows | protected |
| `/analytics` | dashboard, headcount, turnover | protected |
| `/notifications` | list, unread count (real-time via Socket.IO) | protected |
​
Explore every endpoint in the route files under `server/routes/` — each is annotated with its `authorize(...)` roles.
​
---
​
## Email (SMTP) Setup
​
Email powers verification, password reset, and notifications. With Gmail:
​
1. Enable **2-Step Verification** on the Google account → https://myaccount.google.com/security
2. Create an **App Password** → https://myaccount.google.com/apppasswords (select *Mail*, 16-character password)
3. Put it in `server/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=you@gmail.com
   SMTP_PASS=xxxxxxxxxxxxxxxx
   ```
4. Restart the server — ` SMTP Server Ready` confirms the connection.
​
Other providers: set `SMTP_HOST`/`SMTP_PORT` accordingly (e.g. Brevo `smtp-relay.brevo.com:587`, Mailgun `smtp.mailgun.org:587`).
​
---
​
## Social Login (OAuth) Setup — Optional
​
Each provider is enabled by filling in its `*_CLIENT_ID` + `*_CLIENT_SECRET`. For example, Google:
​
1. https://console.cloud.google.com/apis/credentials → *Create OAuth client ID* → *Web application*
2. Authorized redirect URI: `{API_URL}/api/auth/google/callback`
3. Copy the client ID/secret into `server/.env`, restart.
​
All five providers follow the same pattern (`/api/auth/{provider}` → `{provider}/callback`). Missing providers are skipped at boot with a log line — safe to configure later.
​
---
​
## Deployment
​
### Option A — Single service (recommended, works on Render / Railway / Fly.io / VPS)
​
The Express server can serve the built SPA, so you deploy **one service**:
​
1. **Set production environment variables:**
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/employee_system
   JWT_SECRET=<48+ random chars — generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://your-domain.com
   API_URL=https://your-domain.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASS=...
   ```
   The server **refuses to start** in production if `JWT_SECRET` is weak/placeholder or `CLIENT_URL` is missing — this protects you from deploying misconfigured.
​
2. **Build the frontend:**
   ```bash
   cd client && npm run build
   ```
​
3. **Start the server:** the boot sequence detects `client/dist/index.html` and automatically serves the SPA with client-side-routing fallback — the API still lives at `/api/*`. Anything that runs `node server.js` works:
   ```bash
   cd server && npm ci --omit=dev && npm start
   ```
​
4. **Verify:**
   ```bash
   curl https://your-domain.com/api/health
   open https://your-domain.com        # SPA loads; deep links like /dashboard work after refresh
   ```
​
### Option B — Split hosting (static frontend + API)
​
Host `client/dist/` on any static host (Netlify, Vercel, GitHub Pages + rewrite) and the API elsewhere. Add a catch-all redirect of `/*` → `/index.html` (SPA routing), and set `CLIENT_URL` on the server to the static site's origin.
​
### Behind a reverse proxy (Nginx example)
​
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
​
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;                        # WebSocket (Socket.IO)
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # rate limiting uses this
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
​
The server enables `trust proxy 1` in production so rate limiting and client IPs stay correct behind this.
​
### Production checklist
​
- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` (32+ chars, freshly generated — never reuse a dev secret)
- [ ] `MONGO_URI` points at a production DB with authentication (Atlas recommended)
- [ ] `CLIENT_URL` set to the real origin(s)
- [ ] `npm ci --omit=dev` in `server/` (and full install in `client/` to build)
- [ ] `cd client && npm run build` before starting the server
- [ ] MongoDB Atlas network access restricted to your server's IP / private network
- [ ] HTTPS enabled (PaaS automatic; Nginx via Let's Encrypt)
- [ ] SMTP uses an App Password or a transactional provider
- [ ] First registered account = your real admin; then approve staff accounts
​
---
​
## Troubleshooting
​
| Symptom | Cause | Fix |
|---|---|---|
| `EADDRINUSE :::5000` | Another process (or a global `PORT` env var) holds the port | `lsof -i :5000` and kill it, or set `PORT=5001` in `server/.env` |
| `DB connection failed` at boot | `mongod` not running or wrong `MONGO_URI` | Start MongoDB; test the URI with `mongosh "$MONGO_URI"` |
| `401 Invalid token` when calling the API manually | Raw token pasted after `$` in the shell, or employee ID used instead of the JWT | Use `Authorization: Bearer $TOKEN`; the Bearer value must be the JWT, not `EMP...` |
| `403 Forbidden.` on `/api/employees` as an employee | **Correct behavior** — RBAC is working | Log in as `hr1@example.com` or an admin |
| `[env] WARNING: JWT_SECRET is weak or a placeholder` | Dev-only warning for a weak secret | Generate a real secret; in production this becomes a hard startup error |
| Login returns `401` for a seeded user | Account is `PENDING` (e.g. `pending.user@example.com`) or DB was reseeded after the JWT was issued | Approve the account via the Admin Panel; re-login |
| CORS errors in the browser console | `CLIENT_URL` doesn't match the browser origin | Set `CLIENT_URL` to the exact origin (scheme + host + port); comma-separate multiples |
| Emails not sending | Gmail rejects regular login passwords | Use a Gmail **App Password** (see [Email setup](#email-smtp-setup)) |
| `[passport] Skipping "google"…` at boot | OAuth credentials not configured | Informational only — configure when needed |
| Vite build warns `Some chunks are larger than 500 kB` | Single-bundle build above Vite's advisory threshold | Cosmetic warning only; route-level code splitting (`React.lazy`) reduces it |
| Client shows "Network Error" or timeouts | Backend not running, or proxy target changed | Ensure the `server` runs on :5000 (matching `client/vite.config.js`) |
​
---
​
## License & Author
​
Released under the ISC license.
​
**Author:** [Muniafu](https://github.com/Muniafu) — [Employee-System](https://github.com/Muniafu/Employee-System)
​
Contributions welcome: fork → feature branch → PR. Before submitting, run:
​
```bash
cd client && npm run build && npm run lint   # must both pass
cd ../server && node --check server.js       # syntax check
```