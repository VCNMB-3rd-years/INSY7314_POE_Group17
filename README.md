# 🏦 International Payments Portal

A secure full-stack CRUD system for managing international payments with customer and employee portals.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-6+-green) ![License](https://img.shields.io/badge/license-ISC-blue)

---

## 🔒 Security Measures Implemented from Task 1

| Threat                                   | Protection                                                 | Details                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Clickjacking**                         | `X-Frame-Options` header, Content Security Policy (CSP)    | Headers set via `helmet()` prevent embedding in other sites. CSP restricts sources of content.                   |
| **Session hijacking**                    | Session regeneration, session timeouts, HTTPS-only cookies | `regenerateSession(req)` prevents session fixation. Cookies configured to `secure` for HTTPS.                    |
| **SQL/NoSQL Injection**                  | Input validation, sanitization                             | `express-validator` and `express-mongo-sanitize` protect against malicious inputs.                               |
| **Cross-site scripting (XSS)**           | Input sanitization, output encoding, CSP                   | Inputs validated via `express-validator` and CSP headers restrict scripts.                                       |
| **Man-in-the-middle (MITM)**             | HTTPS, strong passwords, software updates                  | HTTPS enforced, strong password policies, and dependencies kept up to date.                                      |
| **Distributed Denial of Service (DDoS)** | Rate limiting                                              | `express-rate-limit` limits login and registration attempts; Redis-backed rate limiting scalable for production. |

---

## 👥 Team Members & Responsibilities

| Name                 | Student Number | Assigned Tasks                                     |
| -------------------- | -------------- | -------------------------------------------------- |
| Samkelo Maswana      | ST10141464     | Session Implementation, API Connectivity, Database Creation, Admin Functionality |
| Tiffany-Amber Jacobs | ST10085839     | Front-End Design, API Creation                     |
| Joshua Sutherland    | ST10255930     | Pipeline Implementation, Security Integration      |

---

## 🚀 Features

### Customer Portal

* ✅ User registration with encrypted data
* 🔐 Secure login with JWT authentication
* 💸 Make international payments
* 📊 View payment history
* ✏️ Edit/delete pending payments

### Employee Portal

* 👥 Employee authentication
* 📋 View all customer transactions
* ✅ Verify/approve payments
* 🔍 Search and filter transactions
* 📈 View payment statistics

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Axios, React Router DOM

**Backend:** Node.js, Express.js, MongoDB with Mongoose, JWT Authentication, bcryptjs, express-validator

**Security:** Helmet.js, Rate limiting, CORS protection, Field-level encryption, Password hashing

---

## 📦 Docker Installation & Usage

This project uses Docker to containerize the React/Vite frontend and Node.js/MongoDB backend for consistent deployment, security, and scalability.

---
### Why Docker is Vital

* **Isolation:** Services run in separate containers, avoiding conflicts.
* **Consistency:** Same behavior across environments.
* **Security:** Limits exposure and simplifies dependency management.
* **Scalability:** Easily scale services independently.
* **Simplified Setup:** No complex local environment setup required.

---
### Quick Docker Setup & Commands

```bash
docker-compose up --build -d      # Build and start all services
docker-compose down               # Stop all containers
docker ps                          # List running containers
docker-compose logs -f backend    # View logs for backend
docker-compose build client       # Rebuild client service
docker exec -it payments-backend sh  # Access backend container shell
docker inspect --format='{{.State.Health.Status}}' payments-backend  # Healthcheck
```

**Notes:**

* Docker volumes persist database data and SSL certificates.
* No local Node.js or MongoDB installation is required.

---

## ⚙️ Continuous Integration (CI) Pipeline

Automated pipeline ensures code changes are tested, built, and verified before merging into main, maintaining code quality and security.

---

## 🧩 Security Workflows

Automated security scans are executed internally and results are published via a static GitHub Pages site with visual metrics.

### 1. Continuous Integration (CI)

* **Workflow:** `/.github/workflows/ci.yml`: Automates build and test checks for every push or PR to `main`.

---

### 2. CodeQL Security Analysis

* **Workflow:** `/.github/workflows/codeql-analysis.yml`: Performs static code analysis to detect vulnerabilities in JavaScript/TypeScript code.

---
### 3. Docker Security Scan

* **Workflow:** `/.github/workflows/docker-scan.yml`: Scans Docker images for backend and frontend using Trivy.


---
### 4. NPM Audit Security Scan

* **Workflow:** `/.github/workflows/npm-audit.yml`:  Detects vulnerabilities in Node.js dependencies.


---

### 5. Publishing Security Reports

* **Workflow:** `/.github/workflows/publish-security-reports.yml`: Aggregates results into a static website with graphs and metrics.


---
### Security Benefits Summary

| Workflow           | Scope                     | Outcome                           |
| ------------------ | ------------------------- | --------------------------------- |
| CI                 | Code compilation & tests  | Prevents broken/insecure builds   |
| CodeQL             | Static code analysis      | Detects vulnerabilities in code   |
| Docker Scan        | Docker images             | Detects container vulnerabilities |
| NPM Audit          | Node.js dependencies      | Detects vulnerable packages       |
| Publishing Reports | Reporting & visualization | Provides actionable insights      |

---

## 🧠 Benefits

* Prevents broken code from being merged
* Improves security and maintainability
* Encourages consistent coding standards
* Provides fast feedback to developers

---

## 🎥 YouTube Demo

Security Workflow Overview and Diagram of all Scans:
**Link**: https://vcnmb-3rd-years.github.io/INSY7314_POE_Group17/

* Part 2: [https://youtu.be/sNGG1rP6kvw](https://youtu.be/sNGG1rP6kvw)
* Part 3: https://www.youtube.com/watch?v=-Phj0oQ3lTM

---

## 🧾 License

This project is licensed under the **MIT License** — free to use, modify, and distribute with proper attribution.
