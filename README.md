# 🏥 Medical Center App — Backend API

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-TypeORM-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20Passport-000000?logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/Docs-Swagger-85EA2D?logo=swagger&logoColor=black)

A robust RESTful backend API for managing medical center operations, built with **NestJS**, **TypeORM**, and **PostgreSQL**. It handles authentication, patient and doctor management, scheduling, finance, and more, with full Swagger documentation. The same API powers both the web dashboard and the Flutter mobile app.

---

## 📌 Table of Contents

- [Tech Stack](#-tech-stack)
- [Related Repositories](#-related-repositories)
- [Getting Started](#️-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#️-running-the-app)
- [Migrations](#️-migrations)
- [Database Seeding](#-database-seeding)
- [API Documentation](#-api-documentation)
- [Authentication](#-authentication)
- [Running Tests](#-running-tests)
- [Project Structure](#-project-structure)
- [Code Quality](#-code-quality)

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| [NestJS](https://nestjs.com/) v11 | Backend framework |
| [TypeORM](https://typeorm.io/) v0.3 | ORM & migrations |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Passport.js](https://www.passportjs.org/) + JWT | Authentication & authorization (access + refresh tokens) |
| [Swagger](https://swagger.io/) | API documentation |
| [class-validator](https://github.com/typestack/class-validator) | Request validation |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| TypeScript | Language |

---

## 🔗 Related Repositories

This repository is the API. The clients live in separate repositories:

| Client | Repository |
|---|---|
| Web dashboard (React) | [Islam412/MCSOS-System](https://github.com/Islam412/MCSOS-System) |
| Mobile app (Flutter) | [Amratef0/Medical_Center_MobileApp](https://github.com/Amratef0/Medical_Center_MobileApp) |

For local development, clone this repo as `backend/` and the web dashboard as a sibling `frontend/` folder:

```
workspace/
├── backend/     ← this repository
└── frontend/    ← web dashboard
```

The API listens on `PORT` from `.env` (default **3000**). The frontend's `VITE_API_BASE_URL` must be `http://localhost:3000` unless you change both.

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** >= 20 (see `.nvmrc`)
- **npm** >= 9
- **PostgreSQL** running locally

### Installation

```bash
git clone https://github.com/Amratef0/Medical-Center-App.git backend
cd backend
npm install
cp .env.example .env     # then fill in your values
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env`. The app reads:

| Variable | Purpose |
|---|---|
| `DB_HOST` | Postgres host. The seed script accepts only `localhost`, `127.0.0.1`, `::1`, `postgres`, or `db` |
| `DB_PORT` | Postgres port |
| `DB_USERNAME` | Postgres user |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Database name |
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` turns SQL logging on |
| `JWT_ACCESS_SECRET` | Access-token signing key |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime |
| `JWT_REFRESH_SECRET` | Refresh-token signing key |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime |

> Use long random values for the JWT secrets and never commit your `.env` file.

---

## ▶️ Running the App

```bash
# Development (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

---

## 🗄️ Migrations

`synchronize` is **off**. The schema comes from the files in `src/migrations/`, and the app applies pending migrations on boot. An entity change is not merged without a migration beside it.

```bash
# After editing an entity, generate the SQL from the current database
npm run migration:generate -- src/migrations/DescribeTheChange

# Apply pending migrations
npm run migration:run

# Undo the last one
npm run migration:revert
```

**Databases that already have the tables.** `1790740512591-InitialSchema.ts` is the baseline migration. On a database that already contains the schema, do not run the file. Insert its row instead, so TypeORM treats it as applied:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1790740512591, 'InitialSchema1790740512591');
```

For a shared or production database, first verify on a scratch copy that it matches the baseline, then insert the row there as well.

---

## 🌱 Database Seeding

Seed a **local** database only. The script exits if `DB_HOST` is not a local host, so it cannot be pointed at production by mistake.

```bash
npm run seed
```

The staff logins created by the script are defined in `src/database/seeds/user.seed.ts`. They are meant for local development; never reuse them on a deployed server.

---

## 📖 API Documentation

Once the app is running, the Swagger docs are available at:

```
http://localhost:3000/api
```

---

## 🔐 Authentication

The API uses **JWT** with Passport.js strategies:

- `POST /auth/login` — returns the access and refresh tokens
- Protected routes require the header: `Authorization: Bearer <token>`

---

## 🧪 Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Coverage
npm run test:cov

# End-to-end tests against a throwaway Postgres (does not touch your local database)
docker compose -f docker-compose.test.yml up -d --wait
npm run test:e2e
```

---

## 📁 Project Structure

```
src/
├── app.module.ts            # Root module
├── main.ts                  # Application entry point
├── database/
│   ├── seed.ts              # Database seeding script
│   └── seeds/               # Seed data (e.g. user.seed.ts)
├── migrations/              # TypeORM migrations
└── [feature modules]/       # Auth, Users, Doctors, Patients, ...

test/                        # End-to-end tests
```

---

## 🧹 Code Quality

```bash
# Lint and auto-fix
npm run lint

# Format code
npm run format
```

---

## 📜 License

This project is **UNLICENSED** — for private/educational use.

---

## 👤 Author

**Amr Atef** — [@Amratef0](https://github.com/Amratef0)
