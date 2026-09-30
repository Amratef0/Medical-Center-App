# 🏥 Medical Center App

A robust RESTful backend API for managing medical center operations, built with **NestJS**, **TypeORM**, and **PostgreSQL**. Handles authentication, patient/doctor management, and more — with full Swagger documentation.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| [NestJS](https://nestjs.com/) v11 | Backend framework |
| [TypeORM](https://typeorm.io/) v0.3 | ORM & database management |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Passport.js](https://www.passportjs.org/) + JWT | Authentication & authorization |
| [Swagger](https://swagger.io/) | API documentation |
| [class-validator](https://github.com/typestack/class-validator) | Request validation |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| TypeScript | Language |

---

## 📁 Project Structure

```
src/
├── app.module.ts        # Root module
├── main.ts              # Application entry point
├── database/
│   └── seed.ts          # Database seeding script
└── [feature modules]/   # Auth, Users, Doctors, Patients, etc.

test/                    # End-to-end tests
```

---

## ⚙️ Prerequisites

- **Node.js** >= 20 (see `.nvmrc`)
- **npm** >= 9
- **PostgreSQL** database running locally

The UI is a second repository, [Islam412/MCSOS-System](https://github.com/Islam412/MCSOS-System). Clone it as a sibling named `frontend/` next to this `backend/` folder. The parent folder layout and the port contract are in the workspace [README](../README.md). Product docs are in [docs/](../docs/README.md).

---

## 🛠️ Installation

```bash
git clone https://github.com/Amratef0/Medical-Center-App.git backend
cd backend
npm install
cp .env.example .env
```

The API listens on `PORT` from `.env`. The default is **3000**. The frontend `VITE_API_BASE_URL` must be `http://localhost:3000` unless you change both.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env`. The app reads:

| Variable | Purpose |
|---|---|
| `DB_HOST` | Postgres host. The seed accepts only `localhost`, `127.0.0.1`, `::1`, `postgres`, or `db` |
| `DB_PORT` | Postgres port |
| `DB_USERNAME` | Postgres user |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Database name |
| `PORT` | HTTP port. Default `3000` |
| `NODE_ENV` | `development` turns SQL logging on |
| `JWT_ACCESS_SECRET` | Access-token signing key |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime |
| `JWT_REFRESH_SECRET` | Refresh-token signing key |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime |

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

`synchronize` is off. The running schema comes from `src/migrations/`. The app applies pending files on boot.

An entity change does not merge without a migration beside it.

```bash
# After editing an entity, generate the SQL from the current database
npm run migration:generate -- src/migrations/DescribeTheChange

# Apply pending migrations
npm run migration:run

# Undo the last one
npm run migration:revert
```

`1790740512591-InitialSchema.ts` is the baseline. On a database that already has the tables, insert the row instead of running the file:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1790740512591, 'InitialSchema1790740512591');
```

Railway was not changed from this repo. There is no production connection string in `.env`. After a scratch copy of production matches this baseline, insert that row there and do not execute the file.

---

## 🌱 Database Seeding

Seed a local database only. The script exits if `DB_HOST` is not local, so it cannot be pointed at production.

```bash
npm run seed
```

Staff logins created by that script live in `src/database/seeds/user.seed.ts`. They are for the local database. Do not reuse them on a deployed server.

---

## 📖 API Documentation

Once the app is running, Swagger docs are available at:

```
http://localhost:3000/api
```

---

## 🧪 Running Tests

```bash
# Unit tests
npm run test

# Unit tests with watch mode
npm run test:watch

# Test coverage
npm run test:cov

# End-to-end tests against a throwaway Postgres (does not use the clinic database)
docker compose -f docker-compose.test.yml up -d --wait
npm run test:e2e
```

---

## 🔐 Authentication

This API uses **JWT (JSON Web Tokens)** with Passport.js strategies:

- `POST /auth/login` — Returns a JWT token
- Protected routes require the `Authorization: Bearer <token>` header

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
