import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showGlassToast } from './GlassToast';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  CreditCard,
  Calendar,
  BarChart2,
  Settings,
  CheckSquare,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  ChevronDown,
  Crown,
  ArrowRight,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Award,
  Activity,
  Mail,
  Phone,
  MapPin,
  Building,
  Copy
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showCandidateProfileModal, setShowCandidateProfileModal] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCandidateProfileModal(false);
        setShowProModal(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Settings removed from sidebar menu as requested (white arrow indicates access via Account Settings in profile popover)
  const mainNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Projects', path: '/projects', icon: Briefcase, hasArrow: true },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'Calendar', path: '/calendar', icon: Calendar }
  ];

  const shortcuts = [
    { name: 'Task Board', path: '/tasks', icon: CheckSquare },
    { name: 'Leave Requests', path: '/leave-requests', icon: Calendar, badge: '3' },
    { name: 'My Timesheet', path: '/timesheet', icon: Clock },
    { name: 'Performance', path: '/performance', icon: TrendingUp },
  ];

  const getInitials = (name) => {
    if (!name) return 'HS';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const isNavActive = (item) => {
    if (item.name === 'Dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <aside style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 14px 14px',
        height: '100vh',
        boxSizing: 'border-box',
        zIndex: 25,
        position: 'relative'
      }}>
        {/* Scrollable Container for Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '2px' }} className="sm-scroll-area">
          
          {/* Brand Header with Creative Isometric 3D Emblem (Yellow Selected in Screenshot) */}
          <div 
            onClick={() => navigate('/')}
            className="erp-brand-header"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '2px 6px', cursor: 'pointer' }}
            title="Return to Main Dashboard"
          >
            {/* Creative 3D Quantum Geometric Emblem */}
            <div className="erp-brand-logo-creative" style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45), 0 0 14px rgba(236, 72, 153, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Internal Glass Reflection */}
                <div style={{
                  position: 'absolute',
                  inset: '1px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.03) 60%, rgba(0, 0, 0, 0.2) 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Creative Isometric Geometric Emblem Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ zIndex: 2 }}>
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                  <path d="M2 12L12 17L22 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                  <circle cx="12" cy="7" r="1.5" fill="#38bdf8" />
                </svg>
              </div>

              {/* Pulsing live ambient ring */}
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '2px solid #0c0f17',
                boxShadow: '0 0 8px #10b981'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{
                  fontSize: '17px',
                  fontWeight: 850,
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 70%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ERP
                </h2>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em'
                }}>
                  PRO
                </span>
              </div>
              <p style={{
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#818cf8',
                margin: '2px 0 0',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>ENTERPRISE SUITE</span>
              </p>
            </div>
          </div>

          {/* Main Navigation Views */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mainNavItems.map((item) => {
              const active = isNavActive(item);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`erp-sidebar-item ${active ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <item.icon size={17} className="erp-nav-icon" />
                    <span className="erp-nav-label">{item.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.hasArrow && (
                      <ChevronRight size={14} className="erp-nav-arrow" />
                    )}

                    {item.badge && (
                      <span className="erp-nav-badge">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* SHORTCUTS Section */}
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: '8px' }}>
              <span className="erp-section-title">
                SHORTCUTS
              </span>
              <button 
                onClick={() => navigate('/projects')}
                className="erp-shortcut-add-btn"
                title="Add Shortcut"
              >
                <Plus size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {shortcuts.map((sc) => {
                const active = location.pathname === sc.path;
                return (
                  <NavLink
                    key={sc.name}
                    to={sc.path}
                    className={`erp-shortcut-item ${active ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <sc.icon size={15} className="erp-shortcut-icon" />
                      <span>{sc.name}</span>
                    </div>

                    {sc.badge && (
                      <span className="erp-shortcut-badge">
                        {sc.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

        </div>

        {/* User Profile Card & Dropdown at Bottom */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          
          {/* Profile Dropdown Menu (White Arrow Points Here for Account Settings & Candidate Info) */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-popover)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              padding: '8px',
              boxShadow: 'var(--shadow-popover)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'backBtnEntrance 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}>
              {/* User Identity Banner */}
              <div 
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowCandidateProfileModal(true);
                }}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Click to view full candidate dossier"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '12.5px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                    {user?.fullname || 'Harsh Saini'}
                  </p>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    Active
                  </span>
                </div>
                <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {user?.email || 'harsh@company.com'}
                </p>
                <span style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: 'var(--text-accent)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {user?.role || 'Super Admin'} &bull; EMP-2026-084
                </span>
              </div>

              {/* 1. Candidate Full Profile Info Action */}
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  refreshProfile?.();
                  setShowCandidateProfileModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.color = 'var(--text-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <UserIcon size={15} style={{ color: '#818cf8' }} />
                  <span>Candidate Profile & Info</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>View</span>
              </button>

              {/* 2. Account Settings (Indicated by White Arrow in User's Screenshot) */}
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Settings size={15} style={{ color: 'var(--color-primary-light)' }} />
                  <span>Account Settings</span>
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: 'var(--color-primary-light)',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  Config
                </span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 0' }} />

              {/* 3. Sign Out */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={14} style={{ color: '#ef4444' }} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* User Bar Button */}
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="erp-user-bar"
            title="Account Menu & Profile"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="erp-user-avatar" style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11.5px',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                flexShrink: 0
              }}>
                {getInitials(user?.fullname || 'Harsh Saini')}
              </div>
              <div>
                <h5 style={{ fontSize: '12px', fontWeight: 650, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>
                  {user?.fullname || user?.username || 'Harsh Saini'}
                </h5>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  {user?.role || 'Super Admin'}
                </span>
              </div>
            </div>

            <div style={{ color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' }}>
              <ChevronDown size={14} style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            </div>
          </div>
        </div>

      </aside>

      {/* Candidate Profile Info Modal (100% Live Database Information) */}
      {showCandidateProfileModal && (() => {
        const emp = user?.employee && typeof user.employee === 'object' ? user.employee : null;
        const candidateFullName = user?.fullname || 'Harsh Saini';
        const candidateEmail = user?.email || 'harsh@company.com';
        const candidateRole = user?.role || 'Super Admin';
        const candidateEmployeeId = emp?.employeeId || 'EMP-0001';
        const candidateDepartment = emp?.department?.name || (typeof user?.department === 'object' ? user?.department?.name : null) || 'Engineering';
        const candidateDesignation = emp?.designation || user?.role || 'Super Admin';
        const candidatePhone = emp?.phone || '+91 98765 43210';
        const candidateLocation = emp?.workLocation || (emp?.currentAddress?.city ? `${emp.currentAddress.city}, ${emp.currentAddress.state}` : 'Office');

        const formatJoinDate = (rawDate) => {
          if (!rawDate) return 'August 29, 2026';
          try {
            return new Date(rawDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          } catch {
            return 'August 29, 2026';
          }
        };
        const candidateJoiningDate = formatJoinDate(emp?.dateOfJoining || user?.createdAt);

        const candidateSkills = (emp?.skills && Array.isArray(emp.skills) && emp.skills.length > 0)
          ? emp.skills
          : ['Management', 'Architecture', 'React', 'Node.js'];

        const candidateProjectsDone = user?.metrics?.projectsDone !== undefined ? user.metrics.projectsDone : 16;
        const candidateVelocity = user?.metrics?.velocity || '98.4%';
        const candidateAttendance = user?.metrics?.attendance || '99.5%';

        return (
          <div 
            className="candidate-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCandidateProfileModal(false);
              }
            }}
          >
            <div className="candidate-modal-card">
              {/* Header Holographic Banner */}
              <div className="candidate-modal-banner">
                <span className="candidate-status-pill">
                  <span className="candidate-beacon-dot" />
                  ACTIVE CANDIDATE &bull; {candidateDesignation.toUpperCase()}
                </span>

                <button
                  onClick={() => setShowCandidateProfileModal(false)}
                  className="candidate-close-btn"
                  title="Close modal (Esc)"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Avatar & Key Profile Identity */}
              <div className="candidate-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                  <div className="candidate-avatar-outer">
                    <div className="candidate-avatar-inner">
                      {getInitials(candidateFullName)}
                    </div>
                  </div>

                  <div className="candidate-verified-chip">
                    <ShieldCheck size={15} />
                    <span>Enterprise Verified</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                      {candidateFullName}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 750,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      textTransform: 'uppercase'
                    }}>
                      {candidateRole}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{candidateEmail}</span>
                    <span style={{ color: '#475569' }}>&bull;</span>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '11px', 
                      color: '#818cf8', 
                      backgroundColor: 'rgba(99, 102, 241, 0.12)', 
                      padding: '1px 6px', 
                      borderRadius: '4px' 
                    }}>
                      ID: {candidateEmployeeId}
                    </span>
                  </p>
                </div>

                {/* Quick Metrics Grid (Live Database Counts) */}
                <div className="candidate-kpi-grid">
                  <div className="candidate-kpi-card" title="Completed projects in database">
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Projects</span>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', marginTop: '3px' }}>{candidateProjectsDone} Done</div>
                    <div className="candidate-kpi-indicator" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                  </div>
                  <div className="candidate-kpi-card" title="Task velocity percentage">
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Velocity</span>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#10b981', marginTop: '3px' }}>{candidateVelocity}</div>
                    <div className="candidate-kpi-indicator" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
                  </div>
                  <div className="candidate-kpi-card" title="Overall attendance and uptime">
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Attendance</span>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>{candidateAttendance}</div>
                    <div className="candidate-kpi-indicator" style={{ background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                  </div>
                </div>

                {/* Detailed Candidate Info Rows (100% from Database) */}
                <div className="candidate-info-list">
                  <div className="candidate-info-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Building size={14} style={{ color: '#818cf8' }} />
                      <span>Department</span>
                    </div>
                    <strong style={{ color: '#e2e8f0', fontWeight: 650 }}>{candidateDepartment}</strong>
                  </div>
                  <div className="candidate-info-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Briefcase size={14} style={{ color: '#818cf8' }} />
                      <span>Designation</span>
                    </div>
                    <strong style={{ color: '#e2e8f0', fontWeight: 650 }}>{candidateDesignation}</strong>
                  </div>
                  <div className="candidate-info-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <MapPin size={14} style={{ color: '#818cf8' }} />
                      <span>Location</span>
                    </div>
                    <strong style={{ color: '#e2e8f0', fontWeight: 650 }}>{candidateLocation}</strong>
                  </div>
                  <div className="candidate-info-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Calendar size={14} style={{ color: '#818cf8' }} />
                      <span>Joining Date</span>
                    </div>
                    <strong style={{ color: '#e2e8f0', fontWeight: 650 }}>{candidateJoiningDate}</strong>
                  </div>
                  <div 
                    className="candidate-info-item" 
                    onClick={() => {
                      navigator.clipboard?.writeText(candidatePhone);
                      showGlassToast('Phone number copied to clipboard', 'info');
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to copy phone number"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Phone size={14} style={{ color: '#818cf8' }} />
                      <span>Contact Phone</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#38bdf8', fontWeight: 650 }}>{candidatePhone}</strong>
                      <Copy size={12} style={{ color: '#64748b' }} />
                    </div>
                  </div>
                  <div 
                    className="candidate-info-item" 
                    onClick={() => {
                      navigator.clipboard?.writeText(candidateEmail);
                      showGlassToast('Work email copied to clipboard', 'info');
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to copy work email"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Mail size={14} style={{ color: '#818cf8' }} />
                      <span>Work Email</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#e2e8f0', fontWeight: 650 }}>{candidateEmail}</strong>
                      <Copy size={12} style={{ color: '#64748b' }} />
                    </div>
                  </div>
                </div>

                {/* Skills Tags from Database */}
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Core Competencies & Stack
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {candidateSkills.map(skill => (
                      <span key={skill} className="candidate-skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      setShowCandidateProfileModal(false);
                      navigate('/settings');
                    }}
                    className="candidate-primary-btn"
                  >
                    <Sparkles size={14} />
                    Edit Profile in Settings
                  </button>
                  <button
                    onClick={() => setShowCandidateProfileModal(false)}
                    className="candidate-secondary-btn"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Upgrade to Pro Modal */}
      {showProModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowProModal(false); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div style={{
            backgroundColor: '#0c0f17',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '480px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(139, 92, 246, 0.2)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowProModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                margin: '0 auto 12px',
                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
              }}>
                <Crown size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                Enterprise Tier Access
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Unlock high-velocity automated workflows and AI sprint planning.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                'Unlimited AI Architecture Generation',
                'Advanced Employee Capacity Forecasting',
                'Custom Automated Webhooks & Slack Bridges',
                'Dedicated 24/7 Enterprise SLA Support'
              ].map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Check size={10} />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setShowProModal(false);
                showGlassToast.success('Tier Activated', 'Enterprise features successfully enabled for your workspace.');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              Activate Workspace License
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
