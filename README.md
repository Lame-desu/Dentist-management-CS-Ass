# 🦷 DAMS — Dentist Appointments & Management System

A web-based platform for Ethiopian private dental clinics. DAMS streamlines appointment scheduling, dental records, prescriptions, queue management, and notifications across four user roles: **Patient**, **Dentist**, **Receptionist**, and **Admin**.

---

## 🧰 Prerequisites

You only need **two things** installed on your machine:

| Tool             | Version | Download                                    |
|------------------|---------|---------------------------------------------|
| **Docker**       | 20+     | [docker.com/get-docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.x+  | Included with Docker Desktop                |

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

That's it! Wait for the containers to finish starting, then open your browser.

---

## 🌐 Access URLs

| Service      | URL                          | Description               |
|--------------|------------------------------|---------------------------|
| **Frontend** | http://localhost:3000         | Next.js web application   |
| **Backend**  | http://localhost:5000         | Express.js REST API       |
| **Database** | `localhost:5432`             | PostgreSQL 16 (use any DB client) |

---

## ⚙️ Environment Variables

All configuration is defined in `.env.example`. Copy it to `.env` to override defaults:

| Variable               | Default                                            | Description                     |
|------------------------|----------------------------------------------------|---------------------------------|
| `POSTGRES_DB`          | `dams`                                             | Database name                   |
| `POSTGRES_USER`        | `dams_user`                                        | Database user                   |
| `POSTGRES_PASSWORD`    | `dams_password`                                    | Database password               |
| `DATABASE_URL`         | `postgresql://dams_user:dams_password@db:5432/dams`| Full connection string          |
| `JWT_SECRET`           | `dams-jwt-secret-change-in-production`             | JWT signing secret              |
| `NODE_ENV`             | `development`                                      | Node environment                |
| `PORT`                 | `5000`                                             | Backend server port             |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:5000/api`                        | Frontend → Backend API base URL |

> ⚠️ **Production:** Always change `POSTGRES_PASSWORD` and `JWT_SECRET` before deploying.

---

## 🏗️ Project Structure

```
Dentist-management/
├── docker-compose.yml      # Orchestrates all services
├── .env.example            # Environment variable template
├── .dockerignore           # Root Docker ignore rules
├── backend/
│   ├── Dockerfile          # Backend container definition
│   └── .dockerignore       # Backend Docker ignore rules
└── frontend/
    ├── Dockerfile          # Frontend container definition
    └── .dockerignore       # Frontend Docker ignore rules
```

---

## 🛑 Stopping the Application

```bash
# Stop all containers (preserves database data)
docker-compose down

# Stop and remove database volume (full reset)
docker-compose down -v
```

---

## 📦 Services Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   Database   │
│  (Next.js)   │     │  (Express)   │     │ (PostgreSQL) │
│  :3000       │     │  :5000       │     │  :5432       │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **Frontend** depends on **Backend**
- **Backend** depends on **Database** (waits for healthcheck)
- **Database** persists data via a named Docker volume

---

## 📝 License

This project is developed as part of an academic capstone / private clinic solution.
