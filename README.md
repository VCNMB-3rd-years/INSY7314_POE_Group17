# 🏦 International Payments Portal

A secure full-stack CRUD system for managing international payments with customer and employee portals.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![License](https://img.shields.io/badge/license-ISC-blue)

---
## 🔖 Security Measures Implemented from Task 1

| Threat | Protection | Details |
|--------|------------|---------|
| **Clickjacking** | `X-Frame-Options` header, Content Security Policy (CSP) | Headers set via `helmet()` prevent embedding in other sites. CSP restricts sources of content. |
| **Session hijacking/jacking** | Session regeneration, session timeouts, HTTPS-only cookies | - `regenerateSession(req)` on login prevents session fixation <br> - `req.session` includes `createdAt` and `lastActivity` <br> - Cookies configured to `secure` for HTTPS |
| **SQL Injection / NoSQL Injection** | Input validation, sanitization | - `express-validator` checks account numbers, emails, ID numbers, passwords <br> - `express-mongo-sanitize` removes `$` and `.` from inputs before MongoDB queries |
| **Cross-site scripting (XSS)** | Input sanitization, output encoding, CSP | - Inputs validated via `express-validator` <br> - Output encoding assumed when sending data <br> - CSP headers restrict scripts and resources |
| **Man-in-the-middle (MITM)** | HTTPS, strong passwords, software updates | - Server runs on HTTPS (`https://localhost:5000`) <br> - Passwords must meet complexity rules (uppercase, lowercase, number, special char) <br> - Node.js and dependencies kept up to date |
| **Distributed Denial of Service (DDoS)** | Rate limiting, potential WAF | - `express-rate-limit` limits login attempts (`max: 5`) and registrations (`max: 10`) <br> - Optional Redis-backed rate limiter can scale for production <br> - WAF could be added at infrastructure level |

---
## Team Members & Responsibilities

| Name | Student Number | Assigned Tasks |
|------|----------------|----------------|
| Samkelo Maswana | ST10141464 | Session Implementation, API Connectivity and Database |
| Tiffany-Amber Jacobs | ST10085839 | Front-End Design and Functionality, API Creation|
| Joshua Sutherland | ST10255930 | Pipeline Implementation + Security Integration for SQL Injeciton, XSS, Man-In-The-Middle & DDoS |

---

## 🚀 Features

### Customer Portal
- ✅ User registration with encrypted data
- 🔐 Secure login with JWT authentication
- 💸 Make international payments
- 📊 View payment history
- ✏️ Edit/delete pending payments

### Employee Portal
- 👥 Employee authentication
- 📋 View all customer transactions
- ✅ Verify/approve payments
- 🔍 Search and filter transactions
- 📈 View payment statistics

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Axios
- React Router DOM

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- express-validator for input validation

**Security:**
- Helmet.js for security headers
- Rate limiting
- CORS protection
- Field-level encryption
- Password hashing

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Git

# Quick Setup & Useful Commands

## Quick Setup Script (PowerShell)
Run these commands in PowerShell to set up the project:

```powershell
# Install concurrently for running multiple npm scripts
npm install concurrently --save-dev

# ------------------------
# Server Setup
# ------------------------
cd server
npm install express cors helmet express-session express-mongo-sanitize mongoose mongodb connect-mongo bcryptjs express-rate-limit express-validator dotenv jsonwebtoken
npm install nodemon --save-dev

# ------------------------
# Client Setup
# ------------------------
cd ../client
npm install react react-dom react-router-dom axios react-icons
npm install vite @vitejs/plugin-react @types/react @types/react-dom --save-dev

# ------------------------
# Clean & Reinstall Server Dependencies
# ------------------------
cd ../server
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
Rename-Item router routes
npm install
npm install xss-clean
npm install rate-limit-redis ioredis
npm i express-slow-down

# ------------------------
# Start Development
# ------------------------
cd ..
npm run dev
```

## Useful Commands

### Development
```bash
npm run dev         # Start both server and client
npm run server      # Start only server
npm run client      # Start only client
```

### Installation Shortcuts (if defined in package.json)
```bash
npm run install-all        # Install both server and client
npm run install-server     # Install server only
npm run install-client     # Install client only
```

### Troubleshooting
```bash
net start MongoDB          # Start MongoDB service
npx kill-port 5000         # Kill process on port 5000
npm cache clean --force    # Clear npm cache
```

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/TiffanyAmberJacobs/payment-portal.git
cd intl-payments
```
---
## 🎥 YouTube Demo
Check out the project in action on YouTube:  

https://youtu.be/sNGG1rP6kvw
---

## 🧾 License
This project is licensed under the **MIT License** — you are free to use, modify, and distribute it with proper attribution.

