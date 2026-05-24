# 🚀 OpsHub — Enterprise Operations Platform

An enterprise-grade full-stack operations management platform built for organizations to manage tickets, tasks, projects, teams, analytics, notifications, and operational workflows from a centralized dashboard.

OpsHub combines modern frontend technologies, scalable backend architecture, secure JWT authentication, role-based access control, and production-ready deployment into a complete enterprise ecosystem.

---

## 🔴 **Live Demo:** [Click here to test the app](https://ops-hub-livid.vercel.app/login)

## 🔗 Frontend

https://ops-hub-livid.vercel.app/login

## 🔗 Backend API Docs

https://opshub-backend.onrender.com/api/v1/docs/

---

# 🔑 Demo Admin Login

Use the following credentials to explore the platform:

```bash
Email: nivedh@example.com
Password: OpsHubAdmin@2026
```

---

# 📂 GitHub Repository

## 🔗 Repository

https://github.com/NivedhReddy2048/OpsHub

---

# ✨ Features

# 🏢 Organization Features

### 🏢 Multi-Organization Workspace
### 👥 Team Management System
### 🔐 Role-Based Access Control (RBAC)
### 📊 Operational Analytics Dashboard
### 🔔 Notification Management
### 📜 Audit Logging System

---

# 🎫 Ticket Management

### 🎟️ Ticket Creation & Tracking
### 📌 Ticket Status Workflow
### ⚡ Priority Management
### 📅 SLA Monitoring
### 🧑‍💻 Assigned Team Tracking
### 📊 Ticket Analytics

---

# ✅ Task Management

### 📋 Sprint Task Management
### 🧠 Productivity Workflow
### 📅 Due Date Tracking
### 🚨 Overdue Task Detection
### 📈 Task Status Breakdown
### 🧩 Task Assignment System

---

# 📁 Project Management

### 📂 Project Organization
### 📊 Project Health Monitoring
### 🔄 Active / Inactive Projects
### 🧑‍🤝‍🧑 Team Collaboration
### 📈 Operational Visibility

---

# 👨‍💼 Admin Features

### ⚙️ Enterprise Admin Dashboard
### 👥 User & Team Administration
### 🔐 Permission Control
### 📊 Platform Monitoring
### 📜 Audit Logs
### 🧠 Organization Bootstrap System

---

# 🔐 Authentication & Security

### 🔑 JWT Authentication
### 🔄 Refresh Token Rotation
### 🛡️ Protected API Routes
### 🔐 Role-Based Authorization
### 🌐 Secure CORS Configuration
### 🧾 Session Persistence

---

# 🏗️ Tech Stack

# 🎨 Frontend

### ⚛️ Next.js 16
### ⚛️ React
### 🔷 TypeScript
### 🎨 Tailwind CSS
### 📡 Axios
### 🔐 JWT Authentication Context
### 📱 Responsive UI

---

# 🖥️ Backend

### 🐍 Django
### 🚀 Django REST Framework
### 🔑 Simple JWT
### 🗃️ PostgreSQL Ready
### 🌐 CORS Headers
### 🔥 Gunicorn
### 📦 WhiteNoise

---

# ☁️ Deployment

# ▲ Frontend

### Vercel

# 🚀 Backend

### Render

---

# 📂 Project Structure

```bash
OpsHub/
│
├── backend/
│   ├── accounts/
│   ├── analytics/
│   ├── auditlogs/
│   ├── notifications/
│   ├── organizations/
│   ├── projects/
│   ├── tasks/
│   ├── tickets/
│   ├── core/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── services/
│   ├── hooks/
│   └── utils/
│
└── README.md
```

---

# 📊 Core Modules

| Module | Description |
|---|---|
| Accounts | Authentication & User Management |
| Organizations | Organization & Workspace Management |
| Tickets | Ticket Lifecycle Tracking |
| Tasks | Sprint & Task Management |
| Projects | Project Operations |
| Notifications | Alert & Notification System |
| Analytics | Operational Metrics & Insights |
| Audit Logs | System Activity Tracking |
| Core | Shared Backend Utilities |

---

# 🔐 Authentication Flow

OpsHub uses a secure JWT-based authentication system:

### ✅ Access Tokens
### ✅ Refresh Tokens
### ✅ Protected API Endpoints
### ✅ Persistent Login Sessions
### ✅ Role-Based Authorization
### ✅ Organization-Scoped Permissions

