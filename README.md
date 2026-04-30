<div align="center">

<br/>

# ⚡ TaskFlow

### A Production-Ready Team Task Manager

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

> Built for the **[Ethara.AI](https://ethara.ai)** Full-Stack Engineering Assessment — featuring project-scoped RBAC, real-time collaboration via Socket.IO, and a premium glassmorphism UI.

<br/>

---

</div>

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-system-architecture)
- [Local Setup](#-local-development-setup)
- [Deployment](#-deployment-on-render)
- [Environment Variables](#-environment-variables)

---

## 🧭 Overview

**TaskFlow** is a full-stack collaborative task management platform designed with scalability and security in mind. It supports multi-user project workspaces with granular, project-scoped Role-Based Access Control (RBAC), real-time updates across all connected clients, and an intuitive Kanban-style interface — all deployable to the cloud in minutes.

---

## ✨ Features

### 🔐 Authentication
- Secure JWT-based signup and login
- Passwords hashed with `bcrypt.js`
- Token expiry and refresh-safe architecture

### 📁 Project Management
- Create, view, and delete projects
- Project creator is automatically assigned the **Admin** role
- Clean project overview with member and task statistics

### 👥 Project-Level RBAC

| Action | Admin | Member |
|---|:---:|:---:|
| Add / Remove Members | ✅ | ❌ |
| Assign Roles | ✅ | ❌ |
| Full Task CRUD | ✅ | ❌ |
| Update Own Task Status | ✅ | ✅ |
| View Project | ✅ | ✅ |

> Roles are strictly **scoped per project** — a user can be an Admin in one project and a Member in another.

### 📋 Kanban Task Board
- Create tasks with **priority levels** (Low / Medium / High)
- Set **due dates** and **assignees**
- Drag-free status progression: `Todo → In Progress → Done`
- Overdue task detection with visual indicators

### ⚡ Real-Time Collaboration
- Powered by **Socket.IO** — task and member changes broadcast instantly
- No page reloads required; all clients stay in sync automatically

### 📊 Interactive Dashboard
- Project progress overview
- Task distribution by status and priority
- Overdue task tracker with contextual alerts

---

## 🛠 Tech Stack

### Frontend

| Technology | Role |
|---|---|
| **React 18** + **Vite** | UI framework & build tool |
| **Tailwind CSS** | Styling with custom glassmorphism design system |
| **Zustand** | Lightweight global state management |
| **React Router DOM** | Client-side routing |
| **Socket.IO Client** | Real-time event handling |
| **Lucide React** | Icon library |

### Backend

| Technology | Role |
|---|---|
| **Node.js** + **Express.js** | REST API server |
| **MongoDB** + **Mongoose** | Primary database with ODM |
| **mongodb-memory-server** | In-memory fallback for frictionless local dev |
| **Socket.IO** | WebSocket server for real-time events |
| **JWT** | Stateless authentication |
| **Zod** | Schema-based request validation |
| **bcrypt.js** | Secure password hashing |

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│   React + Zustand + Socket.IO Client + React Router     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (REST) + WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                       SERVER                            │
│              Node.js + Express.js                       │
│                                                         │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │  Auth Layer │  │  RBAC Middleware│  │  Socket.IO  │  │
│  │  (JWT/BCrypt│  │  requireRole   │  │  Event Bus  │  │
│  └─────────────┘  └────────────────┘  └─────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              MongoDB / Mongoose                 │    │
│  │       (Atlas in Prod · In-Memory in Dev)        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Separation of Concerns** — Project/role management is fully decoupled from the task feature layer.
- **API-Level Enforcement** — RBAC is enforced server-side via `requireProjectRole` and `requireProjectMember` middleware, never just on the client.
- **Zero-Friction Dev** — The backend auto-falls back to `mongodb-memory-server` if `MONGO_URI` is unreachable, so no local MongoDB install is required.

---

## ⚙️ Local Development Setup

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** *(optional — the backend falls back to an in-memory instance automatically)*

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Then fill in your values (see [Environment Variables](#-environment-variables) below).

Start the backend:

```bash
npm run dev
# Server running at http://localhost:5000
```

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

> **Note:** Ensure your `src/lib/axios.js` and `src/lib/useSocket.js` point to `http://localhost:5000` for local development.

---

## 🔐 Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | Secret key for signing JWTs | `a_very_strong_random_secret` |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |

```env
# backend/.env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 🚀 Deployment on Render

This project is optimized for zero-config deployment on [Render](https://render.com/).

### Step 1 — Deploy the Backend (Web Service)

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

4. Add Environment Variables in the Render dashboard:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your **MongoDB Atlas** connection string |
| `JWT_SECRET` | A strong, randomly generated secret |
| `CLIENT_URL` | Your deployed frontend URL (added after Step 2) |

---

### Step 2 — Deploy the Frontend (Static Site)

1. Create a new **Static Site** on Render
2. Connect the same GitHub repository
3. Configure the site:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

4. Before your final push, update the backend URL in your frontend config — ideally via a `.env` variable:

```js
// src/lib/axios.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
```

```env
# frontend/.env.production
VITE_API_URL=https://your-backend.onrender.com
```

---

## 📄 License

This project was built as an assessment submission for **[Ethara.AI](https://ethara.ai)** and is intended for evaluation purposes.

---

<div align="center">

Built with ❤️ for the **[Ethara.AI](https://ethara.ai)** Full-Stack Engineering Assessment 
By Tanushree Sarkar (2201641530214)

</div>
