import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showGlassToast } from '../components/GlassToast';
import {
  CheckSquare,
  Layers,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
  ChevronDown,
  Check,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  Folder,
  X,
  Flame,
  CheckCircle2
} from 'lucide-react';

const INITIAL_MOCK_TASKS = [
  {
    _id: 'task-101',
    title: 'Architect Real-time WebSocket Messaging Protocol',
    description: 'Design zero-packet-drop socket message queue and room multiplexing for cross-team channel communication.',
    status: 'InProgress',
    priority: 'Critical',
    phase: 'Architecture',
    projectName: 'Enterprise Core Suite',
    assigneeName: 'Harsh Saini',
    assigneeRole: 'Super Admin',
    assigneeColor: '#6366f1',
    estimatedHours: 16,
    completedHours: 12,
    dueDate: '2026-09-14'
  },
  {
    _id: 'task-102',
    title: 'Implement Dark & Light Mode Theme Token Matrix',
    description: 'Standardize semantic CSS variables across header, sidebar, dashboard, inventory and project cards.',
    status: 'Completed',
    priority: 'High',
    phase: 'Frontend',
    projectName: 'Enterprise Core Suite',
    assigneeName: 'Rohit Jangra',
    assigneeRole: 'Senior Frontend Engineer',
    assigneeColor: '#38bdf8',
    estimatedHours: 20,
    completedHours: 20,
    dueDate: '2026-09-10'
  },
  {
    _id: 'task-103',
    title: 'Database Schema Optimization & Index Tuning',
    description: 'Add compound indices on project messages and activity log timestamps to reduce query latency by 45%.',
    status: 'InReview',
    priority: 'High',
    phase: 'Database',
    projectName: 'Database Engine',
    assigneeName: 'Kartik Sharma',
    assigneeRole: 'Backend Architect',
    assigneeColor: '#10b981',
    estimatedHours: 14,
    completedHours: 13,
    dueDate: '2026-09-12'
  },
  {
    _id: 'task-104',
    title: 'Design Responsive Mobile Drawer & Micro-Interactions',
    description: 'Polish collapsible navigation drawer transitions, touch-target areas, and glassmorphic button states.',
    status: 'ToDo',
    priority: 'Medium',
    phase: 'UI/UX Design',
    projectName: 'Study Mate Agile',
    assigneeName: 'Priya Verma',
    assigneeRole: 'Lead Product Designer',
    assigneeColor: '#ec4899',
    estimatedHours: 10,
    completedHours: 0,
    dueDate: '2026-09-18'
  },
  {
    _id: 'task-105',
    title: 'Automated CI/CD Pipeline & Zero-Downtime Rollout',
    description: 'Configure multi-stage Docker build cache and rolling container deployment with health-check guards.',
    status: 'InProgress',
    priority: 'Critical',
    phase: 'DevOps',
    projectName: 'Cloud Migration',
    assigneeName: 'Vikram Singh',
    assigneeRole: 'DevOps & Cloud Engineer',
    assigneeColor: '#f59e0b',
    estimatedHours: 18,
    completedHours: 8,
    dueDate: '2026-09-15'
  },
  {
    _id: 'task-106',
    title: 'Executive Compliance & Audit Trail Export',
    description: 'Implement secure cryptographic checksum verification on financial transactions and ledger logs.',
    status: 'ToDo',
    priority: 'Medium',
    phase: 'Security',
    projectName: 'FinTech Ledger',
    assigneeName: 'Harsh Saini',
    assigneeRole: 'Super Admin',
    assigneeColor: '#6366f1',
    estimatedHours: 12,
    completedHours: 0,
    dueDate: '2026-09-22'
  },
  {
    _id: 'task-107',
    title: 'Automate Employee Payroll Tax Deduction Calculator',
    description: 'Implement statutory deductions and progressive tax brackets for quarterly compliance statements.',
    status: 'Completed',
    priority: 'High',
    phase: 'Backend',
    projectName: 'Payroll Suite',
    assigneeName: 'Kartik Sharma',
    assigneeRole: 'Backend Architect',
    assigneeColor: '#10b981',
    estimatedHours: 15,
    completedHours: 15,
    dueDate: '2026-09-08'
  }
];

