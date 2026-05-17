# 🦷 DAMS — Dentist Appointments & Management System

A comprehensive web-based platform for Ethiopian private dental clinics. DAMS streamlines appointment scheduling, dental records, prescriptions, queue management, and notifications across four user roles: **Patient**, **Dentist**, **Receptionist**, and **Admin**.

---

## 🧰 Prerequisites

You only need **two things** installed on your machine:

| Tool               | Version | Download                                                      |
|--------------------|---------|---------------------------------------------------------------|
| **Docker**         | 20+     | [docker.com/get-docker](https://docs.docker.com/get-docker/)  |
| **Docker Compose** | 2.x+    | Included with Docker Desktop                                  |

> **No Node.js, npm, or PostgreSQL installation required.** Everything runs inside Docker containers.

---

## 🚀 Quick Start

```bash
# 1. Clone the repository (or extract the ZIP)
git clone <repo-url>
cd Dentist-management

# 2. (Optional) Copy and customise environment variables
cp .env.example .env

# 3. Build and start all services
docker-compose up --build
```

Wait for the startup messages:
- `🦷 DAMS Backend API Server` — Backend is ready
- `Ready` — Frontend is ready

Then open **http://localhost:3000** in your browser.

---

## 🔐 Demo Credentials

The system is pre-seeded with demo accounts for testing:

| Role            | Email                | Password       | Dashboard                                 |
|-----------------|----------------------|----------------|--------------------------------------------|
| **Admin**       | admin@dams.com       | admin123       | Staff management, reports, clinic config    |
| **Dentist**     | abebe@dams.com       | dentist123     | Schedule, appointments, consultations       |
| **Receptionist**| meron@dams.com       | reception123   | Pending requests, queue, walk-ins           |
| **Patient**     | dawit@dams.com       | patient123     | Book appointments, records, prescriptions   |S

> Additional accounts: `tigist@dams.com`, `solomon@dams.com` (dentists), `hana@dams.com` (receptionist), `sara@dams.com`, `yonas@dams.com`, `bethlehem@dams.com`, `kidus@dams.com` (patients) — all with their role-specific passwords above.

---

## 🌐 Access URLs

| Service      | URL                        | Description                 |
|--------------|----------------------------|-----------------------------|
| **Frontend** | http://localhost:3000       | Next.js web application     |
| **Backend**  | http://localhost:5000       | Express.js REST API         |
| **Health**   | http://localhost:5000/api/health | API health check        |
| **Database** | `localhost:5433`           | PostgreSQL 16 (via DB client)|

---

## 🏗️ Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│    Frontend       │──────│    Backend        │──────│    Database       │
│    (Next.js 14)   │      │    (Express.js)   │      │  (PostgreSQL 16)  │
│    Port: 3000     │      │    Port: 5000     │      │    Port: 5432     │
│                   │      │                   │      │                   │
│  • 4 Dashboards   │      │  • JWT Auth       │      │  • 11 Tables      │
│  • Tailwind CSS   │      │  • RBAC           │      │  • Migrations     │
│  • React 18       │      │  • 15+ Endpoints  │      │  • Seed Data      │
└──────────────────┘      └──────────────────┘      └──────────────────┘
         │                         │                         │
         └─────────────────────────┴─────────────────────────┘
                        Docker Compose Network
```

- **Frontend** depends on **Backend**
- **Backend** depends on **Database** (waits for healthcheck)
- **Database** persists data via a named Docker volume

---

## 📡 API Endpoints

| Group                | Base Path                | Methods                         | Auth Required |
|----------------------|--------------------------|----------------------------------|---------------|
| **Health**           | `/api/health`            | GET                              | No            |
| **Authentication**   | `/api/auth`              | POST login, register, profile    | Partial       |
| **Users**            | `/api/users`             | GET, POST, PATCH                 | Yes (Admin)   |
| **Dentists**         | `/api/dentists`          | GET                              | Yes           |
| **Appointments**     | `/api/appointments`      | GET, POST, PATCH                 | Yes (RBAC)    |
| **Availability**     | `/api/availability`      | GET, POST, PUT, DELETE           | Yes (RBAC)    |
| **Clinic Config**    | `/api/config`            | GET, PUT                         | Yes (Admin)   |
| **Dental Records**   | `/api/dental-records`    | GET, POST                        | Yes (RBAC)    |
| **Prescriptions**    | `/api/prescriptions`     | GET, POST                        | Yes (RBAC)    |
| **Notifications**    | `/api/notifications`     | GET, PATCH, DELETE               | Yes           |
| **Queue**            | `/api/queue`             | GET, POST, PATCH                 | Yes (RBAC)    |
| **Admin**            | `/api/admin`             | GET                              | Yes (Admin)   |

---

## 🗃️ Database Schema

| #  | Table                  | Description                              |
|----|------------------------|------------------------------------------|
| 1  | `users`                | All user accounts (all roles)            |
| 2  | `patients`             | Patient profile details                  |
| 3  | `dentists`             | Dentist profile, specialization, license |
| 4  | `dentist_availability` | Weekly schedule (day/time slots)         |
| 5  | `receptionists`        | Receptionist shift info                  |
| 6  | `appointments`         | Core appointment data & status lifecycle |
| 7  | `dental_records`       | Diagnosis, treatment, visit notes        |
| 8  | `prescriptions`        | Medicine, dosage, duration               |
| 9  | `notifications`        | In-app notification system               |
| 10 | `queue_entries`        | Daily patient queue management           |
| 11 | `clinic_configuration` | Key-value clinic settings                |

**Appointment Status Lifecycle:**
```
pending → reviewed → forwarded → approved → completed
                                           → rejected
                                           → cancelled
                                           → rescheduled
```

---

## 🛠️ Tech Stack

| Layer       | Technology       | Version | Purpose                                 |
|-------------|------------------|---------|-----------------------------------------|
| **Frontend**| Next.js          | 14.2    | React framework with SSR/SSG            |
|             | React            | 18.3    | UI library                              |
|             | Tailwind CSS     | 3.4     | Utility-first CSS                       |
|             | Axios            | 1.7     | HTTP client                             |
| **Backend** | Express.js       | 4.21    | Node.js web framework                   |
|             | TypeScript       | 5.6     | Type safety                             |
|             | pg (node-postgres)| 8.13   | PostgreSQL client                       |
|             | jsonwebtoken     | 9.0     | JWT authentication                      |
|             | bcryptjs         | 2.4     | Password hashing                        |
|             | express-validator| 7.2     | Request validation                      |
| **Database**| PostgreSQL       | 16      | Relational database                     |
| **DevOps**  | Docker           | 20+     | Containerization                        |
|             | Docker Compose   | 2.x     | Multi-container orchestration           |

---

## 📁 Project Structure

```
Dentist-management/
├── docker-compose.yml              # Orchestrates all 3 services
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
│
├── backend/
│   ├── Dockerfile                  # Backend container definition
│   ├── package.json                # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── src/
│       ├── index.ts                # Entry point (Express server)
│       ├── config/
│       │   ├── database.ts         # PostgreSQL pool & query helper
│       │   └── env.ts              # Environment variable loader
│       ├── database/
│       │   ├── migrate.ts          # Migration runner
│       │   ├── migrations/         # SQL migration files
│       │   └── seeds/
│       │       └── seed.ts         # Demo data seeder
│       ├── middleware/
│       │   ├── auth.ts             # JWT verification middleware
│       │   ├── errorHandler.ts     # Global error handler
│       │   └── validate.ts         # Express-validator runner
│       ├── controllers/            # Route handlers
│       ├── services/               # Business logic layer
│       ├── routes/                 # API route definitions
│       ├── types/                  # TypeScript type definitions
│       └── utils/                  # Shared constants & helpers
│
└── frontend/
    ├── Dockerfile                  # Frontend container definition
    ├── package.json                # Dependencies & scripts
    ├── next.config.js              # Next.js configuration
    ├── tailwind.config.ts          # Tailwind CSS design tokens
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout (fonts, providers)
        │   ├── page.tsx            # Landing page
        │   ├── loading.tsx         # Global loading component
        │   ├── not-found.tsx       # Custom 404 page
        │   ├── globals.css         # Design system & CSS variables
        │   ├── (auth)/             # Login & Register pages
        │   └── dashboard/
        │       ├── layout.tsx      # Dashboard shell (sidebar + header)
        │       ├── patient/        # Patient dashboard pages
        │       ├── receptionist/   # Receptionist dashboard pages
        │       ├── dentist/        # Dentist dashboard pages
        │       └── admin/          # Admin dashboard pages
        ├── components/
        │   ├── ui/                 # Reusable UI components
        │   └── shared/             # Shared layout components
        ├── context/                # React context (Auth)
        └── lib/                    # API client & utilities
```

---

## ⚙️ Environment Variables

| Variable                | Default                                              | Description                     |
|-------------------------|------------------------------------------------------|---------------------------------|
| `POSTGRES_DB`           | `dams`                                               | Database name                   |
| `POSTGRES_USER`         | `dams_user`                                          | Database user                   |
| `POSTGRES_PASSWORD`     | `dams_password`                                      | Database password               |
| `DATABASE_URL`          | `postgresql://dams_user:dams_password@db:5432/dams`  | Full connection string          |
| `JWT_SECRET`            | `dams-jwt-secret-change-in-production`               | JWT signing secret              |
| `JWT_EXPIRES_IN`        | `7d`                                                 | Token expiration                |
| `NODE_ENV`              | `development`                                        | Node environment                |
| `PORT`                  | `5000`                                               | Backend server port             |
| `SEED_DB`               | `true`                                               | Seed demo data on startup       |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:5000/api`                          | Frontend → Backend API base URL |

> ⚠️ **Production:** Always change `POSTGRES_PASSWORD`, `JWT_SECRET`, and set `SEED_DB=false`.

---

## 🧪 Appointment Workflow (Full End-to-End)

1. **Patient** books an appointment → Status: `pending`
2. **Receptionist** reviews and forwards to dentist → Status: `forwarded`
3. **Dentist** approves (or rejects) → Status: `approved`
4. **Patient** arrives → **Receptionist** adds to queue
5. **Receptionist** calls patient from queue → Status: `in_progress`
6. **Dentist** opens consultation workspace
7. **Dentist** creates dental record + prescriptions → Status: `completed`
8. **Patient** views dental records and prescriptions

---

## 🛑 Stopping the Application

```bash
# Stop all containers (preserves database data)
docker-compose down

# Stop and remove database volume (full reset)
docker-compose down -v
```

---

## 🔧 Troubleshooting

| Problem                                    | Solution                                                       |
|--------------------------------------------|----------------------------------------------------------------|
| Port 3000/5000 already in use              | Stop other processes: `lsof -ti:3000 \| xargs kill`           |
| Database connection refused                | Wait for DB healthcheck: `docker-compose logs db`              |
| Frontend can't reach backend               | Verify `NEXT_PUBLIC_API_URL` is `http://localhost:5000/api`    |
| Seed data not appearing                    | Check `SEED_DB=true` in docker-compose.yml                     |
| Changes not reflecting (hot reload)        | Ensure volumes are mounted: `./backend:/app`                   |
| "Module not found" errors                  | Rebuild: `docker-compose down && docker-compose up --build`    |
| Database needs full reset                  | `docker-compose down -v && docker-compose up --build`          |
| Container keeps restarting                  | Check logs: `docker-compose logs backend`                      |

---

## 📝 License

This project is developed as part of an academic BSc capstone / private clinic solution at Addis Ababa, Ethiopia.