---

# 📡 API Features

### RESTful APIs
### JWT Authentication APIs
### Team Management APIs
### Task APIs
### Ticket APIs
### Project APIs
### Notification APIs
### Analytics APIs

---

# 🧪 Local Setup

# 1️⃣ Clone Repository

```bash
git clone https://github.com/NivedhReddy2048/OpsHub.git

cd OpsHub
```

---

# 2️⃣ Backend Setup

```bash
cd backend

python -m venv venv
```

# ▶️ Activate Virtual Environment

## Windows

```bash
venv\Scripts\activate
```

## Linux / Mac

```bash
source venv/bin/activate
```

---

# 📦 Install Dependencies

```bash
pip install -r requirements.txt
```

---

# ⚙️ Run Migrations

```bash
python manage.py migrate
```

---

# 👨‍💼 Create Admin User

```bash
python manage.py createsuperuser
```

---

# 🚀 Start Backend

```bash
python manage.py runserver
```

Backend runs on:

```bash
http://127.0.0.1:8000/
```

---

# 3️⃣ Frontend Setup

```bash
cd frontend

npm install
```

---

# ▶️ Start Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:3000/
```

---

# ⚙️ Environment Variables

# Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

---

# Backend `.env`

```env
SECRET_KEY=your_secret_key

DEBUG=True

ALLOWED_HOSTS=localhost,127.0.0.1

CORS_ALLOW_ALL_ORIGINS=True
```

---

# 🚀 Production Deployment

# Render Build Command

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput
```

# Render Start Command

```bash
python manage.py migrate && gunicorn core.wsgi:application
```

---

# 🔥 Highlights

### ✅ Enterprise Operations Platform
### ✅ Full Stack Architecture
### ✅ Production Deployment
### ✅ JWT Authentication System
### ✅ Role-Based Access Control
### ✅ Team & Organization Management
### ✅ Ticket & Task Tracking
### ✅ Analytics Dashboard
### ✅ Audit Logging
### ✅ Scalable Backend Design
### ✅ Responsive UI
### ✅ REST API Architecture

---

# 📸 Screenshots

## 🔐 Login Page

![Login](https://raw.githubusercontent.com/NivedhReddy2048/OpsHub/main/screenshots/login.png)

---

## 📊 Dashboard

![Dashboard](https://github.com/NivedhReddy2048/OpsHub/blob/main/screenshots/Dashboard.png?raw=true)

---

## 👥 Team Management

![Team](https://raw.githubusercontent.com/NivedhReddy2048/OpsHub/main/screenshots/team.png)

---

## 📋 Task Management

![Tasks](https://raw.githubusercontent.com/NivedhReddy2048/OpsHub/main/screenshots/tasks.png)

---

## 📁 Project Management

![Projects](https://raw.githubusercontent.com/NivedhReddy2048/OpsHub/main/screenshots/projects.png)

---

## 🔔 Notifications

![Notifications](https://raw.githubusercontent.com/NivedhReddy2048/OpsHub/main/screenshots/notifications.png)

---

## ⚙️ Settings Panel

![Settings](https://raw.githubusercontent.com/NivedhReddy2048/OpsHub/main/screenshots/settings.png)

---

# 👨‍💻 Developed By

# 🚀 Nivedh Reddy

Passionate Full Stack & AI Developer focused on:

### Full Stack Development
### Enterprise Software Systems
### AI Applications
### Cloud Deployment
### Scalable Backend Architecture
### Modern Frontend Engineering

---

# ⭐ Future Enhancements

### 📱 Mobile Application
### 📊 Advanced Analytics
### 🤖 AI-Powered Ticket Intelligence
### 🔔 Real-Time WebSocket Notifications
### 🌍 Multi-Organization Switching
### 📈 SLA Prediction Engine
### 🧠 AI Operational Assistant
### ☁️ Full PostgreSQL Migration
### 🐳 Docker Deployment
### 📡 Microservices Architecture

---

# 📜 License

This project is developed for educational, portfolio, and enterprise software learning purposes.

---

# 💡 Support

If you like this project:

### ⭐ Star the repository
### 🍴 Fork the project
### 🛠️ Contribute improvements
### 🚀 Share with others

---
