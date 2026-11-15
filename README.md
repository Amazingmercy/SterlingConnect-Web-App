# Sterling Connect

> **Empowering Talent, Accelerating Careers, and Expanding Educational Horizons.**  
> Sterling Connect is an enterprise-grade platform connecting ambitious African candidates to global scholarships, graduate employment, targeted capability-building programs, and personalized career readiness diagnostics.

---

## Platform Highlights

### 1. Dual-Pathway Tailoring
* **Employment & Career Opportunities**: Corporate graduate schemes, management trainee tracks, entry-to-mid level commercial roles, and professional internships.
* **Education & Scholarship Opportunities**: Fully funded master’s degree awards, doctoral research fellowships, and international academic grants.
* **Flexible Switching**: Candidates can seamlessly switch their active focus pathway while preserving their diagnostic scores, application history, and bookmarks.

### 2. Universal 10-Category Readiness Diagnostic
* **Comprehensive 50-Question Diagnostic**: Evaluates 10 core Academy domains:
  1. Career Development & Employability
  2. Scholarships & Educational Advancement
  3. Leadership & People Management
  4. Project & Programme Management
  5. Research, Data & Evidence
  6. Monitoring, Evaluation & Learning (MEL)
  7. Communication & Professional Effectiveness
  8. Entrepreneurship & Business Development
  9. Digital Skills, AI & Productivity
  10. Organizational Development & Strategy
* **Automated Scoring & 3-Tier Tie-Breaking**: Normalized 0–100% calculation with deterministic ranking to isolate top development priorities.
* **Dynamic Readiness Bands**: Four calibrated progression tiers (*Initial Preparation*, *Developing Competence*, *Established Readiness*, and *Advanced Standing*).
* **Targeted Action Plans**: Automatically maps candidates' 3 lowest readiness domains to official Sterling Academy curriculum and courses.

### 3. Transparent Opportunity Matching Engine
* **Rule-Based Compatibility Ranking**: Evaluates candidates against strict opportunity criteria including highest qualification, academic classification, country of residence, nationality, and field of study.
* **Explainable Matching Criteria**: Displays exact eligibility factors (e.g. *"First Class Honours required"*, *"Eligible for Nigerian citizens"*).
* **Saved & Closing Soon Alerts**: Contextual notifications remind candidates of upcoming closing dates.

### 4. Application Lifecycle Pipeline (Kanban)
* **Status Progression**: Stage-by-stage tracking across `Saved`, `Preparing`, `Applied`, `Interview`, and `Outcome`.
* **Centralized Document Vault**: Encrypted candidate resume, CV, and academic transcript storage with instant verification.

### 5. Enterprise Operations & Admin Console (`/admin`)
* **Platform Analytics (A01–A02)**: Real-time candidate registrations, assessment completion funnel, active pathway split, and opportunity pipeline health.
* **Opportunity Management (A03–A04)**: Complete authoring, preview, editing, publishing, and archiving workflows.
* **Bulk Importer (A05)**: Ingest opportunities via CSV/JSON with live schema validation, duplicate detection, and import previews.
* **Readiness Version Studio (A07–A08)**: Administer assessment questions, category distributions, diagnostic versions, and live activation.
* **Configurable Rules Engine (A09)**: Weight adjustment sliders with interactive simulator test harness.
* **Taxonomy Management (A10)**: Manage controlled sectors, job functions, study fields, aliases, and code identifiers.
* **Email Template Studio & Delivery Logs (A11–A12)**: Author transactional templates with variables, view delivery status logs, and search audits.
* **Staff Access Control (A13–A14)**: Role-based permissions (`ADMIN`, `SUPER_ADMIN`) and account lifecycle governance.
* **System Settings & Audit Trail (A15–A16)**: Centralized operational parameters (canonical URLs, cron cadences, token TTLs) and comprehensive compliance audit logging.

### 6. Modern Mobile-First UX
* Fully responsive navigation drawer with touch-friendly 44px targets.
* Sticky mobile sub-navigation and bottom action bars for high-conversion application flows.
* Zero external emojis; strictly standard Lucide SVG icons and brand typography.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, KaTeX (LaTeX math), React Router DOM v6 |
| **Backend** | NestJS, TypeScript, Prisma ORM, Passport JWT, Bcrypt, Class-Validator, Node Mailer |
| **Database** | MySQL / TiDB Cloud Serverless (distributed, scalable SQL) |
| **Email Service** | Google Workspace SMTP / Transactional Mailer |
| **Security** | Strict JWT Access & Refresh Token rotation, HTTP-only Cookie support, Role-based guards, masked environment secrets |

---

## 📁 Repository Structure

