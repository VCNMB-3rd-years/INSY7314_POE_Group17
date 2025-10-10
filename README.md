# 🏦 International Payments Portal

A secure full-stack CRUD system for managing international payments with customer and employee portals.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![License](https://img.shields.io/badge/license-ISC-blue)

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
git clone <your-repo-url>
cd intl-payments
