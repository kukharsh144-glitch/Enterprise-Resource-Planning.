import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showGlassToast } from './GlassToast';
import {
  Bell,
  MessageSquare,
  Sun,
  Moon,
  Check,
  CheckCheck,
  Trash2,
  X,
  User,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';

const Header = () => {
  const { user, theme, toggleTheme } = useAuth();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Live Messages State (Initial 3 unread as shown in green screenshot circle)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Priya Singh',
      role: 'Lead Frontend',
      avatarColor: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      initials: 'PS',
      text: 'Reviewed the Study Mate agile deliverables. Architecture looks very clean!',
      time: '2m ago',
      unread: true,
      online: true
    },
    {
      id: 2,
      sender: 'Amit Verma',
      role: 'Backend Engineer',
      avatarColor: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      initials: 'AV',
      text: 'PR #142 for employee task dependency engine has been merged to main.',
      time: '18m ago',
      unread: true,
      online: true
    },
    {
      id: 3,
      sender: 'HR Automation',
      role: 'System Bot',
      avatarColor: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      initials: 'HR',
      text: 'September payroll slips and tax calculations have been generated for approval.',
      time: '1h ago',
      unread: true,
      online: false
    },
    {
      id: 4,
      sender: 'Rohan Sharma',
      role: 'DevOps Lead',
      avatarColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      initials: 'RS',
      text: 'Staging environment database clusters refreshed with latest schema.',
      time: '3h ago',
      unread: false,
      online: false
    }
  ]);

  // Live Notifications State (Initial 8 unread as shown in green screenshot circle)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Project Milestone Achieved',
      desc: 'AI Scaffolding Phase 1 finalized and ready for board review.',
      time: '5m ago',
      category: 'project',
      color: '#10b981',
      unread: true
    },
    {
      id: 2,
      title: 'Leave Request Awaiting Approval',
      desc: 'Priya Singh submitted medical leave for Sept 8 - Sept 10.',
      time: '20m ago',
      category: 'hr',
      color: '#f59e0b',
      unread: true
    },
    {
      id: 3,
      title: 'Payroll Verified & Staged',
      desc: 'Monthly gross payout ₹2.45 Cr ready for authorized disbursement.',
      time: '1h ago',
      category: 'payroll',
      color: '#8b5cf6',
      unread: true
    },
    {
      id: 4,
      title: 'Security Audit Passed',
      desc: '0 critical vulnerabilities detected in automated container scan.',
      time: '2h ago',
      category: 'security',
      color: '#06b6d4',
      unread: true
    },
    {
      id: 5,
      title: 'Cloud Backup Snapshot Saved',
      desc: 'Automated nightly snapshot of production PostgreSQL cluster successful.',
      time: '4h ago',
      category: 'system',
      color: '#3b82f6',
      unread: true
    },
    {
      id: 6,
      title: 'Task Assignment Received',
      desc: 'Harsh assigned you to Enterprise Architecture Review.',
      time: '5h ago',
      category: 'task',
      color: '#ec4899',
      unread: true
    },
    {
      id: 7,
      title: 'Sprint 4 Backlog Grooming',
      desc: 'Agile team backlog refinement scheduled for 10:30 AM tomorrow.',
      time: '6h ago',
      category: 'project',
      color: '#10b981',
      unread: true
    },
    {
      id: 8,
      title: 'Q3 Appraisal Window Open',
      desc: 'Employee self-assessment review cycle is open through Friday.',
      time: '8h ago',
      category: 'hr',
      color: '#f59e0b',
      unread: true
    }
  ]);

  const chatRef = useRef(null);
  const notificationsRef = useRef(null);

  // Calculate live counts dynamically
  const liveUnreadMessages = messages.filter(m => m.unread).length;
  const liveUnreadNotifications = notifications.filter(n => n.unread).length;

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setChatOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers for messages
  const markAllMessagesRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, unread: false })));
    showGlassToast.success('Messages Updated', 'All messages marked as read.');
  };

  const toggleMessageRead = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: !m.unread } : m));
  };

  // Handlers for notifications
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showGlassToast.success('Notifications Updated', 'All notifications marked as read.');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showGlassToast.info('Notifications Cleared', 'Notification list has been cleared.');
  };

  const toggleNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'relative',
      zIndex: 15,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* 1. Left Welcome Greeting */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <style>{`
            @keyframes waveHand {
              0% { transform: rotate(0.0deg) }
              10% { transform: rotate(14.0deg) }
              20% { transform: rotate(-8.0deg) }
              30% { transform: rotate(14.0deg) }
              40% { transform: rotate(-4.0deg) }
              50% { transform: rotate(10.0deg) }
              60% { transform: rotate(0.0deg) }
              100% { transform: rotate(0.0deg) }
            }
            .waving-hand-header {
              animation: waveHand 2.5s infinite;
              transform-origin: 70% 70%;
              display: inline-block;
            }
            .header-ctrl-btn {
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: var(--bg-surface-elevated);
              border: 1px solid var(--border-default);
              color: var(--text-secondary);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              position: relative;
              backdrop-filter: blur(12px);
              box-shadow: var(--shadow-sm);
              transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .header-ctrl-btn:hover {
              transform: translateY(-2px) scale(1.08);
              background: var(--bg-surface-hover);
              border-color: var(--color-primary-light);
              color: var(--text-primary);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.28);
            }
            .header-ctrl-btn:active {
              transform: translateY(1px) scale(0.95);
            }
            .header-badge-pulse {
              position: absolute;
              top: -3px;
              right: -3px;
              min-width: 17px;
              height: 17px;
              padding: 0 4px;
              border-radius: 10px;
              color: white;
              font-size: 9.5px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid var(--bg-header);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
              transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .header-ctrl-btn:hover .header-badge-pulse {
              transform: scale(1.15);
            }
          `}</style>
          <h1 style={{ fontSize: '19px', fontWeight: 750, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.fullname || 'Harsh Saini'} <span className="waving-hand-header">👋</span>
          </h1>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
          Here's what's happening in your organization today.
        </p>
      </div>

      {/* 2. Center Date & Weather */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Saturday, September 5, 2026
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '4px 10px',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <Sun size={13} style={{ color: '#f59e0b' }} />
          <strong style={{ color: 'var(--text-primary)' }}>27°C</strong>
          <span style={{ color: 'var(--text-muted)' }}>New Delhi, India</span>
        </div>
      </div>

      {/* 3. Right Controls: Theme Switcher, Live Messages & Live Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Standardized Theme Toggle Button (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          className="header-ctrl-btn"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="global-theme-toggle-btn"
        >
          {isDark ? (
            <Sun size={17} style={{ color: '#fbbf24', transition: 'transform 0.3s ease' }} />
          ) : (
            <Moon size={17} style={{ color: '#6366f1', transition: 'transform 0.3s ease' }} />
          )}
        </button>

        {/* Live Messages Icon Button with Live Counter Badge */}
        <div ref={chatRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setChatOpen(!chatOpen);
              setNotificationsOpen(false);
            }}
            className="header-ctrl-btn"
            title="Team Messages"
            aria-label="Open messages"
          >
            <MessageSquare size={17} />
            {liveUnreadMessages > 0 && (
              <span className="header-badge-pulse" style={{ backgroundColor: '#6366f1' }}>
                {liveUnreadMessages}
              </span>
            )}
          </button>

          {/* Interactive Live Messages Popover */}
          {chatOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '320px',
              background: 'var(--bg-popover)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-popover)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'backBtnEntrance 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}>
              {/* Popover Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h5 style={{ fontSize: '12.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Team Messages
                  </h5>
                  {liveUnreadMessages > 0 && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(99, 102, 241, 0.18)',
                      color: 'var(--color-primary-light)',
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}>
                      {liveUnreadMessages} new
                    </span>
                  )}
                </div>
                {liveUnreadMessages > 0 && (
                  <button
                    onClick={markAllMessagesRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-accent)',
                      fontSize: '11px',
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Messages List */}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="sm-scroll-area">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => toggleMessageRead(msg.id)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: msg.unread ? (isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)') : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = msg.unread ? (isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)') : 'transparent'}
                  >
                    {/* Avatar with Online Dot */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: msg.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {msg.initials}
                      </div>
                      {msg.online && (
                        <span style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          border: '2px solid var(--bg-popover)'
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{msg.sender}</strong>
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{msg.time}</span>
                      </div>
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: '11px',
                        color: msg.unread ? 'var(--text-primary)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.text}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {msg.unread && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Popover Footer */}
              <div style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center'
              }}>
                <span
                  onClick={() => {
                    setChatOpen(false);
                    navigate('/employees');
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    color: 'var(--text-accent)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Open Team Directory</span>
                  <ExternalLink size={12} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Notification Bell Icon Button with Live Counter Badge */}
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setChatOpen(false);
            }}
            className="header-ctrl-btn"
            title="System Notifications"
            aria-label="Open notifications"
          >
            <Bell size={17} />
            {liveUnreadNotifications > 0 && (
              <span className="header-badge-pulse" style={{ backgroundColor: '#ef4444' }}>
                {liveUnreadNotifications}
              </span>
            )}
          </button>

          {/* Interactive Live Notifications Popover */}
          {notificationsOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '330px',
              background: 'var(--bg-popover)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-popover)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'backBtnEntrance 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h5 style={{ fontSize: '12.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Notifications
                  </h5>
                  {liveUnreadNotifications > 0 && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--color-danger-light)',
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}>
                      {liveUnreadNotifications} unread
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {liveUnreadNotifications > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-accent)',
                        fontSize: '11px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} />
                      <span>Read all</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Clear notifications"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="sm-scroll-area">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No notifications at this time.
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleNotificationRead(item.id)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: item.unread ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.06)') : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = item.unread ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.06)') : 'transparent'}
                    >
                      {/* Category Dot */}
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        marginTop: '5px',
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${item.color}`
                      }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '11.5px', color: item.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {item.title}
                          </strong>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {item.time}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                          {item.desc}
                        </p>
                      </div>

                      {item.unread && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          marginTop: '6px',
                          flexShrink: 0
                        }} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center'
              }}>
                <span
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/projects');
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    color: 'var(--text-accent)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>View Project Board Tasks</span>
                  <ExternalLink size={12} />
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};

export default Header;
