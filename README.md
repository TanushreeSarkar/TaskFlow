# 🚀 TaskFlow — Team Task Manager

![TaskFlow Header](https://via.placeholder.com/1200x400/8b5cf6/ffffff?text=TaskFlow+Team+Task+Manager)

> **Ethara.AI Full-Stack Assessment Submission**

A modern, production-ready Team Task Manager application featuring project-level Role-Based Access Control (RBAC), real-time updates, and a premium glassmorphism UI.

---

## ✨ Features

- **🔐 Secure Authentication:** JWT-based user signup and login.
- **📁 Project Management:** Create, view, and delete projects.
- **👥 Project-Level RBAC:** 
  - Roles are scoped strictly per-project (Admin / Member).
  - Admins can add/remove members and assign roles.
  - Project creators automatically become Admins.
- **📋 Task Tracking (Kanban):** 
  - Create tasks, assign priorities (Low/Medium/High), due dates, and assignees.
  - Admins have full CRUD control over tasks.
  - Members can only update the status (Todo → In Progress → Done) of tasks assigned to them.
- **⚡ Real-Time Collaboration:** Powered by Socket.IO, task and member updates reflect instantly across the team without page reloads.
- **📊 Interactive Dashboard:** Overview of project progress, task distribution, and an overdue task tracker.
- **🎨 Premium UI/UX:** Built with Tailwind CSS featuring gradients, responsive layouts, and smooth animations.

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS (Premium custom design system)
- Zustand (State management)
- React Router DOM
- Socket.IO Client
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (with in-memory fallback for easy testing)
- Socket.IO (Real-time events)
- JSON Web Tokens (JWT) for Authentication
- Zod (Request validation)
- Bcrypt.js (Password hashing)

---

## 📸 Screenshots

*(Replace these placeholders with actual screenshots of your running app)*

<div align="center">
  <img src="https://via.placeholder.com/800x450/f1f5f9/6366f1?text=Dashboard+Screenshot" alt="Dashboard" width="48%">
  <img src="https://via.placeholder.com/800x450/f1f5f9/6366f1?text=Kanban+Board+Screenshot" alt="Task Board" width="48%">
</div>

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Optional: The backend falls back to an in-memory MongoDB if a local instance isn't running).

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <repo-name>
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🚀 Deployment Guide (Render)

This application is fully optimized for deployment on [Render](https://render.com/).

### Backend Deployment (Web Service)
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set the Root Directory to `backend`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A strong random string.
   - `CLIENT_URL`: The URL of your deployed frontend.

### Frontend Deployment (Static Site)
1. Create a new **Static Site** on Render.
2. Connect your GitHub repository.
3. Set the Root Directory to `frontend`.
4. Build Command: `npm run build`
5. Publish Directory: `dist`
6. *Note: Ensure your `src/lib/axios.js` and `src/lib/useSocket.js` URLs are updated to point to your live backend URL before pushing, or utilize environment variables.*

---

## 🧠 System Architecture Notes

- **Separation of Concerns:** The system clearly separates core project/role management from the feature layer (tasks).
- **Security:** Access control is strictly enforced at the API route level using custom middleware (`requireProjectRole`, `requireProjectMember`).
- **Resilience:** The backend seamlessly switches to `mongodb-memory-server` if the primary `MONGO_URI` connection fails, ensuring zero-friction local testing.

---

<p align="center">Built with ❤️ for the Ethara.AI Assessment</p>
