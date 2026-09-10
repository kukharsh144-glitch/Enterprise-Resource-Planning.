import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlassToastContainer, { showGlassToast } from './components/GlassToast';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import RegisterEmployee from './pages/RegisterEmployee';
import EmployeeProfile from './pages/EmployeeProfile';
import Projects from './pages/Projects';
import AIPlanner from './pages/AIPlanner';
import Inventory from './pages/Inventory';
import Payroll from './pages/Payroll';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import TaskBoard from './pages/TaskBoard';
import LeaveRequests from './pages/LeaveRequests';
import Timesheet from './pages/Timesheet';
import Performance from './pages/Performance';

// Protected Route Layout Component
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)'
      }}>
        <h2>Loading ERP System...</h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If on projects page, let Projects take the dedicated full-screen workstation experience
  const isProjectsPage = location.pathname.startsWith('/projects');
  if (isProjectsPage) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        <Outlet />
      </div>
    );
  }

  // Handle Quick Create CTA callback (Optional mockup)
  const handleCreateClick = () => {
    showGlassToast.info('Quick Create', 'Select "Projects" or "Employees" page to add records directly.');
  };

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main workspace container */}
      <div className="main-content">
        <Header onCreateClick={handleCreateClick} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Anonymous/Login Layout Component
const AnonymousLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest Routes */}
          <Route element={<AnonymousLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Secure ERP Operations Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/register" element={<RegisterEmployee />} />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/ai-planner" element={<AIPlanner />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/task-board" element={<TaskBoard />} />
            <Route path="/leave-requests" element={<LeaveRequests />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlassToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
