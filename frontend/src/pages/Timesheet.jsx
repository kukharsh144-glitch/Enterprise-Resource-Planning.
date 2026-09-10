import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showGlassToast } from '../components/GlassToast';
import {
  Clock,
  Play,
  Pause,
  Square,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Send,
  Download,
  Activity,
  Briefcase,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

const INITIAL_PROJECT_ROWS = [
  {
    id: 1,
    project: 'Enterprise Core Suite',
    task: 'UI Theme Standardization & Tokens',
    mon: 8.0,
    tue: 8.0,
    wed: 7.5,
    thu: 8.0,
    fri: 7.0,
    sat: 0.0,
    sun: 0.0
  },
  {
    id: 2,
    project: 'Cloud DevOps Pipeline',
    task: 'Kubernetes Cluster Auto-scaling & Metrics',
    mon: 0.0,
    tue: 1.0,
    wed: 1.5,
    thu: 0.5,
    fri: 1.0,
    sat: 0.0,
    sun: 0.0
  },
  {
    id: 3,
    project: 'Internal Operations',
    task: 'Sprint Planning & Architectural Review',
    mon: 1.0,
    tue: 0.5,
    wed: 0.0,
    thu: 0.5,
    fri: 1.0,
    sat: 0.0,
    sun: 0.0
  }
];

const PAST_TIMESHEETS = [
  {
    cycle: 'Aug 31 - Sep 06, 2026',
    regularHours: 40.0,
    overtime: 2.0,
    total: 42.0,
    status: 'Approved',
    approvedBy: 'Harsh Saini',
    submittedOn: '2026-09-06'
  },
  {
    cycle: 'Aug 24 - Aug 30, 2026',
    regularHours: 40.0,
    overtime: 0.0,
    total: 40.0,
    status: 'Approved',
    approvedBy: 'Harsh Saini',
    submittedOn: '2026-08-30'
  },
  {
    cycle: 'Aug 17 - Aug 23, 2026',
    regularHours: 39.5,
    overtime: 1.5,
    total: 41.0,
    status: 'Approved',
    approvedBy: 'Harsh Saini',
    submittedOn: '2026-08-23'
  }
];

export default function Timesheet() {
  const { user } = useAuth();

  // Clock State
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(27740); // e.g. ~7h 42m
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timesheet grid state
  const [rows, setRows] = useState(INITIAL_PROJECT_ROWS);
  const [submissionStatus, setSubmissionStatus] = useState('Draft');
  const [weekOffset, setWeekOffset] = useState(0);

  // Clock timer
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Session timer
  useEffect(() => {
    let timer;
    if (isClockedIn && !isOnBreak) {
      timer = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, isOnBreak]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePunchClock = () => {
    if (!isClockedIn) {
      setIsClockedIn(true);
      setIsOnBreak(false);
      showGlassToast.success('Clocked In', 'Shift timer started at ' + currentTime.toLocaleTimeString());
    } else {
      setIsClockedIn(false);
      setIsOnBreak(false);
      showGlassToast.info('Clocked Out', 'Shift concluded. Total working session logged.');
    }
  };

  const handleToggleBreak = () => {
    if (!isClockedIn) return;
    setIsOnBreak(!isOnBreak);
    if (!isOnBreak) {
      showGlassToast.warning('Break Started', 'Session timer is currently paused.');
    } else {
      showGlassToast.success('Break Ended', 'Resuming active work shift.');
    }
  };

  // Row update
  const handleHoursChange = (rowId, day, value) => {
    const num = parseFloat(value) || 0;
    const clamped = Math.max(0, Math.min(24, num));
    setRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, [day]: clamped } : r))
    );
  };

  const handleAddRow = () => {
    const newId = Date.now();
    const newRow = {
      id: newId,
      project: 'New Project Assignment',
      task: 'Feature Implementation',
      mon: 0.0,
      tue: 0.0,
      wed: 0.0,
      thu: 0.0,
      fri: 0.0,
      sat: 0.0,
      sun: 0.0
    };
    setRows(prev => [...prev, newRow]);
    showGlassToast.info('Row Added', 'New project timesheet row added to matrix.');
  };

  const handleDeleteRow = (id) => {
    if (rows.length <= 1) {
      showGlassToast.warning('Notice', 'You must have at least one project row in your timesheet.');
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Calculations
  const getRowTotal = (row) => {
    return (row.mon + row.tue + row.wed + row.thu + row.fri + row.sat + row.sun).toFixed(1);
  };

  const getDayTotal = (day) => {
    return rows.reduce((sum, r) => sum + (r[day] || 0), 0).toFixed(1);
  };

  const grandTotal = rows.reduce((sum, r) => {
    return sum + (r.mon + r.tue + r.wed + r.thu + r.fri + r.sat + r.sun);
  }, 0).toFixed(1);

  const handleSaveDraft = () => {
    showGlassToast.success('Draft Saved', 'Timesheet draft saved successfully locally.');
  };

  const handleSubmit = () => {
    if (parseFloat(grandTotal) === 0) {
      showGlassToast.error('Validation Error', 'Please log at least some working hours before submitting.');
      return;
    }
    setSubmissionStatus('Submitted');
    showGlassToast.success(
      'Timesheet Submitted',
      `Your timesheet for ${grandTotal} hours has been dispatched to management for sign-off.`
    );
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1500px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              My Timesheet & Work Sessions
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0.2rem 0 0 0'
            }}>
              Log weekly hours across project assignments, track live shift punches, and submit approval cycles.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleSaveDraft}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
            }}
          >
            <Send size={16} />
            Submit Timesheet
          </button>
        </div>
      </div>

      {/* Live Punch Card & Real-time Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Live Punch Clock Widget */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Shift Punch Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: !isClockedIn ? '#94a3b8' : isOnBreak ? '#f59e0b' : '#10b981',
                  boxShadow: isClockedIn && !isOnBreak ? '0 0 10px #10b981' : 'none'
                }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {!isClockedIn ? 'Clocked Out' : isOnBreak ? 'On Break' : 'Active On Duty'}
                </span>
              </div>
            </div>

            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              textAlign: 'right',
              fontFamily: 'monospace'
            }}>
              {currentTime.toLocaleTimeString()}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
              Today's Session Elapsed
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: isClockedIn && !isOnBreak ? 'var(--color-primary)' : 'var(--text-primary)',
              fontFamily: 'monospace',
              letterSpacing: '0.04em'
            }}>
              {formatTimer(sessionSeconds)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handlePunchClock}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isClockedIn ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-primary)',
                color: isClockedIn ? 'var(--color-danger, #ef4444)' : '#ffffff',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              {isClockedIn ? <Square size={15} /> : <Play size={15} />}
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>

            {isClockedIn && (
              <button
                onClick={handleToggleBreak}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                  backgroundColor: isOnBreak ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-app)',
                  color: isOnBreak ? 'var(--color-warning, #f59e0b)' : 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {isOnBreak ? <Play size={15} /> : <Pause size={15} />}
                {isOnBreak ? 'Resume' : 'Take Break'}
              </button>
            )}
          </div>
        </div>

        {/* Weekly Progress KPI Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Weekly Workload Summary
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {grandTotal}
              </span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                / 40.0 hrs target
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target Progress</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
                {Math.min(100, Math.round((parseFloat(grandTotal) / 40) * 100))}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--border-default)'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (parseFloat(grandTotal) / 40) * 100)}%`,
                backgroundColor: 'var(--color-primary)',
                borderRadius: '4px'
              }} />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-default)',
            paddingTop: '0.75rem',
            fontSize: '0.8125rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Billable Ratio: </span>
              <strong style={{ color: 'var(--color-success, #10b981)' }}>89.4%</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Overtime: </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {parseFloat(grandTotal) > 40 ? `+${(parseFloat(grandTotal) - 40).toFixed(1)} hrs` : '0.0 hrs'}
              </strong>
            </div>
          </div>
        </div>

        {/* Timesheet Cycle & State Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Current Submission State
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                backgroundColor: submissionStatus === 'Submitted' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: submissionStatus === 'Submitted' ? 'var(--color-success, #10b981)' : 'var(--color-primary)',
                border: submissionStatus === 'Submitted' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <CheckCircle2 size={15} />
                {submissionStatus === 'Submitted' ? 'Submitted for Approval' : 'Draft in Progress'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              Assigned Approver: <strong>Harsh Saini (Super Admin)</strong>
            </p>
            <p style={{ margin: '0.35rem 0 0 0' }}>
              Payroll Cycle cutoff: <strong>Sunday, 23:59 IST</strong>
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Info size={14} />
            <span>Automated backup sync active</span>
          </div>
        </div>
      </div>

      {/* Timesheet Matrix Table */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Table Top Controls */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '0.2rem'
            }}>
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Week Cycle: Sep 07 – Sep 13, 2026 {weekOffset !== 0 && `(${weekOffset > 0 ? `+${weekOffset}` : weekOffset} wks)`}
            </div>
          </div>

          <button
            onClick={handleAddRow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            Add Project Row
          </button>
        </div>

        {/* Table Matrix */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center'
          }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--bg-app)',
                borderBottom: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                <th style={{ padding: '0.9rem 1.5rem', textAlign: 'left', minWidth: '240px' }}>Project & Assignment</th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px' }}>Mon<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>07</span></th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px' }}>Tue<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>08</span></th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px' }}>Wed<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>09</span></th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px' }}>Thu<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>10</span></th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px' }}>Fri<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>11</span></th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px', color: 'var(--color-warning, #f59e0b)' }}>Sat<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>12</span></th>
                <th style={{ padding: '0.9rem 0.5rem', width: '70px', color: 'var(--color-warning, #f59e0b)' }}>Sun<br/><span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-muted)' }}>13</span></th>
                <th style={{ padding: '0.9rem 1rem', width: '90px' }}>Total</th>
                <th style={{ padding: '0.9rem 1rem', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border-default)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Project Info */}
                  <td style={{ padding: '0.85rem 1.5rem', textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {row.project}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {row.task}
                    </div>
                  </td>

                  {/* Day Inputs */}
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                    <td key={day} style={{ padding: '0.5rem 0.35rem' }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={row[day]}
                        onChange={e => handleHoursChange(row.id, day, e.target.value)}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          backgroundColor: row[day] > 0 ? 'var(--input-bg)' : 'transparent',
                          color: row[day] > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.2rem',
                          fontSize: '0.875rem',
                          fontWeight: row[day] > 0 ? '600' : '400',
                          outline: 'none'
                        }}
                      />
                    </td>
                  ))}

                  {/* Row Total */}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                    {getRowTotal(row)}h
                  </td>

                  {/* Delete */}
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      title="Remove row"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger, #ef4444)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Daily Totals Footer */}
            <tfoot>
              <tr style={{
                backgroundColor: 'var(--bg-app)',
                borderTop: '2px solid var(--border-default)',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>
                  Daily Aggregates
                </td>
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                  <td key={day} style={{ padding: '1rem 0.35rem' }}>
                    {getDayTotal(day)}h
                  </td>
                ))}
                <td style={{ padding: '1rem', color: 'var(--color-primary)', fontSize: '1.05rem', fontWeight: '800' }}>
                  {grandTotal}h
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Historical Cycles Archive */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Past Timesheet Archive
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Previous weekly records processed and approved in payroll.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--bg-app)',
                borderBottom: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Week Period</th>
                <th style={{ padding: '0.85rem 1rem' }}>Regular Hours</th>
                <th style={{ padding: '0.85rem 1rem' }}>Overtime</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Hours</th>
                <th style={{ padding: '0.85rem 1rem' }}>Submitted On</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Approver</th>
              </tr>
            </thead>
            <tbody>
              {PAST_TIMESHEETS.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-default)',
                    fontSize: '0.875rem'
                  }}
                >
                  <td style={{ padding: '0.9rem 1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.cycle}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                    {item.regularHours.toFixed(1)} hrs
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: item.overtime > 0 ? 'var(--color-warning, #f59e0b)' : 'var(--text-muted)' }}>
                    {item.overtime > 0 ? `+${item.overtime.toFixed(1)} hrs` : '0.0 hrs'}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {item.total.toFixed(1)} hrs
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                    {item.submittedOn}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--color-success, #10b981)',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <CheckCircle2 size={13} />
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {item.approvedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
