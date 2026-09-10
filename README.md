# Enterprise Resource Planning (ERP) Suite

An enterprise-grade, full-stack Enterprise Resource Planning (ERP) platform designed for modern business operations. Built with a React (Vite) frontend featuring a unified light/dark design token system and an Express.js / MongoDB backend with JWT authentication and role-based access control.

---

## 🚀 Key Modules & Capabilities

- **Executive Analytics Dashboard**: Real-time business KPIs, financial metrics, and operational performance trends.
- **Employee Management**: Staff records, departmental assignments, role permissions, and full candidate profiles.
- **Task Board**: 4-column interactive Kanban workflow (*To Do*, *In Progress*, *In Review*, *Completed*) with priority filtering and phase management.
- **Leave Management & Time Off**: Real-time balance meters (Annual, Sick, Casual), approval/rejection workflows, and leave requests.
- **My Timesheet**: Digital punch clock widget with shift tracking, weekly workload matrix, and historical approval cycles.
- **Performance & Career Growth**: 360° peer reviews, quarterly OKR tracking, and core competency evaluation gauges.
- **Projects & AI Planner**: Automated work breakdown structures, risk matrices, and dependency graphs.
- **Inventory Control**: Real-time stock alerts, valuation tracking, and low-stock automation.
- **Payroll**: Automated salary computation, allowances, and tax deduction statements.
- **Design System**: Global theme architecture with instant Light/Dark mode toggling and zero-flash prehydration.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Recharts, Vanilla CSS Design Tokens
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JWT, Cloudinary
- **Architecture**: Monorepo with separated `frontend` and `backend` services

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (running locally or MongoDB Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Configure your MongoDB URI and secrets
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.
"# Enterprise-Resource-Planning." 