const COLUMNS = [
  { id: 'ToDo', title: 'To Do', subtitle: 'Planned deliverables', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { id: 'InProgress', title: 'In Progress', subtitle: 'Active sprint execution', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.14)' },
  { id: 'InReview', title: 'In Review', subtitle: 'QA, testing & review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
  { id: 'Completed', title: 'Completed', subtitle: 'Delivered & verified', color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' }
];

const TaskBoard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(INITIAL_MOCK_TASKS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Form State for New Task Modal
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [newTaskPhase, setNewTaskPhase] = useState('Frontend');
  const [newTaskProject, setNewTaskProject] = useState('Enterprise Core Suite');
  const [newTaskAssignee, setNewTaskAssignee] = useState(user?.fullname || 'Harsh Saini');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-09-20');
  const [newTaskHours, setNewTaskHours] = useState(12);

  // Load live tasks from API if available
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tasks');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          // Normalize server tasks
          const mapped = res.data.data.map(t => ({
            _id: t._id,
            title: t.title,
            description: t.description || 'Sprint deliverable item',
            status: t.status === 'done' || t.status === 'completed' ? 'Completed' :
                    t.status === 'in_progress' || t.status === 'in-progress' ? 'InProgress' :
                    t.status === 'review' || t.status === 'in_review' ? 'InReview' : 'ToDo',
            priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
            phase: t.phase || 'General',
            projectName: t.project?.name || 'Enterprise Core Suite',
            assigneeName: t.assignedTo?.user?.fullname || t.assignedTo?.designation || user?.fullname || 'Team Member',
            assigneeRole: t.assignedTo?.designation || 'Software Engineer',
            assigneeColor: '#6366f1',
            estimatedHours: t.estimatedHours || 12,
            completedHours: t.status === 'done' || t.status === 'completed' ? (t.estimatedHours || 12) : 4,
            dueDate: t.dueDate ? t.dueDate.split('T')[0] : '2026-09-25'
          }));
          setTasks(mapped);
        }
      } catch (err) {
        // Fall back gracefully to mock tasks
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = (t.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (t.phase?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (t.projectName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchPriority = selectedPriority === 'All' || t.priority.toLowerCase() === selectedPriority.toLowerCase();
      const matchMy = !filterMyTasks || (t.assigneeName && t.assigneeName.toLowerCase().includes((user?.fullname || '').toLowerCase()));
      return matchSearch && matchPriority && matchMy;
    });
  }, [tasks, searchQuery, selectedPriority, filterMyTasks, user]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'InProgress').length;
    const inReview = tasks.filter(t => t.status === 'InReview').length;
    const critical = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, inReview, critical, completionRate };
  }, [tasks]);

  // Change Task Status
  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    showGlassToast.success('Task Status Updated', `Task moved to ${newStatus}`);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus.toLowerCase() });
    } catch (e) {
      // Optimistic update retained
    }
  };

  // Delete Task
  const handleDeleteTask = (taskId, taskTitle) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    showGlassToast.info('Task Removed', `"${taskTitle}" was deleted.`);
  };

  // Create Task Submit
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const createdTask = {
      _id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDesc || 'Task deliverable item',
      status: 'ToDo',
      priority: newTaskPriority,
      phase: newTaskPhase,
      projectName: newTaskProject,
      assigneeName: newTaskAssignee,
      assigneeRole: 'Project Specialist',
      assigneeColor: '#8b5cf6',
      estimatedHours: Number(newTaskHours) || 8,
      completedHours: 0,
      dueDate: newTaskDueDate
    };

    setTasks(prev => [createdTask, ...prev]);
    setIsNewTaskModalOpen(false);
    showGlassToast.success('Task Created', `"${newTaskTitle}" added to Task Board!`);

    // Reset Form
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskHours(12);

    try {
      await api.post('/tasks', {
        title: createdTask.title,
        description: createdTask.description,
        priority: createdTask.priority.toLowerCase(),
        estimatedHours: createdTask.estimatedHours,
        dueDate: createdTask.dueDate
      });
    } catch (err) {
      // Local state retained
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'High':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'Medium':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}>
              <CheckSquare size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Enterprise Task Board
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Agile sprint task orchestration, status pipelines, and real-time deliverables
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setFilterMyTasks(!filterMyTasks)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: filterMyTasks ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
              border: filterMyTasks ? '1px solid #6366f1' : '1px solid var(--border-default)',
              color: filterMyTasks ? '#818cf8' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 650,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={14} />
            <span>{filterMyTasks ? 'Showing: My Tasks' : 'Filter: My Tasks'}</span>
          </button>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Plus size={15} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Metric 1 */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Tasks</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>{metrics.total}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>{metrics.inProgress}</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>In Review</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>{metrics.inReview}</h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Completed</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>{metrics.completed}</h3>
              <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700 }}>({metrics.completionRate}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-default)'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks by title, phase, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              paddingLeft: '36px',
              paddingRight: '12px',
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Priority Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={12} /> Priority:
          </span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: selectedPriority === p ? '1px solid #6366f1' : '1px solid var(--border-default)',
                backgroundColor: selectedPriority === p ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: selectedPriority === p ? '#818cf8' : 'var(--text-secondary)',
                fontSize: '11.5px',
                fontWeight: selectedPriority === p ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board 4-Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
        gap: '16px',
        alignItems: 'flex-start'
      }}>
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '480px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                  <h4 style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                    {col.title}
                  </h4>
                </div>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: col.color,
                  backgroundColor: col.bg,
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colTasks.map(task => {
                  const pStyle = getPriorityStyle(task.priority);

                  return (
                    <div
                      key={task._id}
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated, var(--bg-app))',
                        border: '1px solid var(--border-default)',
                        borderRadius: '10px',
                        padding: '13px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '9px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                    >
                      {/* Card Top: Phase Tag & Priority Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: '#818cf8',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {task.phase}
                        </span>

                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: pStyle.text,
                          backgroundColor: pStyle.bg,
                          border: pStyle.border,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px', lineHeight: 1.35 }}>
                          {task.title}
                        </h5>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.description}
                        </p>
                      </div>

                      {/* Project reference */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <Folder size={11} style={{ color: '#818cf8' }} />
                        <span>{task.projectName}</span>
                      </div>

                      {/* Card Bottom: Assignee & Move Action */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: '2px'
                      }}>
                        {/* Assignee */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: task.assigneeColor,
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {task.assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 550 }}>
                            {task.assigneeName.split(' ')[0]}
                          </span>
                        </div>

                        {/* Move Column Selector */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          style={{
                            fontSize: '10px',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="ToDo">To Do</option>
                          <option value="InProgress">In Progress</option>
                          <option value="InReview">In Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '11.5px',
                    border: '1px dashed var(--border-default)',
                    borderRadius: '8px'
                  }}>
                    No tasks in {col.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div style={{
            width: '460px',
            maxWidth: '95vw',
            backgroundColor: 'var(--bg-modal)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: 'var(--shadow-popover)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} style={{ color: '#6366f1' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Create New Task
                </h3>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement RBAC token refresh"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description & Deliverable Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, expected test outcomes..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 8px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Phase / Category
                  </label>
                  <select
                    value={newTaskPhase}
                    onChange={(e) => setNewTaskPhase(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 8px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Security">Security</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 8px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '7px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Add to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskBoard;
