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

- **Node.js** >= 18
- **npm** >= 9
- **PostgreSQL** database running locally or remotely

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/Amratef0/Medical-Center-App.git
cd Medical-Center-App

# Install dependencies
npm install
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env

```

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

## 🌱 Database Seeding

To seed the database with initial data:

```bash
npm run seed
```

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

# End-to-end tests
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