```
SterlingConnect/
├── backend/                        # NestJS Backend API
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (Users, Opportunities, Readiness, Audit)
│   │   └── migrations/             # Database migration history
│   ├── src/
│   │   ├── common/                 # Guards, decorators, filters, interceptors
│   │   ├── config/                 # Environment validation
│   │   ├── modules/
│   │   │   ├── admin/              # Admin console operations & system settings
│   │   │   ├── applications/       # Application lifecycle tracking
│   │   │   ├── auth/               # Authentication, registration, email verify, password reset
│   │   │   ├── mail/               # Transactional email dispatcher
│   │   │   ├── matching/           # Opportunity matching & rules engine
│   │   │   ├── notifications/      # In-app notifications & alerts
│   │   │   ├── opportunities/      # Opportunities catalog & management
│   │   │   ├── readiness/          # Universal 10-Category readiness diagnostic
│   │   │   ├── recommendations/    # Academy course mapping & recommendations
│   │   │   ├── taxonomies/         # Controlled taxonomies & aliases
│   │   │   └── users/              # Candidate profile, documents, and preferences
│   │   ├── main.ts                 # NestJS application bootstrap
│   │   └── app.module.ts           # Root module
│   ├── .env.example                # Backend environment variable template
│   └── package.json
│
├── frontend/                       # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI primitives (Button, Card, Input, Modal, etc.)
│   │   ├── context/                # Auth, Profile, Opportunity, and Notification contexts
│   │   ├── features/               # Feature-sliced pages & workflows
│   │   │   ├── admin/              # Admin portal screens (A01–A16)
│   │   │   ├── applications/       # Candidate pipeline tracking
│   │   │   ├── assessment/         # Diagnostic questions, results, action plan
│   │   │   ├── auth/               # Sign in, Sign up, Verify email, Reset password
│   │   │   ├── dashboard/          # User dashboard, overview, candidate settings
│   │   │   ├── landing/            # Public home & information pages
│   │   │   ├── notifications/      # Notifications centre (U24)
│   │   │   ├── opportunities/      # Catalog, filters, and detail views
│   │   │   ├── profile/            # Profile builder (Common, Employment, Scholarship)
│   │   │   └── recommendations/    # Recommended Academy learning
│   │   ├── layouts/                # AppLayout, Navbar, SideNav, Footer
│   │   └── services/               # Axios API client & interceptors
│   ├── .env.example                # Frontend environment variable template
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore                      # Comprehensive Git exclusion rules
└── README.md                       # Project documentation
```

---

## Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **Database**: MySQL 8.0+ 

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your database and security settings:
   ```env
   # Database connection
   DATABASE_URL="mysql://username:password@localhost:3306/sterling_connect"

   # Application Port
   PORT=4000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:5173"

   # JWT Security Secrets
   JWT_ACCESS_SECRET="your_secure_access_secret_key"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_SECRET="your_secure_refresh_secret_key"
   JWT_REFRESH_EXPIRES_IN="7d"
   COOKIE_SECRET="your_secure_cookie_secret_key"

   # File Uploads
   UPLOAD_DESTINATION="./src/uploads"
   MAX_FILE_SIZE_BYTES=5242880

   # Email Service (Google Workspace / SMTP)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER="notifications@sterlinglrs.com"
   SMTP_APP_PASSWORD="your-google-workspace-app-password"
   SMTP_FROM_NAME="Sterling Connect"
   SMTP_FROM_EMAIL="notifications@sterlinglrs.com"

   # Sterling Academy URL
   STERLING_ACADEMY_BASE_URL="https://learn.sterlinglrs.com"
   ```

4. **Initialize database schema & run migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Start backend development server**:
   ```bash
   npm run start:dev
   ```
   *The backend will boot up on `http://localhost:4000` (API routes prefixed at `/api`).*

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_API_URL="http://localhost:4000/api"
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   *The client interface will be available at `http://localhost:5173`.*

---

##  Build & Verification Commands

### Compile & Test Backend
```bash
cd backend
npm run build
```

### Compile & Validate Frontend
```bash
cd frontend
npm run build
```

Both build commands run full TypeScript type checks (`tsc`) and produce optimized production distributions.

---

## 🔒 Security & Best Practices

* **Sensitive Data Protection**: `.env` files, production credentials, and user-uploaded documents are strictly excluded from version control via `.gitignore`.
* **Zero Score Disclosure in Email**: Diagnostic outcome emails never broadcast raw candidate numerical scores in message subjects, aligning with candidate privacy standards.
* **Audit Trail**: Administrative actions (modifying system settings, updating assessment versions, altering rules, user status changes) are recorded to the immutable `AuditLog` table with timestamp and IP address.

---

## 📄 License
Proprietary & Confidential. Copyright © Sterling Solutions. All rights reserved.
