import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AIProjectDashboard from './AIProjectDashboard';
import { showGlassToast } from '../components/GlassToast';
import './ProjectsLux.css';
import {
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  Calendar,
  Folder,
  FileText,
  BarChart2,
  Plus,
  Rocket,
  Search,
  Bell,
  Moon,
  Sun,
  Check,
  Star,
  Trash2,
  MoreHorizontal,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings,
  User,
  Users,
  Smile,
  Paperclip,
  AtSign,
  Send,
  Bot,
  X,
  Layers,
  CheckSquare,
  ShieldAlert,
  GraduationCap,
  Activity,
  MessageSquare,
  RefreshCw,
  Code,
  Palette,
  Cloud,
  Database,
  Cpu,
  Server,
  Briefcase,
  Filter,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const Projects = () => {
  const { user, socket, theme, toggleTheme } = useAuth();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const location = useLocation();

  // Project creation permission: only Manager, Admin, and Super Admin can generate projects
  const userRoleStr = (user?.role || '').toLowerCase().trim();
  const canGenerateProject = 
    userRoleStr === 'admin' || 
    userRoleStr === 'manager' || 
    userRoleStr === 'super admin' || 
    userRoleStr === 'superadmin' || 
    userRoleStr === 'sa' || 
    userRoleStr === 's a' ||
    user?.role === 'Admin' ||
    user?.role === 'Manager' ||
    user?.role === 'Super Admin' ||
    !user;

  // Widget boxes wrap / unwrap states (by default only chat box is unwrapped)
  const [isAgendaWrapped, setIsAgendaWrapped] = useState(true);
  const [isActivityWrapped, setIsActivityWrapped] = useState(true);
  const [isDeadlinesWrapped, setIsDeadlinesWrapped] = useState(true);
  const [isChatWrapped, setIsChatWrapped] = useState(false);

  // Live count state for rail icons (only shown when new items/notifications arrive)
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const [newAgendaCount, setNewAgendaCount] = useState(0);
  const [newDeadlinesCount, setNewDeadlinesCount] = useState(0);

  // Board View Kanban boxes wrap / unwrap states (wrapped by default as requested)
  const [wrappedBoardCols, setWrappedBoardCols] = useState({
    todo: true,
    inprogress: true,
    completed: true
  });

  const toggleBoardColWrap = (colId) => {
    setWrappedBoardCols(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  const toggleAllBoardCols = () => {
    const allWrapped = Object.values(wrappedBoardCols).every(Boolean);
    setWrappedBoardCols({
      todo: !allWrapped,
      inprogress: !allWrapped,
      completed: !allWrapped
    });
  };

  // Computed helpers for right-side docked panel wrapping
  const allWidgetsWrapped = isAgendaWrapped && isActivityWrapped && isDeadlinesWrapped;
  const allRightWrapped = allWidgetsWrapped && isChatWrapped;

  const toggleAllRightPanels = () => {
    if (allRightWrapped) {
      setIsAgendaWrapped(false);
      setIsActivityWrapped(false);
      setIsDeadlinesWrapped(false);
      setIsChatWrapped(false);
      setNewMessagesCount(0);
      setNewActivitiesCount(0);
      setNewAgendaCount(0);
      setNewDeadlinesCount(0);
    } else {
      setIsAgendaWrapped(true);
      setIsActivityWrapped(true);
      setIsDeadlinesWrapped(true);
      setIsChatWrapped(true);
    }
  };

  // Navigation and active view tabs
  const [activeTab, setActiveTab] = useState('List View');

  // Selected member filter for List View
  const [selectedMemberFilter, setSelectedMemberFilter] = useState(null);

  // Default team members baseline with simple task headings
  const defaultTeamMembers = [
    {
      id: 'mem-1',
      name: 'Rohit Jangra',
      initials: 'RJ',
      color: '#38bdf8',
      taskHeading: 'Frontend',
      taskScope: 'Responsive Client UI & Web Interface',
      designation: 'Senior Frontend Engineer',
      tagColor: '#38bdf8',
      tagBg: 'rgba(56, 189, 248, 0.15)',
      iconType: 'Code',
      allocationPercent: 100,
      roleInProject: 'Member'
    },
    {
      id: 'mem-2',
      name: 'Kartik Sharma',
      initials: 'KS',
      color: '#818cf8',
      taskHeading: 'Backend',
      taskScope: 'REST APIs, Middleware & Logic Engine',
      designation: 'Backend Architect',
      tagColor: '#818cf8',
      tagBg: 'rgba(99, 102, 241, 0.15)',
      iconType: 'Server',
      allocationPercent: 100,
      roleInProject: 'Member'
    },
    {
      id: 'mem-3',
      name: 'Priya Verma',
      initials: 'PV',
      color: '#ec4899',
      taskHeading: 'Designing',
      taskScope: 'UI/UX Design Systems & High-Fi Prototyping',
      designation: 'Lead Product Designer',
      tagColor: '#ec4899',
      tagBg: 'rgba(236, 72, 153, 0.15)',
      iconType: 'Palette',
      allocationPercent: 80,
      roleInProject: 'Member'
    },
    {
      id: 'mem-4',
      name: 'Vikram Singh',
      initials: 'VS',
      color: '#f97316',
      taskHeading: 'DevOps & Clouds',
      taskScope: 'CI/CD Pipelines, Docker & Cloud Infrastructure',
      designation: 'DevOps & Cloud Engineer',
      tagColor: '#f97316',
      tagBg: 'rgba(249, 115, 22, 0.15)',
      iconType: 'Cloud',
      allocationPercent: 80,
      roleInProject: 'Member'
    },
    {
      id: 'mem-5',
      name: 'Rohit Kumar',
      initials: 'RK',
      color: '#10b981',
      taskHeading: 'Database',
      taskScope: 'Mongoose Schemas, Data Modeling & Indexing',
      designation: 'Senior Developer',
      tagColor: '#10b981',
      tagBg: 'rgba(16, 185, 129, 0.15)',
      iconType: 'Database',
      allocationPercent: 90,
      roleInProject: 'Member'
    },
    {
      id: 'mem-6',
      name: 'Harsh Saini',
      initials: 'HS',
      color: '#a855f7',
      taskHeading: 'Project Lead',
      taskScope: 'Technical Specifications & Architecture',
      designation: 'Super Admin',
      tagColor: '#a855f7',
      tagBg: 'rgba(168, 85, 247, 0.15)',
      iconType: 'GraduationCap',
      allocationPercent: 100,
      roleInProject: 'Manager'
    }
  ];

  // Projects and selection state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeProjectName, setActiveProjectName] = useState('Study Mate');
  const [shufflingProjectId, setShufflingProjectId] = useState(null);
  const [projectMembers, setProjectMembers] = useState(defaultTeamMembers);
  const [employees, setEmployees] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Search and interactive suggestion state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const mainScrollRef = useRef(null);
  const pipelineScrollRef = useRef(null);

  // Notifications popup
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Requirements Review', desc: 'Requirements review task marked complete.', time: '10m ago', unread: true },
    { id: 2, title: 'Sprint Standup', desc: 'Daily project sync scheduled for 10:00 AM.', time: '1h ago', unread: true },
    { id: 3, title: 'Database Migration', desc: 'Core schemas synced with MongoDB Atlas.', time: '2h ago', unread: false }
  ]);

  // Starred tasks stored in local state & localStorage
  const [starredTasks, setStarredTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_starred_tasks');
      return saved ? JSON.parse(saved) : { 'task-1': true, 'task-2': true };
    } catch {
      return { 'task-1': true, 'task-2': true };
    }
  });

  const handleToggleStar = (taskId) => {
    setStarredTasks(prev => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem('erp_starred_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Phase collapsible states
  const [collapsedPhases, setCollapsedPhases] = useState({
    Planning: false,
    Database: false,
    Backend: false,
    Frontend: false,
    Integration: false,
    Testing: false,
    Deployment: false
  });

  const togglePhaseCollapse = (phaseKey) => {
    setCollapsedPhases(prev => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
  };


  // Phase and Tasks dedicated view filtering state
  const [phaseViewFilter, setPhaseViewFilter] = useState('All');
  const [phaseTaskStatusFilter, setPhaseTaskStatusFilter] = useState('all');
  const [clickedStatusId, setClickedStatusId] = useState(null);

  const handleStatusFilterClick = (stId) => {
    setPhaseTaskStatusFilter(stId);
    setClickedStatusId(stId);
    setTimeout(() => {
      setClickedStatusId(null);
    }, 450);
  };

  const [clickedNavBtn, setClickedNavBtn] = useState(null);

  const handlePipelineNavScroll = (direction) => {
    if (pipelineScrollRef.current) {
      const scrollDist = direction === 'left' ? -240 : 240;
      pipelineScrollRef.current.scrollBy({ left: scrollDist, behavior: 'smooth' });
    }
    setClickedNavBtn(direction);
    setTimeout(() => {
      setClickedNavBtn(null);
    }, 450);
  };

  // Tasks state
  const [tasks, setTasks] = useState([]);

  // Activities state
  const [activities, setActivities] = useState([]);

  // Chat messages state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskPhase, setNewTaskPhase] = useState('Planning');
  const [newTaskHours, setNewTaskHours] = useState(16);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Helper for user initials
  const getInitials = (name) => {
    if (!name) return 'HS';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Avatar color generator
  const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Relative time formatter
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const past = new Date(timestamp);
    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  // Map backend task reliably from MongoDB
  const mapBackendTask = (t) => {
    let resolvedName = 'Unassigned';
    if (t.assignedTo && typeof t.assignedTo === 'object') {
      resolvedName = t.assignedTo.user?.fullname || t.assignedTo.designation || 'Harsh Saini';
    } else if (typeof t.assignedTo === 'string') {
      const found = employees.find(e => String(e._id) === String(t.assignedTo));
      if (found) resolvedName = found.user?.fullname || found.designation || 'Harsh Saini';
    } else if (t.assignee) {
      resolvedName = t.assignee;
    }

    const isDone = Boolean(t.isCompleted || t.status === 'Completed');

    // Smart phase resolution: preserve explicit phase, or infer if "General"
    let taskPhase = (t.phase || '').trim();
    if (!taskPhase || taskPhase.toLowerCase() === 'general') {
      const lowerTitle = (t.title || '').toLowerCase();
      if (lowerTitle.includes('spec') || lowerTitle.includes('plan') || lowerTitle.includes('require') || lowerTitle.includes('roadmap')) {
        taskPhase = 'Planning';
      } else if (lowerTitle.includes('architect') || (lowerTitle.includes('design') && lowerTitle.includes('system'))) {
        taskPhase = 'Architecture';
      } else if (lowerTitle.includes('schema') || lowerTitle.includes('database') || lowerTitle.includes('mongo') || lowerTitle.includes('sql') || lowerTitle.includes('model')) {
        taskPhase = 'Database';
      } else if (lowerTitle.includes('backend') || lowerTitle.includes('api') || lowerTitle.includes('server') || lowerTitle.includes('auth') || lowerTitle.includes('controller') || lowerTitle.includes('route')) {
        taskPhase = 'Backend';
      } else if (lowerTitle.includes('frontend') || lowerTitle.includes('ui') || lowerTitle.includes('view') || lowerTitle.includes('client') || lowerTitle.includes('component') || lowerTitle.includes('css')) {
        taskPhase = 'Frontend';
      } else if (lowerTitle.includes('integrat') || lowerTitle.includes('service') || lowerTitle.includes('webhook') || lowerTitle.includes('socket')) {
        taskPhase = 'Integration';
      } else if (lowerTitle.includes('security') || lowerTitle.includes('compliance') || lowerTitle.includes('vault') || lowerTitle.includes('cve') || lowerTitle.includes('owasp')) {
        taskPhase = 'Security';
      } else if (lowerTitle.includes('test') || lowerTitle.includes('qa') || lowerTitle.includes('validat') || lowerTitle.includes('audit')) {
        taskPhase = 'Testing';
      } else if (lowerTitle.includes('devops') || lowerTitle.includes('docker') || lowerTitle.includes('ci/cd') || lowerTitle.includes('infra')) {
        taskPhase = 'DevOps';
      } else if (lowerTitle.includes('deploy') || lowerTitle.includes('release') || lowerTitle.includes('build') || lowerTitle.includes('prod') || lowerTitle.includes('cloud') || lowerTitle.includes('launch')) {
        taskPhase = 'Deployment';
      } else if (lowerTitle.includes('monitor') || lowerTitle.includes('telemetry') || lowerTitle.includes('metric') || lowerTitle.includes('sla')) {
        taskPhase = 'Monitoring';
      } else {
        taskPhase = 'General';
      }
    }

    return {
      _id: String(t._id || 'task-' + Math.random().toString(36).substring(2, 9)),
      title: t.title || 'Untitled Task',
      description: t.description || '',
      phase: taskPhase,
      rawPhase: t.phase || 'General',
      priority: t.priority || 'Medium',
      status: isDone ? 'Completed' : (t.status || 'Pending'),
      isCompleted: isDone,
      rawDueDate: t.dueDate,
      dueDate: t.dueDate
        ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'TBD',
      estimatedHours: t.estimatedHours || 8,
      actualHours: t.actualHours || 0,
      assignedTo: t.assignedTo,
      assignee: resolvedName,
      assigneeInitials: getInitials(resolvedName),
      assigneeColor: getAvatarColor(resolvedName)
    };
  };

  // Default baseline tasks in case DB has no tasks
  const defaultStudyMateTasks = [
    {
      _id: 'task-1',
      title: 'Study Mate Specs & Requirements Review',
      description: 'Document project goals, outline key milestones, and define technical architecture for Study Mate.',
      phase: 'Planning',
      priority: 'Critical',
      status: 'Completed',
      isCompleted: true,
      estimatedHours: 16,
      rawDueDate: new Date(Date.now() + 86400000).toISOString(),
      dueDate: '16 May, 2025',
      assignee: 'Harsh Saini',
      assigneeInitials: 'HS',
      assigneeColor: '#6366f1'
    },
    {
      _id: 'task-2',
      title: 'Study Mate Database & Core Schema Setup',
      description: 'Design database schemas and provision initial collections/tables for the Study Mate engine.',
      phase: 'Database',
      priority: 'Critical',
      status: 'Completed',
      isCompleted: true,
      estimatedHours: 16,
      rawDueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      dueDate: '16 May, 2025',
      assignee: 'Harsh Saini',
      assigneeInitials: 'HS',
      assigneeColor: '#6366f1'
    },
    {
      _id: 'task-3',
      title: 'Initialize Node.js Project & Setup Express',
      description: 'Scaffold Express server, nodemon configs, and standard controller directory structures.',
      phase: 'Backend',
      priority: 'High',
      status: 'Completed',
      isCompleted: true,
      estimatedHours: 8,
      rawDueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      dueDate: '14 May, 2025',
      assignee: 'Harsh Saini',
      assigneeInitials: 'HS',
      assigneeColor: '#6366f1'
    },
    {
      _id: 'task-4',
      title: 'Configure MongoDB Connection & Models',
      description: 'Setup Mongoose connection pooling and core data schemas for users, tasks, and project models.',
      phase: 'Backend',
      priority: 'High',
      status: 'Completed',
      isCompleted: true,
      estimatedHours: 8,
      rawDueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      dueDate: '15 May, 2025',
      assignee: 'Harsh Saini',
      assigneeInitials: 'HS',
      assigneeColor: '#6366f1'
    },
    {
      _id: 'task-5',
      title: 'Implement Authentication & JWT Middleware',
      description: 'Secure API endpoints using JSON Web Token bearer verifications and authorization role guards.',
      phase: 'Backend',
      priority: 'Critical',
      status: 'Completed',
      isCompleted: true,
      estimatedHours: 8,
      rawDueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      dueDate: '16 May, 2025',
      assignee: 'Harsh Saini',
      assigneeInitials: 'HS',
      assigneeColor: '#6366f1'
    }
  ];

  // Default baseline activities in case DB collection is empty
  const defaultActivities = [
    { id: 'act-1', initials: 'HS', color: '#10b981', name: 'Harsh Saini', action: 'completed task', target: 'Study Mate Specs & Requirements Review', time: '10m ago' },
    { id: 'act-2', initials: 'RJ', color: '#3b82f6', name: 'Rohit Jangra', action: 'posted team message', target: 'API endpoints structure', time: '1h ago' },
    { id: 'act-3', initials: 'KS', color: '#f59e0b', name: 'Kartik Sharma', action: 'updated schema', target: 'Task & ActivityLog relationships', time: '3h ago' },
    { id: 'act-4', initials: 'PV', color: '#ec4899', name: 'Priya Verma', action: 'reviewed layout', target: 'Responsive Dashboard UI', time: '5h ago' }
  ];

  // Load Employees and Projects on Mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingProjects(true);
      try {
        // 1. Fetch Employees
        const empRes = await api.get('/employees');
        const empList = empRes.data?.data?.employees || empRes.data?.employees || [];
        setEmployees(empList);
        if (empList.length > 0) {
          setNewTaskAssignee(empList[0]._id);
        }
      } catch (err) {
        console.warn('Employees fetch fallback:', err);
      }

      try {
        // 2. Fetch Projects
        const projRes = await api.get('/projects');
        const projList = projRes.data?.data || projRes.data || [];
        setProjects(projList);

        if (projList.length > 0) {
          // Find "Study Mate" or pick first
          const matched = projList.find(p => p.name?.toLowerCase().includes('study mate')) || projList[0];
          setSelectedProjectId(matched._id);
          setActiveProjectName(matched.name || 'Study Mate');
        } else {
          setSelectedProjectId('proj_studymate');
          setActiveProjectName('Study Mate');
        }
      } catch (err) {
        console.warn('Projects fetch fallback:', err);
        setSelectedProjectId('proj_studymate');
        setActiveProjectName('Study Mate');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch Tasks, Activities, and Messages whenever selectedProjectId changes
  const fetchProjectData = async (projId) => {
    if (!projId || projId === 'proj_studymate') {
      setTasks(defaultStudyMateTasks);
      setActivities(defaultActivities);
      return;
    }

    setIsLoadingTasks(true);

    // 1. Fetch live Project Details from DB to sync latest description, health, and tasks
    let fetchedFromProgress = false;
    try {
      const progRes = await api.get(`/projects/${projId}/progress`);
      const dbProject = progRes.data?.data?.project || progRes.data?.project;
      if (dbProject) {
        setProjects(prev => prev.map(p => String(p._id) === String(projId) ? { ...p, ...dbProject } : p));
      }
      const progTasks = progRes?.data?.data?.tasks || progRes?.data?.tasks;
      if (Array.isArray(progTasks) && progTasks.length > 0) {
        setTasks(progTasks.map(mapBackendTask));
        fetchedFromProgress = true;
      }
    } catch (pErr) {
      console.warn('Project progress sync warning:', pErr);
    }

    // 2. Tasks via dedicated /tasks/project/:projId endpoint
    try {
      const taskRes = await api.get(`/tasks/project/${projId}`);
      const rawTasks = taskRes.data?.data?.tasks || taskRes.data?.tasks || [];
      if (Array.isArray(rawTasks) && rawTasks.length > 0) {
        setTasks(rawTasks.map(mapBackendTask));
      } else if (!fetchedFromProgress) {
        // Project in DB genuinely has 0 tasks: show clean empty state
        setTasks([]);
      }
    } catch (err) {
      console.warn('Tasks fetch error:', err);
      if (!fetchedFromProgress) {
        setTasks([]);
      }
    } finally {
      setIsLoadingTasks(false);
    }

    // 2. Activities
    try {
      const actRes = await api.get(`/projects/${projId}/activity`);
      const rawActs = actRes.data?.data || actRes.data || [];
      if (Array.isArray(rawActs) && rawActs.length > 0) {
        const mapped = rawActs.map(a => {
          const actorName = a.actor?.user?.fullname || a.actor?.designation || 'Team Member';
          return {
            id: a._id,
            name: actorName,
            initials: getInitials(actorName),
            color: getAvatarColor(actorName),
            action: a.action || 'updated project item',
            target: a.entityType ? `${a.entityType} item` : 'project',
            time: formatRelativeTime(a.timestamp || a.createdAt)
          };
        });
        setActivities(mapped);
      } else {
        setActivities(defaultActivities);
      }
    } catch (err) {
      console.warn('Activities fetch error, using defaults:', err);
      setActivities(defaultActivities);
    }

    // 3. Messages
    try {
      const msgRes = await api.get(`/projects/${projId}/messages`);
      const rawMsgs = msgRes.data?.data || msgRes.data || [];
      if (Array.isArray(rawMsgs) && rawMsgs.length > 0) {
        const mapped = rawMsgs.map(m => {
          const senderName = m.sender?.user?.fullname || m.sender?.designation || 'Team Member';
          const isMe = user && (m.sender?.user?._id === user._id || m.sender?.user?.email === user.email || senderName === user.fullname);
          return {
            id: m._id,
            sender: senderName,
            initials: getInitials(senderName),
            color: getAvatarColor(senderName),
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            text: m.message,
            reactions: m.reactions || [],
            isSelf: Boolean(isMe)
          };
        });
        setChatMessages(mapped);
      } else {
        setChatMessages([
          {
            id: 'm-1',
            sender: 'Harsh Saini',
            initials: 'HS',
            color: '#6366f1',
            time: '10:02 AM',
            text: "Hey team! Let's finalize the API structure and database schemas today.",
            reactions: [{ emoji: '👍', count: 2, reacted: true }],
            isSelf: false
          },
          {
            id: 'm-2',
            sender: 'Rohit Jangra',
            initials: 'RJ',
            color: '#3b82f6',
            time: '10:04 AM',
            text: "Sure! I'll share the draft endpoints and UI layout soon.",
            reactions: [{ emoji: '👍', count: 1, reacted: false }],
            isSelf: false
          },
          {
            id: 'm-3',
            sender: 'Kartik Sharma',
            initials: 'KS',
            color: '#f59e0b',
            time: '10:05 AM',
            text: "Working on database relationships and auth guards. Will update in a bit.",
            reactions: [{ emoji: '👍', count: 1, reacted: false }],
            isSelf: false
          },
          {
            id: 'm-4',
            sender: 'Priya Verma',
            initials: 'PV',
            color: '#ec4899',
            time: '10:08 AM',
            text: "I have finished the responsive specs. Let's sync in standup 👍",
            reactions: [],
            isSelf: false
          }
        ]);
      }
    } catch (err) {
      console.warn('Messages fetch error, using defaults:', err);
    }

    // 4. Project Members & Assigned Domains
    try {
      const memberRes = await api.get(`/projects/${projId}/members`);
      const rawMembers = memberRes.data?.members || memberRes.data?.data || [];
      if (Array.isArray(rawMembers) && rawMembers.length > 0) {
        const mappedMembers = rawMembers.map(m => {
          const emp = m.employee || {};
          const empName = emp.user?.fullname || emp.name || emp.designation || 'Team Member';
          const desig = (emp.designation || '').toLowerCase();

          let taskHeading = 'Fullstack';
          let iconType = 'Code';
          let tagColor = '#3b82f6';
          let tagBg = 'rgba(59, 130, 246, 0.15)';
          let taskScope = 'Application engineering & core features';

          if (desig.includes('frontend') || desig.includes('ui') || desig.includes('web')) {
            taskHeading = 'Frontend';
            iconType = 'Code';
            tagColor = '#38bdf8';
            tagBg = 'rgba(56, 189, 248, 0.15)';
            taskScope = 'Responsive Client UI & Web Interface';
          } else if (desig.includes('backend') || desig.includes('architect') || desig.includes('api')) {
            taskHeading = 'Backend';
            iconType = 'Server';
            tagColor = '#818cf8';
            tagBg = 'rgba(99, 102, 241, 0.15)';
            taskScope = 'REST APIs, Middleware & Logic Engine';
          } else if (desig.includes('design') || desig.includes('product') || desig.includes('ux')) {
            taskHeading = 'Designing';
            iconType = 'Palette';
            tagColor = '#ec4899';
            tagBg = 'rgba(236, 72, 153, 0.15)';
            taskScope = 'UI/UX Design Systems & Prototyping';
          } else if (desig.includes('devops') || desig.includes('ci')) {
            taskHeading = 'DevOps';
            iconType = 'Cpu';
            tagColor = '#f97316';
            tagBg = 'rgba(249, 115, 22, 0.15)';
            taskScope = 'CI/CD Pipelines, Docker & Deployment';
          } else if (desig.includes('cloud') || desig.includes('aws') || desig.includes('infra')) {
            taskHeading = 'Clouds';
            iconType = 'Cloud';
            tagColor = '#06b6d4';
            tagBg = 'rgba(6, 182, 212, 0.15)';
            taskScope = 'Cloud Infrastructure & Clustering';
          } else if (desig.includes('database') || desig.includes('data') || desig.includes('sql') || desig.includes('mongo')) {
            taskHeading = 'Database';
            iconType = 'Database';
            tagColor = '#10b981';
            tagBg = 'rgba(16, 185, 129, 0.15)';
            taskScope = 'Schemas, Data Modeling & Indexing';
          } else if (desig.includes('admin') || desig.includes('super') || m.roleInProject === 'Manager') {
            taskHeading = 'Project Lead';
            iconType = 'GraduationCap';
            tagColor = '#a855f7';
            tagBg = 'rgba(168, 85, 247, 0.15)';
            taskScope = 'Technical Specifications & Architecture';
          }

          return {
            id: m.memberId || emp._id || String(Math.random()),
            empId: emp._id,
            name: empName,
            initials: getInitials(empName),
            color: getAvatarColor(empName),
            designation: emp.designation || 'Specialist',
            taskHeading,
            taskScope,
            tagColor,
            tagBg,
            iconType,
            roleInProject: m.roleInProject || 'Member',
            allocationPercent: m.allocationPercent || 100
          };
        });
        setProjectMembers(mappedMembers);
      } else {
        setProjectMembers(defaultTeamMembers);
      }
    } catch (err) {
      console.warn('Members fetch error, using defaults:', err);
      setProjectMembers(defaultTeamMembers);
    }
  };

  // Helper to smoothly shift the main view, sidebar list, and window to the top
  const scrollToTop = () => {
    const doScroll = (behavior = 'smooth') => {
      try {
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTo({ top: 0, behavior });
        }
        const sidebarContainer = document.getElementById('sidebar-projects-container');
        if (sidebarContainer) {
          sidebarContainer.scrollTo({ top: 0, behavior });
        }
        window.scrollTo({ top: 0, behavior });
      } catch {
        if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
        const sidebarContainer = document.getElementById('sidebar-projects-container');
        if (sidebarContainer) sidebarContainer.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    };

    doScroll('smooth');
    requestAnimationFrame(() => doScroll('smooth'));
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectData(selectedProjectId);
      scrollToTop();
    }
  }, [selectedProjectId]);

  // Socket.io Real-time Message & Task Updates
  useEffect(() => {
    if (!socket || !selectedProjectId) return;

    socket.emit('project:join', selectedProjectId);

    const handleNewMessage = (newMsg) => {
      const senderName = newMsg.sender?.user?.fullname || newMsg.sender?.designation || 'Team Member';
      const isMe = user && (newMsg.sender?.user?._id === user._id || senderName === user.fullname);
      setChatMessages(prev => [
        ...prev,
        {
          id: newMsg._id || Date.now(),
          sender: senderName,
          initials: getInitials(senderName),
          color: getAvatarColor(senderName),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: newMsg.message,
          reactions: [],
          isSelf: Boolean(isMe)
        }
      ]);

      // If message is incoming from another user or chat is wrapped, live increment exact unread count
      if (!isMe || isChatWrapped) {
        setNewMessagesCount(prev => prev + 1);
      }

      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    };

    const handleTaskUpdate = () => {
      fetchProjectData(selectedProjectId);
      if (isActivityWrapped) {
        setNewActivitiesCount(prev => prev + 1);
      }
    };

    const handleNewNotification = (notif) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          title: notif.title || 'Project Notification',
          desc: notif.message || notif.desc || 'New project activity logged.',
          time: 'Just now',
          unread: true
        },
        ...prev
      ]);
      if (isActivityWrapped) {
        setNewActivitiesCount(prev => prev + 1);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('task:update', handleTaskUpdate);
    socket.on('notification:new', handleNewNotification);
    socket.on('activity:new', () => {
      if (isActivityWrapped) setNewActivitiesCount(prev => prev + 1);
    });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('task:update', handleTaskUpdate);
      socket.off('notification:new', handleNewNotification);
      socket.off('activity:new');
      socket.emit('project:leave', selectedProjectId);
    };
  }, [socket, selectedProjectId, user, isChatWrapped, isActivityWrapped]);

  // Handle Task Completion Toggle
  const handleToggleTask = async (taskId, currentCompleted) => {
    const nextVal = !currentCompleted;
    setTasks(prev => prev.map(t => t._id === taskId ? {
      ...t,
      isCompleted: nextVal,
      status: nextVal ? 'Completed' : 'In Progress'
    } : t));

    // Optimistically update recent activities
    const taskObj = tasks.find(t => t._id === taskId);
    if (taskObj) {
      setActivities(prev => [
        {
          id: 'act-' + Date.now(),
          initials: getInitials(user?.fullname || 'Harsh Saini'),
          color: '#10b981',
          name: user?.fullname || 'Harsh Saini',
          action: nextVal ? 'completed task' : 're-opened task',
          target: taskObj.title,
          time: 'Just now'
        },
        ...prev.slice(0, 7)
      ]);
    }

    if (nextVal) {
      showGlassToast.success('Task Completed', `"${taskObj?.title || 'Deliverable'}" marked as completed.`);
    } else {
      showGlassToast.info('Task Re-opened', `"${taskObj?.title || 'Deliverable'}" moved back to In Progress.`);
    }

    try {
      await api.patch(`/projects/tasks/${taskId}/completion`, { isCompleted: nextVal });
      await api.put(`/tasks/${taskId}/status`, { status: nextVal ? 'Completed' : 'In Progress' });
    } catch (err) {
      console.warn('Task toggle API sync:', err);
    }
  };

  // Handle Task Delete
  const handleDeleteTask = async (taskId) => {
    const taskObj = tasks.find(t => t._id === taskId);
    const taskName = taskObj?.title || 'this task';
    if (!window.confirm(`Are you sure you want to delete "${taskName}"?`)) return;
    setTasks(prev => prev.filter(t => t._id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
      showGlassToast.info('Task Deleted', `"${taskName}" removed from project.`);
    } catch (err) {
      console.warn('Delete task API fallback:', err);
      showGlassToast.info('Task Deleted', `"${taskName}" removed in offline mode.`);
    }
  };

  // Handle Create Task Form Submission
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmittingTask(true);
    const assignedEmp = employees.find(e => String(e._id) === String(newTaskAssignee));
    const assigneeName = assignedEmp?.user?.fullname || assignedEmp?.designation || user?.fullname || 'Harsh Saini';

    const optimisticTask = {
      _id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Deliverable implementation.',
      phase: newTaskPhase,
      priority: newTaskPriority,
      status: 'Pending',
      isCompleted: false,
      estimatedHours: Number(newTaskHours) || 16,
      rawDueDate: newTaskDueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      dueDate: newTaskDueDate
        ? new Date(newTaskDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '22 May, 2025',
      assignedTo: assignedEmp || { user: { fullname: assigneeName } },
      assignee: assigneeName,
      assigneeInitials: getInitials(assigneeName),
      assigneeColor: getAvatarColor(assigneeName)
    };

    setTasks(prev => [optimisticTask, ...prev]);
    setIsTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');

    try {
      await api.post('/tasks', {
        project: selectedProjectId !== 'proj_studymate' ? selectedProjectId : undefined,
        assignedTo: newTaskAssignee || employees[0]?._id,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        estimatedHours: Number(newTaskHours) || 16,
        priority: newTaskPriority,
        phase: newTaskPhase,
        dueDate: newTaskDueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'Pending'
      });
      showGlassToast.success('Deliverable Created', `Task "${newTaskTitle}" added to the Kanban board.`);
      // Re-fetch project tasks to sync official DB IDs
      if (selectedProjectId && selectedProjectId !== 'proj_studymate') {
        fetchProjectData(selectedProjectId);
      }
    } catch (err) {
      console.warn('Task create API fallback:', err);
      showGlassToast.info('Task Notice', 'Task recorded on board in offline mode.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Handle Generate Project & AI Tasks Form Submission
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.projName.value;
    if (!name.trim()) return;

    setIsSubmittingProject(true);
    try {
      const creatorFullName = user?.fullname || 'Harsh Saini';
      const creatorRole = user?.role || 'Super Admin';

      const payload = {
        name: name.trim(),
        description: form.projDesc?.value || 'Enterprise collaborative system delivery.',
        category: form.projCategory?.value || 'General',
        architecture: form.projArchitecture?.value || 'Modular Microservices Architecture',
        targetCloud: form.projTargetCloud?.value || 'Multi-Region High-Availability Cloud',
        priority: form.projPriority?.value || 'High',
        startDate: form.projStartDate?.value || new Date().toISOString().split('T')[0],
        deadline: form.projDeadline?.value || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        creatorName: creatorFullName,
        creatorRole: creatorRole
      };

      const res = await api.post('/projects', payload);
      const newProj = res.data?.project || res.data?.data || res.data;

      if (newProj && newProj._id) {
        // Auto-synthesize multi-phase tasks and architectural blueprint right away!
        try {
          await api.post(`/projects/${newProj._id}/ai/analyze`);
        } catch (aiErr) {
          console.warn('Auto AI task generation notification:', aiErr);
        }

        const initializedProj = {
          ...newProj,
          actualProgress: 0,
          progress: 0,
          totalTasks: 0,
          completedTasks: 0
        };
        setProjects(prev => [initializedProj, ...prev]);
        setSelectedProjectId(newProj._id);
        setActiveProjectName(newProj.name);

        showGlassToast.success(
          'Project Generated Successfully',
          `"${newProj.name}" created with AI architecture blueprint and 11-phase deliverables.`
        );

        // Direct immediately to AI Planner view with the newly generated project loaded
        setActiveTab('AI Planner');
      }
      setIsProjectModalOpen(false);
    } catch (err) {
      console.warn('Project create API fallback:', err);
      const fallbackProj = {
        _id: 'proj_' + Date.now(),
        name: name.trim(),
        status: 'Active',
        actualProgress: 0,
        progress: 0,
        totalTasks: 0,
        completedTasks: 0,
        description: form.projDesc?.value || 'New Enterprise Project',
        creatorName: user?.fullname || 'Harsh Saini',
        creatorRole: user?.role || 'Super Admin'
      };
      setProjects(prev => [fallbackProj, ...prev]);
      setSelectedProjectId(fallbackProj._id);
      setActiveProjectName(fallbackProj.name);
      setActiveTab('AI Planner');
      setIsProjectModalOpen(false);
      showGlassToast.info('Project Created', `"${fallbackProj.name}" initialized in offline mode.`);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // Handle Send Chat Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const textToSend = chatInput.trim();
    const optimisticMsg = {
      id: 'msg-' + Date.now(),
      sender: user?.fullname || 'Harsh Saini',
      initials: getInitials(user?.fullname || 'Harsh Saini'),
      color: '#6366f1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
      reactions: [],
      isSelf: true
    };

    setChatMessages(prev => [...prev, optimisticMsg]);
    setChatInput('');
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);

    if (selectedProjectId && selectedProjectId !== 'proj_studymate') {
      try {
        await api.post(`/projects/${selectedProjectId}/messages`, {
          message: textToSend,
          mentions: []
        });
      } catch (err) {
        console.warn('Send message API sync error:', err);
      }
    }
  };

  // Handle Reaction Click
  const handleReactionClick = (msgId, emojiStr) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const existing = (m.reactions || []).find(r => r.emoji === emojiStr);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map(r => r.emoji === emojiStr ? {
              ...r,
              count: r.reacted ? r.count - 1 : r.count + 1,
              reacted: !r.reacted
            } : r).filter(r => r.count > 0)
          };
        } else {
          return {
            ...m,
            reactions: [...(m.reactions || []), { emoji: emojiStr, count: 1, reacted: true }]
          };
        }
      }
      return m;
    }));
  };

  // Keyboard shortcut for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Tasks based on search query & selected team member filter
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.phase || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignee || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMember = !selectedMemberFilter ||
        (t.assignee && t.assignee.toLowerCase().includes(selectedMemberFilter.toLowerCase()));

      return matchesSearch && matchesMember;
    });
  }, [tasks, searchQuery, selectedMemberFilter]);

  // Compute Stat Metrics Dynamically from live tasks
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted || t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress' && !t.isCompleted).length;
    const overdue = tasks.filter(t => {
      if (t.isCompleted || t.status === 'Completed') return false;
      if (!t.rawDueDate && !t.dueDate) return false;
      const d = new Date(t.rawDueDate || t.dueDate);
      return !isNaN(d) && d < new Date();
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgressRate = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate,
      inProgressRate,
      overdueRate
    };
  }, [tasks]);

  // Live sync of active project's exact completion rate into projects list
  useEffect(() => {
    if (typeof metrics.completionRate === 'number' && (selectedProjectId || activeProjectName)) {
      setProjects(prev => {
        let hasChanges = false;
        const updated = prev.map(p => {
          const isMatch = (selectedProjectId && String(p._id) === String(selectedProjectId)) ||
            (activeProjectName && String(p.name).trim().toLowerCase() === String(activeProjectName).trim().toLowerCase());
          if (isMatch && (p.actualProgress !== metrics.completionRate || p.progress !== metrics.completionRate || p.completedTasks !== metrics.completed || p.totalTasks !== metrics.total)) {
            hasChanges = true;
            return {
              ...p,
              actualProgress: metrics.completionRate,
              progress: metrics.completionRate,
              completedTasks: metrics.completed,
              totalTasks: metrics.total
            };
          }
          return p;
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [metrics.completionRate, metrics.completed, metrics.total, selectedProjectId, activeProjectName]);

  // Upcoming Deadlines derived from incomplete tasks sorted by due date
  const upcomingDeadlines = useMemo(() => {
    const pendingTasks = tasks.filter(t => !t.isCompleted && t.status !== 'Completed');
    const sorted = [...pendingTasks].sort((a, b) => {
      const dateA = a.rawDueDate ? new Date(a.rawDueDate).getTime() : Infinity;
      const dateB = b.rawDueDate ? new Date(b.rawDueDate).getTime() : Infinity;
      return dateA - dateB;
    });

    return sorted.slice(0, 5).map((t, idx) => {
      const colors = ['#ef4444', '#f97316', '#10b981', '#3b82f6'];
      return {
        id: t._id,
        title: t.title,
        date: t.dueDate,
        dotColor: colors[idx % colors.length]
      };
    });
  }, [tasks]);

  // Today's Agenda derived from tasks due today or scheduled syncs
  const todayAgendaItems = useMemo(() => {
    const activeSprintItems = tasks.slice(0, 3).map((t, i) => ({
      time: ['10:00', '11:30', '02:00'][i],
      title: t.title,
      desc: t.phase + ' • ' + t.assignee
    }));

    return activeSprintItems.length > 0 ? activeSprintItems : [
      { time: '10:00', title: 'Team Standup', desc: 'Daily sync meeting' },
      { time: '11:30', title: 'Project Discussion', desc: 'Study Mate roadmap' },
      { time: '02:00', title: 'Code Review', desc: 'Backend API review' }
    ];
  }, [tasks]);

  // Group filtered tasks by phase dynamically directly from database tasks
  const phaseGroups = useMemo(() => {
    const standardPhases = ['Planning', 'Database', 'Backend', 'Frontend', 'Integration', 'Testing', 'Deployment'];
    const presentPhases = [...new Set(filteredTasks.map(t => t.phase).filter(Boolean))];
    const combinedPhases = [...standardPhases];
    presentPhases.forEach(p => {
      if (!combinedPhases.some(cp => cp.toLowerCase() === p.toLowerCase())) {
        combinedPhases.push(p);
      }
    });

    const groups = {};
    combinedPhases.forEach(p => { groups[p] = []; });

    filteredTasks.forEach(task => {
      const p = task.phase || 'General';
      const matched = combinedPhases.find(cp => cp.toLowerCase() === p.toLowerCase()) || p;
      if (!groups[matched]) groups[matched] = [];
      groups[matched].push(task);
    });

    // Only phases that genuinely have tasks in this project
    const activePhases = Object.keys(groups).filter(p => groups[p].length > 0);
    return activePhases.map(phaseName => ({
      name: phaseName,
      tasks: groups[phaseName],
      completedCount: groups[phaseName].filter(t => t.isCompleted).length,
      totalCount: groups[phaseName].length,
      progress: Math.round((groups[phaseName].filter(t => t.isCompleted).length / groups[phaseName].length) * 100)
    }));
  }, [filteredTasks]);

  // Phase metadata (Titles, Icons, Colors)
  const getPhaseMeta = (phaseName) => {
    switch ((phaseName || '').toLowerCase()) {
      case 'planning':
        return { title: 'PROJECT SETUP & SPECIFICATIONS', icon: Folder, color: '#818cf8' };
      case 'architecture':
        return { title: 'SYSTEM ARCHITECTURE & THREAT MODEL', icon: Code, color: '#a855f7' };
      case 'database':
        return { title: 'DATABASE SCHEMAS & CONFIGURATION', icon: Database, color: '#10b981' };
      case 'backend':
        return { title: 'CORE REST API BACKEND DEVELOPMENT', icon: Server, color: '#818cf8' };
      case 'frontend':
        return { title: 'RESPONSIVE FRONTEND & CLIENT UI', icon: LayoutGrid, color: '#38bdf8' };
      case 'integration':
        return { title: 'INTEGRATIONS & THIRD-PARTY SERVICES', icon: Layers, color: '#a855f7' };
      case 'security':
        return { title: 'SECURITY HARDENING & COMPLIANCE', icon: ShieldAlert, color: '#ef4444' };
      case 'testing':
        return { title: 'QUALITY ASSURANCE & TESTING', icon: CheckSquare, color: '#10b981' };
      case 'devops':
        return { title: 'DEVOPS, CI/CD & CLOUD INFRASTRUCTURE', icon: Cpu, color: '#f97316' };
      case 'deployment':
        return { title: 'DEPLOYMENT & CLOUD RELEASE', icon: Rocket, color: '#f59e0b' };
      case 'monitoring':
        return { title: 'MONITORING, TELEMETRY & SLA', icon: Activity, color: '#06b6d4' };
      case 'general':
        return { title: 'GENERAL PROJECT DELIVERABLES', icon: Briefcase, color: '#38bdf8' };
      default:
        return { title: `${(phaseName || 'General').toUpperCase()} DELIVERABLES`, icon: Folder, color: '#818cf8' };
    }
  };

  // Priority color helper
  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  // Projects list for left sidebar (Live from DB) - open project is always included and prioritized
  const sidebarProjectsList = useMemo(() => {
    if (projects.length === 0) {
      const liveRate = typeof metrics.completionRate === 'number' ? metrics.completionRate : 0;
      return [
        { id: selectedProjectId || 'proj_studymate', name: activeProjectName || 'Study Mate', progress: liveRate, iconColor: '#3b82f6' }
      ];
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];
    
    // Find the currently open / active project
    const activeProj = projects.find(p => 
      (selectedProjectId && String(p._id) === String(selectedProjectId)) ||
      (activeProjectName && String(p.name).trim().toLowerCase() === String(activeProjectName).trim().toLowerCase())
    );

    // Other projects excluding the active project
    const otherProjs = projects.filter(p => p !== activeProj);

    // Ensure the currently open project is ALWAYS included first in the sidebar
    const orderedList = activeProj ? [activeProj, ...otherProjs] : projects;

    return orderedList.slice(0, 10).map((p, idx) => {
      const isCurrent = Boolean(
        (selectedProjectId && String(p._id) === String(selectedProjectId)) ||
        (activeProjectName && String(p.name).trim().toLowerCase() === String(activeProjectName).trim().toLowerCase())
      );

      // EXACT percentage of project progression
      let exactProg = 0;
      if (isCurrent) {
        if (typeof metrics.completionRate === 'number') {
          exactProg = metrics.completionRate;
        } else if (typeof p.actualProgress === 'number') {
          exactProg = p.actualProgress;
        } else if (typeof p.progress === 'number') {
          exactProg = p.progress;
        }
      } else {
        if (typeof p.actualProgress === 'number') {
          exactProg = p.actualProgress;
        } else if (typeof p.progress === 'number') {
          exactProg = p.progress;
        }
      }

      exactProg = Math.max(0, Math.min(100, Math.round(exactProg)));

      return {
        id: p._id,
        name: p.name,
        progress: exactProg,
        iconColor: colors[idx % colors.length]
      };
    });
  }, [projects, selectedProjectId, activeProjectName, metrics.completionRate]);

  // Selected project object with rich bio / description
  const currentProject = useMemo(() => {
    const found = projects.find(p => 
      (selectedProjectId && String(p._id) === String(selectedProjectId)) ||
      (activeProjectName && String(p.name).trim().toLowerCase() === String(activeProjectName).trim().toLowerCase())
    );

    if (found) {
      const hasDesc = found.description && found.description.trim().length > 0;
      const managerName = found.manager?.user?.fullname || found.manager?.designation || 'Harsh Saini';
      return {
        ...found,
        description: hasDesc 
          ? found.description 
          : `${found.name} is an active collaborative enterprise deliverable focused on scalable system architecture, cross-functional sprints, automated phase deliverables, and seamless team workflows.`,
        category: found.category || 'Agile Development Sprint',
        healthStatus: found.healthStatus || 'On-Track',
        status: found.status || 'Active',
        priority: found.priority || 'Medium',
        managerName,
        managerInitials: getInitials(managerName),
        startDateFormatted: found.startDate ? new Date(found.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Mar, 2025',
        deadlineFormatted: found.deadline ? new Date(found.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Jun, 2025'
      };
    }

    return {
      _id: selectedProjectId || 'proj_studymate',
      name: activeProjectName || 'Study Mate',
      description: 'Study Mate is an intelligent collaborative enterprise workspace designed to streamline agile sprint planning, automated phase deliverables, role-based member task allocations, and real-time project status monitoring with integrated AI assistance.',
      category: 'Enterprise EdTech / Agile Workflow',
      healthStatus: 'On-Track',
      status: 'Active',
      priority: 'High',
      managerName: 'Harsh Saini',
      managerInitials: 'HS',
      startDateFormatted: '01 Mar, 2025',
      deadlineFormatted: '30 Jun, 2025'
    };
  }, [projects, selectedProjectId, activeProjectName]);

  // All structured lifecycle phases for the dedicated Phase and Tasks workstation
  // STRICTLY shows only phases that are genuinely present in the project's actual tasks
  const allLifecyclePhases = useMemo(() => {
    const standardOrder = [
      'Planning', 'Architecture', 'Database', 'Backend', 'Frontend',
      'Integration', 'Security', 'Testing', 'DevOps', 'Deployment', 'Monitoring'
    ];
    
    // 1. Group tasks by their actual phase from DB
    const groups = {};
    filteredTasks.forEach(task => {
      const p = (task.phase || 'General').trim();
      if (!groups[p]) groups[p] = [];
      groups[p].push(task);
    });

    // 2. STRICTLY only keep phases that actually have tasks present in this project (> 0)
    const presentPhases = Object.keys(groups).filter(pName => groups[pName].length > 0);

    // 3. Sort present phases: standard lifecycle order first, then custom/General phases
    presentPhases.sort((a, b) => {
      const idxA = standardOrder.findIndex(s => s.toLowerCase() === a.toLowerCase());
      const idxB = standardOrder.findIndex(s => s.toLowerCase() === b.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return presentPhases.map((phaseName, idx) => {
      const pTasks = groups[phaseName] || [];
      const completed = pTasks.filter(t => t.isCompleted).length;
      const total = pTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      let status = 'Pending';
      if (total > 0 && completed === total) status = 'Completed';
      else if (total > 0 && completed > 0) status = 'In Progress';
      else if (total > 0) status = 'In Progress';

      return {
        name: phaseName,
        stepNumber: idx + 1,
        tasks: pTasks,
        completedCount: completed,
        totalCount: total,
        progress,
        status
      };
    });
  }, [filteredTasks]);

  // Reset phase view filter if currently selected filter is not present in the active project
  useEffect(() => {
    if (phaseViewFilter !== 'All') {
      const exists = allLifecyclePhases.some(p => p.name.toLowerCase() === phaseViewFilter.toLowerCase());
      if (!exists) {
        setPhaseViewFilter('All');
      }
    }
  }, [allLifecyclePhases, phaseViewFilter]);

  // Horizontal mouse-wheel scroll when hovering over the Development Lifecycle Pipeline ribbon
  useEffect(() => {
    const el = pipelineScrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      // If pipeline cards overflow horizontally
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.15;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [activeTab, allLifecyclePhases]);

  // Filtered lifecycle phases for display
  const displayedLifecyclePhases = useMemo(() => {
    if (phaseViewFilter === 'All') {
      return allLifecyclePhases;
    }
    return allLifecyclePhases.filter(p => p.name.toLowerCase() === phaseViewFilter.toLowerCase());
  }, [allLifecyclePhases, phaseViewFilter]);

  // "My Other Projects" bottom cards
  const otherProjectsCards = useMemo(() => {
    const filtered = projects.filter(p => 
      String(p._id) !== String(selectedProjectId) && 
      (!activeProjectName || String(p.name).trim().toLowerCase() !== String(activeProjectName).trim().toLowerCase())
    );
    if (filtered.length >= 2) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7'];
      return filtered.slice(0, 4).map((p, idx) => {
        const exactProg = Math.max(0, Math.min(100, Math.round(
          typeof p.actualProgress === 'number' ? p.actualProgress : (typeof p.progress === 'number' ? p.progress : 0)
        )));
        const total = typeof p.totalTasks === 'number' && p.totalTasks > 0 ? p.totalTasks : (p.totalCount || 10);
        const completed = typeof p.completedTasks === 'number' ? p.completedTasks : Math.round((exactProg / 100) * total);

        return {
          id: p._id,
          name: p.name,
          status: p.status || (exactProg === 100 ? 'Completed' : 'In Progress'),
          statusColor: colors[idx % colors.length],
          statusBg: `${colors[idx % colors.length]}22`,
          progress: exactProg,
          completedCount: completed,
          totalCount: total,
          avatars: [
            { initials: 'HS', color: '#6366f1' },
            { initials: 'RJ', color: '#10b981' },
            { initials: 'KS', color: '#f59e0b' }
          ],
          extraCount: 2
        };
      });
    }

    // Default rich baseline matching design
    return [
      {
        id: 'lms',
        name: 'LMS Platform',
        status: 'In Progress',
        statusColor: '#3b82f6',
        statusBg: 'rgba(59, 130, 246, 0.15)',
        progress: 62,
        completedCount: 45,
        totalCount: 72,
        avatars: [
          { initials: 'RK', color: '#6366f1' },
          { initials: 'SP', color: '#10b981' },
          { initials: 'AN', color: '#f59e0b' }
        ],
        extraCount: 4
      },
      {
        id: 'inv',
        name: 'Inventory System',
        status: 'In Progress',
        statusColor: '#10b981',
        statusBg: 'rgba(16, 185, 129, 0.15)',
        progress: 45,
        completedCount: 23,
        totalCount: 51,
        avatars: [
          { initials: 'HS', color: '#8b5cf6' },
          { initials: 'AV', color: '#06b6d4' }
        ],
        extraCount: 2
      },
      {
        id: 'hr',
        name: 'HR Management',
        status: 'In Progress',
        statusColor: '#f59e0b',
        statusBg: 'rgba(245, 158, 11, 0.15)',
        progress: 30,
        completedCount: 18,
        totalCount: 60,
        avatars: [
          { initials: 'PS', color: '#ec4899' },
          { initials: 'NS', color: '#f97316' }
        ],
        extraCount: 3
      },
      {
        id: 'ecom',
        name: 'E-Commerce App',
        status: 'Planning',
        statusColor: '#a855f7',
        statusBg: 'rgba(168, 85, 247, 0.15)',
        progress: 20,
        completedCount: 12,
        totalCount: 62,
        avatars: [
          { initials: 'KS', color: '#3b82f6' },
          { initials: 'VS', color: '#10b981' }
        ],
        extraCount: 5
      }
    ];
  }, [projects, selectedProjectId]);

  // Filtered members in List View by search query
  const displayedMembers = useMemo(() => {
    if (!searchQuery) return projectMembers;
    const q = searchQuery.toLowerCase();
    return projectMembers.filter(mem => 
      mem.name.toLowerCase().includes(q) ||
      mem.taskHeading.toLowerCase().includes(q) ||
      mem.taskScope.toLowerCase().includes(q) ||
      mem.designation.toLowerCase().includes(q)
    );
  }, [projectMembers, searchQuery]);

  // Render domain icon for team member headings
  const renderDomainIcon = (iconType) => {
    switch (iconType) {
      case 'Code': return <Code size={12} />;
      case 'Server': return <Server size={12} />;
      case 'Palette': return <Palette size={12} />;
      case 'Cloud': return <Cloud size={12} />;
      case 'Cpu': return <Cpu size={12} />;
      case 'Database': return <Database size={12} />;
      case 'GraduationCap': return <GraduationCap size={12} />;
      default: return <Briefcase size={12} />;
    }
  };

  // Quick action: message a team member in team chat
  const handleChatWithMember = (memName) => {
    setIsChatWrapped(false);
    setNewMessagesCount(0);
    setChatInput(`@${memName} `);
  };

  // Quick action: view a team member's tasks in board view
  const handleViewMemberTasks = (memName) => {
    setSelectedMemberFilter(memName);
    setActiveTab('Board View');
  };

  const prevProjectPositions = useRef({});

  // Handle project switch with visible FLIP animation moving clicked project up to the top
  const handleSelectProject = (projId, projName) => {
    // Automatically shift the view to the top
    scrollToTop();

    if (selectedProjectId === projId) return;

    // 1. Measure current positions of all sidebar project elements before state change
    const positions = {};
    sidebarProjectsList.forEach(p => {
      const el = document.getElementById(`sidebar-proj-${p.id}`);
      if (el) {
        positions[p.id] = el.getBoundingClientRect().top;
      }
    });
    prevProjectPositions.current = positions;

    // 2. Update state to shuffle the selected project to the top
    setShufflingProjectId(projId);
    setSelectedProjectId(projId);
    setActiveProjectName(projName);
  };

  // FLIP Layout Animation effect: physically glides the clicked project from its clicked position up to the top
  useLayoutEffect(() => {
    if (!shufflingProjectId || !prevProjectPositions.current) return;
    const prev = prevProjectPositions.current;
    prevProjectPositions.current = null; // consume once

    const container = document.getElementById('sidebar-projects-container');
    const elementsToAnimate = [];

    sidebarProjectsList.forEach(p => {
      const el = document.getElementById(`sidebar-proj-${p.id}`);
      if (el) {
        const isTarget = String(p.id) === String(shufflingProjectId);
        const prevTop = prev ? prev[p.id] : undefined;
        const newTop = el.getBoundingClientRect().top;
        const deltaY = prevTop !== undefined ? (prevTop - newTop) : (isTarget ? 120 : 0);

        if (Math.abs(deltaY) > 1 || isTarget) {
          // Invert: snap element back to its starting position instantly
          el.style.transform = `translateY(${deltaY}px)${isTarget ? ' scale(1.05)' : ''}`;
          el.style.transition = 'none';
          if (isTarget) {
            el.style.zIndex = '35';
            el.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.7)';
            el.style.borderColor = '#818cf8';
          }
          elementsToAnimate.push({ el, isTarget });
        }
      }
    });

    if (elementsToAnimate.length === 0) return;

    // Force browser layout reflow to register inverted coordinates before playing
    if (container) {
      void container.offsetHeight;
    } else if (elementsToAnimate[0]?.el) {
      void elementsToAnimate[0].el.offsetHeight;
    }

    // Play: animate smoothly from inverted position to final top slot
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elementsToAnimate.forEach(({ el, isTarget }) => {
          el.style.transition = isTarget
            ? 'transform 0.65s cubic-bezier(0.18, 0.9, 0.25, 1.15), box-shadow 0.65s ease, border-color 0.65s ease'
            : 'transform 0.52s cubic-bezier(0.25, 1, 0.5, 1)';
          el.style.transform = 'translateY(0) scale(1)';
          if (isTarget) {
            el.style.boxShadow = '0 2px 14px rgba(99, 102, 241, 0.25)';
            el.style.borderColor = 'rgba(99, 102, 241, 0.45)';
          }
        });
      });
    });

    const timer = setTimeout(() => {
      setShufflingProjectId(null);
      elementsToAnimate.forEach(({ el }) => {
        el.style.transform = '';
        el.style.transition = '';
        el.style.zIndex = '';
        el.style.boxShadow = '';
        el.style.borderColor = '';
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [selectedProjectId, shufflingProjectId, sidebarProjectsList]);

  // Reusable bottom "My Other Projects" section (Live from Database)
  const renderOtherProjects = () => (
    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Folder size={15} style={{ color: isLight ? '#4f46e5' : '#f8fafc' }} />
          <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
            My Other Projects
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Click to switch project
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {otherProjectsCards.map(item => (
          <div 
            key={item.id}
            className="sm-card sm-card-interactive"
            style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', cursor: 'pointer' }}
            onClick={() => handleSelectProject(item.id, item.name)}
            title={`Switch to ${item.name}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: item.statusBg,
                  color: item.statusColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Folder size={13} />
                </div>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                    {item.name}
                  </h4>
                </div>
              </div>

              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                color: item.statusColor,
                backgroundColor: item.statusBg,
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                {item.status}
              </span>
            </div>

            <div>
              <div style={{ width: '100%', height: '5px', backgroundColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${item.progress}%`, height: '100%', backgroundColor: item.statusColor, borderRadius: '3px', transition: 'width 0.4s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: isLight ? '#64748b' : '#94a3b8' }}>
                  <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{item.progress}%</strong> Completed
                </span>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {item.avatars.map((av, avIdx) => (
                    <div 
                      key={avIdx}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: av.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '7.5px',
                        fontWeight: 800,
                        marginLeft: avIdx > 0 ? '-5px' : 0,
                        border: isLight ? '1.5px solid #ffffff' : '1.5px solid #0c0f17'
                      }}
                    >
                      {av.initials}
                    </div>
                  ))}
                  <span style={{ fontSize: '9px', color: '#64748b', marginLeft: '3px' }}>
                    +{item.extraCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`studymate-root ${isLight ? 'theme-light' : 'theme-dark'}`} data-theme={theme || 'dark'}>

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: BRAND, NAVIGATION, AND LIVE PROJECTS */}
      {/* ========================================================================= */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: isLight ? '#ffffff' : '#0c0f17',
        borderRight: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        zIndex: 10,
        transition: 'background-color 0.35s ease, border-color 0.35s ease'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }} className="sm-scroll-area">
          
          {/* Back to ERP Dashboard */}
          <button
            onClick={() => navigate('/')}
            className="sm-back-btn"
            title="Return to Main ERP Dashboard"
          >
            <span className="sm-back-arrow">
              <ArrowLeft size={13} strokeWidth={2.4} />
            </span>
            <span>Back to Dashboard</span>
          </button>

          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 6px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
            }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                {activeProjectName}
              </h2>
              <p style={{ fontSize: '10.5px', color: isLight ? '#64748b' : '#64748b', margin: '2px 0 0' }}>Collaborative Agile workflow</p>
            </div>
          </div>

          {/* Main Navigation Views */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'Board View', label: 'Board View', icon: LayoutGrid },
              { id: 'Phase and Tasks', label: 'Phase and Tasks', icon: Layers },
              { id: 'List View', label: 'List View', icon: List },
              { id: 'AI Planner', label: 'AI Planner', icon: Sparkles },
              { id: 'Files', label: 'Files', icon: Folder }
            ].map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sm-nav-item ${isActive ? 'active' : ''}`}
                >
                  <IconComp size={16} style={{ color: isActive ? '#a5b4fc' : '#64748b' }} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>

          {/* Projects Section Header */}
          <div style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 750, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PROJECTS</span>
              {canGenerateProject && (
                <button 
                  onClick={() => setIsProjectModalOpen(true)}
                  className="sm-project-add-btn"
                  title="Generate New Project with AI Planner"
                >
                  <Plus size={13} />
                </button>
              )}
            </div>

            <div 
              id="sidebar-projects-container"
              style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '175px', overflowY: 'auto', position: 'relative' }} 
              className="sm-scroll-area"
            >
              {sidebarProjectsList.map((proj, idx) => {
                const isSelected = Boolean(
                  (selectedProjectId && String(selectedProjectId) === String(proj.id)) ||
                  (activeProjectName && proj.name && String(activeProjectName).trim().toLowerCase() === String(proj.name).trim().toLowerCase())
                );
                const isTarget = Boolean(shufflingProjectId && String(shufflingProjectId) === String(proj.id));

                return (
                  <div
                    id={`sidebar-proj-${proj.id}`}
                    key={proj.id}
                    onClick={() => handleSelectProject(proj.id, proj.name)}
                    className={`sm-sidebar-project-item ${isSelected ? 'is-active-project' : 'is-other-project'} ${isTarget ? 'is-shuffling-target' : ''}`}
                    title={isSelected ? `${proj.name} is currently open` : `Click to open ${proj.name}`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <div 
                        className="active-indicator-bar"
                        style={{
                          position: 'absolute',
                          left: '0px',
                          top: '6px',
                          bottom: '6px',
                          width: '3.5px',
                          borderRadius: '0 3px 3px 0'
                        }} 
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingLeft: isSelected ? '4px' : '0' }}>
                      <Folder size={14} style={{ color: isSelected ? '#818cf8' : proj.iconColor, flexShrink: 0 }} />
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: isSelected ? '#ffffff' : '#94a3b8'
                      }}>
                        {proj.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      {isSelected && (
                        <span 
                          className="open-badge-pill"
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}
                        >
                          Open
                        </span>
                      )}
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#c7d2fe' : '#64748b'
                      }}>
                        {proj.progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile Card at Bottom */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 8px',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
            }}>
              {getInitials(user?.fullname || 'Harsh Saini')}
            </div>
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: 650, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                {user?.fullname || 'Harsh Saini'}
              </h5>
              <span style={{ fontSize: '10px', color: isLight ? '#64748b' : '#94a3b8' }}>
                {user?.role || 'Admin'}
              </span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
            title="Return to Main ERP"
            onMouseEnter={(e) => e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = isLight ? '#64748b' : '#94a3b8'}
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CENTER CONTENT: HEADER, STATS, TASKS, OTHER PROJECTS */}
      {/* ========================================================================= */}
      <main 
        ref={mainScrollRef}
        id="main-projects-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
          backgroundColor: isLight ? '#f4f6fb' : '#090d16',
          padding: '24px 28px',
          gap: '24px',
          transition: 'background-color 0.35s ease'
        }} 
        className="sm-scroll-area">

        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Left Side: Search Bar and Live Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '440px' }}>
            <div className="sm-search-container" style={{ width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '14px', color: isLight ? '#64748b' : '#94a3b8', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                className="sm-search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              <span style={{
                position: 'absolute',
                right: '12px',
                fontSize: '10px',
                fontWeight: 700,
                color: isLight ? '#64748b' : '#94a3b8',
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)',
                padding: '2px 5px',
                borderRadius: '4px',
                border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none'
              }}>
                ⌘ K
              </span>

              {/* Suggestion Dropdown */}
              {searchFocused && (
                <div className="sm-search-dropdown" style={isLight ? { background: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 12px 35px rgba(0,0,0,0.1)' } : {}}>
                  <div style={{ padding: '6px 8px', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.06)', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                    {searchQuery ? `Search results for "${searchQuery}"` : 'Quick Task Suggestions'}
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="sm-scroll-area">
                    {filteredTasks.slice(0, 5).map(t => (
                      <div 
                        key={t._id}
                        onMouseDown={() => setSearchQuery(t.title)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                        className="sm-nav-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <CheckSquare size={13} style={{ color: t.isCompleted ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: isLight ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
                          {t.phase}
                        </span>
                      </div>
                    ))}
                    {filteredTasks.length === 0 && (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                        No matching tasks found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isLoadingTasks && (
              <RefreshCw size={14} className="sm-spin" style={{ color: '#818cf8', flexShrink: 0 }} title="Syncing with database..." />
            )}
          </div>

          {/* Right Side: Notification Bell & Theme Toggle (White-Selected Button) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Notification Bell Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isLight ? '#475569' : '#94a3b8',
                  cursor: 'pointer',
                  position: 'relative',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                className="sm-card-interactive"
              >
                <Bell size={16} />
                {notifications.some(n => n.unread) && (
                  <span style={{
                    position: 'absolute',
                    top: '1px',
                    right: '1px',
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    backgroundColor: '#ec4899',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isLight ? '2px solid #ffffff' : '2px solid #090d16'
                  }}>
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '280px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: isLight ? '0 12px 35px rgba(0, 0, 0, 0.12)' : '0 12px 35px rgba(0, 0, 0, 0.7)',
                  zIndex: 1000
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: isLight ? '#0f172a' : '#f8fafc' }}>Notifications</h5>
                    <span 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                      style={{ fontSize: '10px', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all read
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: '6px 0', borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{n.title}</strong>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>{n.time}</span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: isLight ? '#475569' : '#94a3b8' }}>{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Premium Animated Dark/Light Theme Toggle (White-Selected in Screenshot) */}
            <button
              onClick={toggleTheme}
              className="sm-theme-toggle-btn"
              title={isLight ? "Switch to Deep Midnight Dark Mode" : "Switch to Eye-Comfort Light Mode"}
              aria-label="Toggle Theme"
            >
              <div key={theme} className="sm-theme-icon-animate">
                {isLight ? (
                  <Sun size={18} className="sm-sun-icon" />
                ) : (
                  <Moon size={18} className="sm-moon-icon" />
                )}
              </div>
            </button>

          </div>
        </div>

        {/* 4 Stat Metric Cards Row (LIVE DATA FROM DATABASE) - Hidden on Phase and Tasks & AI Planner pages */}
        {activeTab !== 'Phase and Tasks' && activeTab !== 'AI Planner' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            
            {/* Card 1: Total Tasks */}
            <div className="sm-card sm-stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '124px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8'
                  }}>
                    <Layers size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Total Tasks</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        {metrics.total}
                      </h3>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ↑ 14%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>vs last week</span>
                <svg width="84" height="24" viewBox="0 0 84 24" style={{ overflow: 'visible' }}>
                  <path d="M0,18 Q14,8 28,15 T56,8 T84,12" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0,18 Q14,8 28,15 T56,8 T84,12 L84,24 L0,24 Z" fill="rgba(129, 140, 248, 0.1)" />
                </svg>
              </div>
            </div>

            {/* Card 2: Completed with Dynamic Circular Gauge */}
            <div className="sm-card sm-stat-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '124px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <CheckSquare size={16} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Completed</span>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {metrics.completed}
                  </h3>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                    {metrics.completionRate}% completion rate
                  </span>
                </div>
              </div>

              {/* Dynamic Circular Gauge */}
              <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path 
                    className="circle" 
                    strokeDasharray={`${metrics.completionRate}, 100`} 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                  <text x="18" y="21" className="percentage">{metrics.completionRate}%</text>
                </svg>
              </div>
            </div>

            {/* Card 3: In Progress */}
            <div className="sm-card sm-stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '124px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b'
                }}>
                  <Clock size={16} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>In Progress</span>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0' }}>
                    {metrics.inProgress}
                  </h3>
                </div>
              </div>

              <div>
                <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${metrics.inProgressRate}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                  {metrics.inProgressRate}% of total tasks
                </span>
              </div>
            </div>

            {/* Card 4: Overdue */}
            <div className="sm-card sm-stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '124px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}>
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Overdue</span>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0' }}>
                    {metrics.overdue}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                  {metrics.overdueRate}% of total tasks
                </span>
                <svg width="84" height="24" viewBox="0 0 84 24" style={{ overflow: 'visible' }}>
                  <path d="M0,12 Q14,20 28,10 T56,18 T84,6" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0,12 Q14,20 28,10 T56,18 T84,6 L84,24 L0,24 Z" fill="rgba(239, 68, 68, 0.08)" />
                </svg>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW TAB RENDERER: LIST VIEW / BOARD VIEW / TIMELINE / FILES / AI PLANNER */}
        {/* ========================================================================= */}
        {activeTab === 'AI Planner' ? (
          <AIProjectDashboard 
            projectId={selectedProjectId} 
            projectName={activeProjectName}
            onTasksUpdated={() => fetchProjectData(selectedProjectId)}
          />
        ) : activeTab === 'Board View' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* =============================================================== */}
            {/* PROJECT BIO / DESCRIPTION CARD (JUST AFTER METRIC BOXES)        */}
            {/* =============================================================== */}
            <div className="sm-project-bio-card">
              <div className="sm-project-bio-glow" />
              
              {/* Top Row: Title, Health Badge, Category & Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                  }}>
                    <Folder size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                        {currentProject.name}
                      </h2>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: currentProject.healthStatus === 'On-Track' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: currentProject.healthStatus === 'On-Track' ? '#10b981' : '#f59e0b',
                        border: `1px solid ${currentProject.healthStatus === 'On-Track' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: currentProject.healthStatus === 'On-Track' ? '#10b981' : '#f59e0b' }} />
                        {currentProject.healthStatus}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {currentProject.category}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#a5b4fc',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    {metrics.completionRate}% Sprint Complete
                  </span>
                </div>
              </div>

              {/* Bio / Description Text */}
              <p style={{
                fontSize: '13px',
                lineHeight: '1.65',
                color: '#cbd5e1',
                margin: '0 0 16px 0',
                maxWidth: '960px'
              }}>
                {currentProject.description}
              </p>

              {/* Bottom Metadata Highlights */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} style={{ color: '#818cf8' }} />
                  <span>Timeline: <strong style={{ color: '#f8fafc' }}>{currentProject.startDateFormatted}</strong> → <strong style={{ color: '#f8fafc' }}>{currentProject.deadlineFormatted}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} style={{ color: '#38bdf8' }} />
                  <span>Team: <strong style={{ color: '#f8fafc' }}>{projectMembers.length} Engineers</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={13} style={{ color: '#a855f7' }} />
                  <span>Phases: <strong style={{ color: '#f8fafc' }}>{phaseGroups.length} Active</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={13} style={{ color: '#10b981' }} />
                  <span>Tasks: <strong style={{ color: '#10b981' }}>{metrics.completed} Done</strong> / <strong style={{ color: '#f8fafc' }}>{metrics.total} Total</strong></span>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* KANBAN STATUS TASK BOARD (BY WORKFLOW STATUS, NO PHASES)         */}
            {/* =============================================================== */}
            {(() => {
              const todoTasks = filteredTasks.filter(t => !t.isCompleted && t.status !== 'Completed' && t.status !== 'In Progress');
              const inProgressTasks = filteredTasks.filter(t => !t.isCompleted && t.status === 'In Progress');
              const completedTasks = filteredTasks.filter(t => t.isCompleted || t.status === 'Completed');

              const kanbanColumns = [
                {
                  id: 'todo',
                  title: 'To Do',
                  subtitle: 'Pending & backlog tasks',
                  count: todoTasks.length,
                  color: '#38bdf8',
                  bg: 'rgba(56, 189, 248, 0.12)',
                  tasks: todoTasks,
                  defaultPhase: 'Planning'
                },
                {
                  id: 'inprogress',
                  title: 'In Progress',
                  subtitle: 'Active development sprint',
                  count: inProgressTasks.length,
                  color: '#f59e0b',
                  bg: 'rgba(245, 158, 11, 0.12)',
                  tasks: inProgressTasks,
                  defaultPhase: 'Backend'
                },
                {
                  id: 'completed',
                  title: 'Completed',
                  subtitle: 'Done & delivered milestones',
                  count: completedTasks.length,
                  color: '#10b981',
                  bg: 'rgba(16, 185, 129, 0.12)',
                  tasks: completedTasks,
                  defaultPhase: 'Deployment'
                }
              ];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Kanban Board Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8'
                      }}>
                        <LayoutGrid size={15} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                          {selectedMemberFilter ? `Tasks Assigned to ${selectedMemberFilter} (${filteredTasks.length})` : `Sprint Task Board (${filteredTasks.length})`}
                        </h3>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Visual status workflow for active sprint delivery
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedMemberFilter && (
                        <button
                          onClick={() => setSelectedMemberFilter(null)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            color: '#a5b4fc',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>Filter: {selectedMemberFilter}</span>
                          <X size={12} />
                        </button>
                      )}

                      {/* Wrap / Unwrap All Boxes Button */}
                      <button
                        onClick={toggleAllBoardCols}
                        style={{
                          background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: isLight ? '#475569' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        className="sm-card-interactive"
                        title={Object.values(wrappedBoardCols).every(Boolean) ? "Unwrap all Kanban boxes" : "Wrap all Kanban boxes"}
                      >
                        {Object.values(wrappedBoardCols).every(Boolean) ? (
                          <>
                            <ChevronDown size={13} />
                            <span>Unwrap Boxes</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp size={13} />
                            <span>Wrap Boxes</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setNewTaskPhase('General');
                          setIsTaskModalOpen(true);
                        }}
                        className="sm-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '11.5px' }}
                      >
                        <Plus size={13} />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Kanban Columns (Collapsible / Wrapped) */}
                  <div className="sm-kanban-board">
                    {kanbanColumns.map(col => {
                      const isWrapped = Boolean(wrappedBoardCols[col.id]);

                      return (
                        <div key={col.id} className={`sm-kanban-col ${isWrapped ? 'wrapped' : ''}`}>
                          {/* Column Header with Wrap Toggle */}
                          <div
                            className="sm-kanban-col-header"
                            onClick={() => toggleBoardColWrap(col.id)}
                            title={isWrapped ? `Click to unwrap ${col.title}` : `Click to wrap ${col.title}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                              <div>
                                <h4 style={{ fontSize: '12.5px', fontWeight: 750, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                                  {col.title}
                                </h4>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isWrapped ? (
                                <span className="box-wrapped-pill">
                                  {col.count} {col.count === 1 ? 'task' : 'tasks'}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  color: col.color,
                                  backgroundColor: col.bg,
                                  border: `1px solid ${col.color}33`,
                                  padding: '2px 8px',
                                  borderRadius: '10px'
                                }}>
                                  {col.count}
                                </span>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBoardColWrap(col.id);
                                }}
                                className={`box-toggle-btn ${isWrapped ? 'wrapped' : ''}`}
                                title={isWrapped ? `Unwrap ${col.title}` : `Wrap ${col.title}`}
                              >
                                <ChevronDown size={14} className="toggle-chevron" />
                              </button>
                            </div>
                          </div>

                          {/* Column Collapsible Body */}
                          <div className={`box-collapsible-wrapper ${isWrapped ? 'wrapped' : 'unwrapped'}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                              {col.tasks.length === 0 ? (
                                <div style={{
                                  padding: '30px 14px',
                                  textAlign: 'center',
                                  color: '#64748b',
                                  fontSize: '11.5px',
                                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.01)'
                                }}>
                                  No {col.title.toLowerCase()} tasks
                                </div>
                              ) : (
                                col.tasks.map(task => (
                                  <div
                                    key={task._id}
                                    className={`sm-kanban-card ${task.isCompleted ? 'sm-task-completed' : ''}`}
                                  >
                                    {/* Card Top Row: Checkbox, Title, Star, Delete */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                                        <div
                                          className={`sm-checkbox ${task.isCompleted ? 'checked' : ''}`}
                                          onClick={() => handleToggleTask(task._id, task.isCompleted)}
                                          style={{ marginTop: '2px' }}
                                          title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                        >
                                          {task.isCompleted && <Check size={11} color="#ffffff" strokeWidth={3} />}
                                        </div>
                                        <span style={{
                                          fontSize: '12.5px',
                                          fontWeight: 650,
                                          color: task.isCompleted ? '#94a3b8' : '#f8fafc',
                                          lineHeight: '1.4',
                                          textDecoration: task.isCompleted ? 'line-through' : 'none'
                                        }}>
                                          {task.title}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                        <button
                                          onClick={() => handleToggleStar(task._id)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: starredTasks[task._id] ? '#f59e0b' : '#64748b', padding: '1px' }}
                                          title={starredTasks[task._id] ? 'Starred' : 'Star'}
                                        >
                                          <Star size={12} fill={starredTasks[task._id] ? '#f59e0b' : 'none'} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTask(task._id)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '1px' }}
                                          title="Delete task"
                                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Card Description */}
                                    {task.description && (
                                      <p style={{
                                        fontSize: '11px',
                                        color: '#94a3b8',
                                        margin: '0',
                                        lineHeight: '1.45',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}>
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Card Meta Footer */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '2px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{
                                          width: '18px',
                                          height: '18px',
                                          borderRadius: '50%',
                                          backgroundColor: task.assigneeColor || '#6366f1',
                                          color: 'white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '8px',
                                          fontWeight: 800
                                        }}>
                                          {task.assigneeInitials || 'HS'}
                                        </div>
                                        <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 500 }}>
                                          {task.assignee}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                          fontSize: '9px',
                                          fontWeight: 700,
                                          color: getPriorityColor(task.priority),
                                          backgroundColor: `${getPriorityColor(task.priority)}18`,
                                          border: `1px solid ${getPriorityColor(task.priority)}33`,
                                          padding: '1px 5px',
                                          borderRadius: '3px'
                                        }}>
                                          {task.priority || 'Normal'}
                                        </span>
                                        {task.dueDate && (
                                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                                            {task.dueDate}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}

                              {/* Quick Add at column bottom */}
                              <button
                                onClick={() => {
                                  setNewTaskPhase(col.defaultPhase);
                                  setIsTaskModalOpen(true);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  backgroundColor: 'transparent',
                                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: '#94a3b8',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  transition: 'all 0.2s'
                                }}
                                className="sm-card-interactive"
                              >
                                <Plus size={13} />
                                <span>Add Task</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'Phase and Tasks' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Development Lifecycle Pipeline Ribbon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  DEVELOPMENT LIFECYCLE PIPELINE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {phaseViewFilter !== 'All' && (
                    <button
                      onClick={() => setPhaseViewFilter('All')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        fontWeight: 650,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        transition: 'all 0.15s ease'
                      }}
                      title="Clear filter and view all phases"
                    >
                      Showing {phaseViewFilter} (Click to reset)
                    </button>
                  )}
                  <span style={{ fontSize: '10.5px', color: '#818cf8', fontWeight: 600 }}>
                    Scroll to explore • Click stage to filter
                  </span>
                </div>
              </div>

              {allLifecyclePhases.length === 0 ? (
                <div style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '12.5px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.08)'
                }}>
                  No active lifecycle phases detected for this project. Tasks added with phases will automatically construct this pipeline.
                </div>
              ) : (
                <div className="sm-pipeline-carousel-wrapper">
                  {/* Left Nav Button on left side of cards */}
                  <button
                    type="button"
                    onClick={() => handlePipelineNavScroll('left')}
                    className={`sm-pipeline-nav-btn nav-left ${clickedNavBtn === 'left' ? 'just-clicked' : ''}`}
                    title="Scroll left"
                  >
                    <ChevronLeft size={16} className="nav-chevron" />
                  </button>

                  <div 
                    ref={pipelineScrollRef}
                    className="sm-phase-pipeline-container sm-scroll-area"
                  >
                    {allLifecyclePhases.map((phase) => {
                      const meta = getPhaseMeta(phase.name);
                      const PhaseIcon = meta.icon;
                      const isSelected = phaseViewFilter.toLowerCase() === phase.name.toLowerCase();

                      return (
                        <div
                          key={phase.name}
                          onClick={() => setPhaseViewFilter(isSelected ? 'All' : phase.name)}
                          className={`sm-phase-step-node ${isSelected ? 'active-filter' : ''}`}
                          title={`Click to focus on ${phase.name} • Scroll wheel to move horizontally`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: 750, color: isSelected ? '#a5b4fc' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              PHASE 0{phase.stepNumber}
                            </span>
                            <span style={{
                              fontSize: '8.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: phase.progress === 100 ? 'rgba(16, 185, 129, 0.15)' : (phase.totalCount > 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                              color: phase.progress === 100 ? '#10b981' : (phase.totalCount > 0 ? '#818cf8' : '#64748b')
                            }}>
                              {phase.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div 
                              className="sm-phase-icon-box"
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                backgroundColor: `${meta.color}22`,
                                color: meta.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.25s ease',
                                flexShrink: 0
                              }}
                            >
                              <PhaseIcon size={12} />
                            </div>
                            <h4 style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {phase.name}
                            </h4>
                          </div>

                          <div>
                            <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
                              <div 
                                className="sm-phase-progress-fill"
                                style={{ 
                                width: `${phase.progress}%`, 
                                height: '100%', 
                                background: phase.progress === 100 ? '#10b981' : `linear-gradient(90deg, #6366f1, ${meta.color})`, 
                                borderRadius: '2px', 
                                transition: 'width 0.4s ease, filter 0.25s ease' 
                              }} 
                            />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#64748b' }}>
                              <span>{phase.completedCount}/{phase.totalCount} tasks</span>
                              <span style={{ fontWeight: 700, color: phase.progress === 100 ? '#10b981' : '#cbd5e1' }}>{phase.progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Nav Button on right side of cards */}
                  <button
                    type="button"
                    onClick={() => handlePipelineNavScroll('right')}
                    className={`sm-pipeline-nav-btn nav-right ${clickedNavBtn === 'right' ? 'just-clicked' : ''}`}
                    title="Scroll right"
                  >
                    <ChevronRight size={16} className="nav-chevron" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Filter Bar */}
            {allLifecyclePhases.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '-2px' }}>
                <div className="sm-glass-status-cluster">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px 0 10px', fontSize: '10.5px', color: '#64748b', fontWeight: 650 }}>
                    <Filter size={11} style={{ color: '#818cf8' }} />
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '9.5px' }}>Status</span>
                  </div>
                  {[
                    { id: 'all', label: 'All', dotClass: 'dot-all' },
                    { id: 'active', label: 'In Progress', dotClass: 'dot-active' },
                    { id: 'completed', label: 'Completed', dotClass: 'dot-completed' }
                  ].map(st => {
                    const isActive = phaseTaskStatusFilter === st.id;
                    const isJustClicked = clickedStatusId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleStatusFilterClick(st.id)}
                        className={`sm-glass-status-btn ${isActive ? 'active' : ''} ${isJustClicked ? 'just-clicked' : ''}`}
                      >
                        <span className={`sm-glass-dot ${st.dotClass}`} />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Phase Workstation Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayedLifecyclePhases.length === 0 ? (
                <div style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.45)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8'
                  }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px 0' }}>
                      {allLifecyclePhases.length === 0 ? 'No Phases Present in Database' : 'No Tasks in Selected Filter'}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                      {allLifecyclePhases.length === 0 
                        ? 'This project does not have any tasks or phases in the database yet. Click below to add tasks and establish project phases.'
                        : `No tasks match the "${phaseViewFilter}" phase or "${phaseTaskStatusFilter}" status filter. Click "All Phases" to see all tasks.`}
                    </p>
                  </div>
                  {allLifecyclePhases.length === 0 ? (
                    <button
                      onClick={() => setIsTaskModalOpen(true)}
                      className="sm-btn-primary"
                      style={{ padding: '8px 18px', fontSize: '12px', marginTop: '4px' }}
                    >
                      <Plus size={14} />
                      <span>Add Phase Task</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPhaseViewFilter('All');
                        setPhaseTaskStatusFilter('all');
                      }}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        color: '#a5b4fc',
                        fontSize: '11.5px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                displayedLifecyclePhases.map((phase) => {
                const meta = getPhaseMeta(phase.name);
                const PhaseIcon = meta.icon;
                const phaseTasks = phase.tasks.filter(t => {
                  if (phaseTaskStatusFilter === 'active') return !t.isCompleted;
                  if (phaseTaskStatusFilter === 'completed') return t.isCompleted;
                  return true;
                });

                return (
                  <div 
                    key={phase.name}
                    id={`phase-section-${phase.name}`}
                    className="sm-phase-workstation-box"
                  >
                    {/* Phase Workstation Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '12px', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: `${meta.color}22`,
                          color: meta.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${meta.color}44`
                        }}>
                          <PhaseIcon size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                              {meta.title}
                            </h3>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: phase.progress === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                              color: phase.progress === 100 ? '#10b981' : '#a5b4fc',
                              border: `1px solid ${phase.progress === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                            }}>
                              {phase.completedCount} / {phase.totalCount} Done
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Phase 0{phase.stepNumber} Deliverables & Tasks
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '120px', height: '6px', backgroundColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${phase.progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                          {phase.progress}%
                        </span>
                        <button
                          onClick={() => {
                            setNewTaskPhase(phase.name);
                            setIsTaskModalOpen(true);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#a5b4fc',
                            fontSize: '11px',
                            fontWeight: 650,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Add new task to ${phase.name}`}
                        >
                          <Plus size={12} />
                          <span>Add Task</span>
                        </button>
                      </div>
                    </div>

                    {/* Tasks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {phaseTasks.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', border: '1px dashed rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                          {phase.totalCount === 0 
                            ? `No tasks scheduled in ${phase.name}. Click '+ Add Task' to start planning this phase.`
                            : `No ${phaseTaskStatusFilter} tasks in this phase.`}
                        </div>
                      ) : (
                        phaseTasks.map((task) => (
                          <div
                            key={task._id}
                            id={`phase-task-${task._id}`}
                            className={`sm-card sm-card-interactive sm-task-row ${task.isCompleted ? 'sm-task-completed' : ''}`}
                            style={{
                              padding: '12px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <div 
                                  className={`sm-checkbox ${task.isCompleted ? 'checked' : ''}`}
                                  onClick={() => handleToggleTask(task._id, task.isCompleted)}
                                  title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                >
                                  {task.isCompleted && <Check size={12} color="#ffffff" strokeWidth={3} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <h4 className="sm-task-title" style={{ fontSize: '13px', fontWeight: 650, color: '#f8fafc', margin: 0 }}>
                                    {task.title}
                                  </h4>
                                  <button
                                    onClick={() => handleToggleStar(task._id)}
                                    className={starredTasks[task._id] ? 'sm-star-active' : ''}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: starredTasks[task._id] ? '#f59e0b' : '#64748b', padding: '0 2px' }}
                                    title={starredTasks[task._id] ? 'Starred task' : 'Star task'}
                                  >
                                    <Star size={13} fill={starredTasks[task._id] ? '#f59e0b' : 'none'} />
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  color: getPriorityColor(task.priority),
                                  backgroundColor: `${getPriorityColor(task.priority)}18`,
                                  border: `1px solid ${getPriorityColor(task.priority)}33`,
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}>
                                  {task.priority || 'Normal'}
                                </span>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                                  title="Delete task"
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {task.description && (
                              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '0 0 2px 28px', lineHeight: '1.5' }}>
                                {task.description}
                              </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '28px', paddingTop: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: task.assigneeColor || '#6366f1',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8.5px',
                                    fontWeight: 800
                                  }}>
                                    {task.assigneeInitials || 'HS'}
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
                                    {task.assignee}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                                  <Calendar size={12} />
                                  <span>{task.dueDate}</span>
                                  <span style={{ fontSize: '10px', color: '#64748b' }}>• {task.estimatedHours || 6}h</span>
                                </div>
                              </div>

                              <span style={{
                                fontSize: '10px',
                                fontWeight: 650,
                                backgroundColor: task.isCompleted ? 'rgba(16, 185, 129, 0.12)' : (task.status === 'In Progress' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)'),
                                color: task.isCompleted ? '#10b981' : (task.status === 'In Progress' ? '#f59e0b' : '#60a5fa'),
                                border: `1px solid ${task.isCompleted ? 'rgba(16, 185, 129, 0.25)' : (task.status === 'In Progress' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)')}`,
                                padding: '2px 10px',
                                borderRadius: '12px'
                              }}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        ) : activeTab === 'Files' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* FILES & ASSETS REPOSITORY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={16} style={{ color: '#818cf8' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                    Project Documents & Assets
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  4 Shared Specifications
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {[
                  { name: 'StudyMate-System-Architecture.pdf', size: '2.4 MB', date: 'May 12, 2025', tag: 'Architecture', color: '#818cf8' },
                  { name: 'API-Specification-Endpoints.json', size: '480 KB', date: 'May 14, 2025', tag: 'Backend', color: '#38bdf8' },
                  { name: 'Database-ER-Diagram-v3.png', size: '1.8 MB', date: 'May 15, 2025', tag: 'Database', color: '#10b981' },
                  { name: 'UI-Components-Design-System.fig', size: '8.1 MB', date: 'May 16, 2025', tag: 'Designing', color: '#ec4899' }
                ].map((f, fIdx) => (
                  <div key={fIdx} className="sm-card sm-card-interactive" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: `${f.color}22`,
                        color: f.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 650, color: isLight ? '#0f172a' : '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.name}
                        </h4>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          {f.size} • {f.date}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: f.color,
                      backgroundColor: `${f.color}18`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}>
                      {f.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {renderOtherProjects()}
          </div>
        ) : (
          /* =================================================================== */
          /* LIST VIEW (DEFAULT): PROJECT TEAM MEMBERS WITH SIMPLE TASK HEADINGS */
          /* STRICTLY NO TASKS SHOWN IN LIST VIEW                                */
          /* =================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* PROJECT TEAM MEMBERS (WITH SIMPLE TASK HEADINGS) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} style={{ color: '#818cf8' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                    Project Team Members ({projectMembers.length})
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    • Assigned Roles & Disciplines
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 650,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Active Sprint Squad
                  </span>
                  {searchQuery && (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Filtering by "{searchQuery}"
                    </span>
                  )}
                </div>
              </div>

              {/* Team Members Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '14px'
              }}>
                {displayedMembers.map(mem => {
                  const assignedCount = tasks.filter(t => 
                    (t.assignee && t.assignee.toLowerCase().includes(mem.name.toLowerCase())) ||
                    (t.assignedTo && (t.assignedTo._id === mem.empId || t.assignedTo === mem.empId))
                  ).length;

                  return (
                    <div
                      key={mem.id}
                      className="sm-member-card"
                      style={{
                        '--member-accent': mem.tagColor,
                        '--member-glow': mem.tagBg,
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Top Row: Avatar + Name + Simple Task Heading Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          {/* Avatar with Online Dot */}
                          <div className="sm-member-avatar-ring">
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${mem.color} 0%, #8b5cf6 100%)`,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 800,
                              boxShadow: `0 2px 10px ${mem.color}44`
                            }}>
                              {mem.initials}
                            </div>
                            <span className="sm-member-online-dot" />
                          </div>

                          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {mem.name}
                            </h4>
                            <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8' }}>
                              {mem.designation}
                            </span>
                          </div>
                        </div>

                        {/* Simple Task Heading Badge */}
                        <span 
                          className="sm-member-domain-badge"
                          style={{
                            color: mem.tagColor,
                            backgroundColor: mem.tagBg,
                            border: `1px solid ${mem.tagColor}44`,
                            padding: '3px 9px',
                            fontSize: '11px'
                          }}
                        >
                          {renderDomainIcon(mem.iconType)}
                          <span>{mem.taskHeading}</span>
                        </span>
                      </div>

                      {/* Middle: Task Scope Description */}
                      <div style={{
                        background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '11.5px',
                        color: isLight ? '#334155' : '#cbd5e1',
                        lineHeight: 1.45
                      }}>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                          Domain Scope
                        </span>
                        {mem.taskScope}
                      </div>

                      {/* Bottom Row: Allocation & Quick Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '10px',
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            fontWeight: 650
                          }}>
                            {mem.allocationPercent}% Allocation
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {assignedCount} {assignedCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChatWithMember(mem.name);
                            }}
                            className="sm-card-interactive"
                            style={{
                              background: isLight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.12)',
                              border: isLight ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 9px',
                              color: isLight ? '#4f46e5' : '#a5b4fc',
                              fontSize: '11px',
                              fontWeight: 650,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.2s'
                            }}
                            title={`Message ${mem.name} in team chat`}
                          >
                            <MessageSquare size={12} />
                            <span>Chat</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMemberTasks(mem.name);
                            }}
                            className="sm-card-interactive"
                            style={{
                              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              padding: '4px 9px',
                              color: isLight ? '#475569' : '#cbd5e1',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.2s'
                            }}
                            title={`View ${mem.name}'s tasks in Board View`}
                          >
                            <LayoutGrid size={12} />
                            <span>Tasks</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MY OTHER PROJECTS (Live from Database) */}
            {renderOtherProjects()}

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 3. RIGHT COLUMN: AGENDA, RECENT ACTIVITY, UPCOMING DEADLINES */}
      {/* ========================================================================= */}
      <aside 
        style={{
          width: allWidgetsWrapped ? '0px' : '250px',
          minWidth: allWidgetsWrapped ? '0px' : '250px',
          maxWidth: allWidgetsWrapped ? '0px' : '250px',
          backgroundColor: isLight ? '#f8fafc' : '#0c0f17',
          borderLeft: allWidgetsWrapped ? 'none' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: allWidgetsWrapped ? '0px' : '20px 14px',
          gap: '16px',
          overflowY: 'auto',
          overflowX: 'hidden',
          opacity: allWidgetsWrapped ? 0 : 1,
          pointerEvents: allWidgetsWrapped ? 'none' : 'auto',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10
        }} 
        className="sm-scroll-area"
      >

        {/* Widget 1: Today's Agenda */}
        <div className="sm-card" style={{ padding: '14px', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isAgendaWrapped ? 0 : '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                className="box-title-icon" 
                style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
                title="Today's Agenda"
              >
                <Calendar size={14} />
              </div>
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                  Today's Agenda
                </h4>
                {isAgendaWrapped && (
                  <span className="box-wrapped-pill" style={{ marginTop: '2px', display: 'inline-block' }}>
                    {todayAgendaItems.length} items scheduled
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsAgendaWrapped(!isAgendaWrapped)}
              className={`box-toggle-btn ${isAgendaWrapped ? 'wrapped' : ''}`}
              title={isAgendaWrapped ? "Unwrap Today's Agenda" : "Wrap Today's Agenda"}
            >
              <ChevronDown size={14} className="toggle-chevron" />
            </button>
          </div>

          <div className={`box-collapsible-wrapper ${isAgendaWrapped ? 'wrapped' : 'unwrapped'}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '2px' }}>
              {todayAgendaItems.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                    color: isLight ? '#475569' : '#94a3b8',
                    padding: '2px 6px',
                    borderRadius: '5px',
                    fontFamily: 'monospace'
                  }}>
                    {it.time}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 650, color: isLight ? '#0f172a' : '#f8fafc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.title}
                    </h5>
                    <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 2: Recent Activity (Live from Database) */}
        <div className="sm-card" style={{ padding: '14px', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isActivityWrapped ? 0 : '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                className="box-title-icon" 
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                title="Recent Activity"
              >
                <Activity size={14} />
              </div>
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                  Recent Activity
                </h4>
                {isActivityWrapped && (
                  <span className="box-wrapped-pill" style={{ marginTop: '2px', display: 'inline-block' }}>
                    {activities.length} updates logged
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsActivityWrapped(!isActivityWrapped)}
              className={`box-toggle-btn ${isActivityWrapped ? 'wrapped' : ''}`}
              title={isActivityWrapped ? "Unwrap Recent Activity" : "Wrap Recent Activity"}
            >
              <ChevronDown size={14} className="toggle-chevron" />
            </button>
          </div>

          <div className={`box-collapsible-wrapper ${isActivityWrapped ? 'wrapped' : 'unwrapped'}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '2px' }}>
              {activities.slice(0, 6).map((act, idx) => (
                <div key={act.id || idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: act.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8.5px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {act.initials}
                  </div>
                  <div style={{ minWidth: 0, fontSize: '10.5px', lineHeight: 1.35 }}>
                    <div style={{ color: isLight ? '#475569' : '#cbd5e1' }}>
                      <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{act.name}</strong> {act.action} <span style={{ color: '#64748b' }}>{act.time}</span>
                    </div>
                    <p style={{ color: '#818cf8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.target}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 3: Upcoming Deadlines (Live from Database) */}
        <div className="sm-card" style={{ padding: '14px', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isDeadlinesWrapped ? 0 : '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                className="box-title-icon" 
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                title="Upcoming Deadlines"
              >
                <Clock size={14} />
              </div>
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                  Upcoming Deadlines
                </h4>
                {isDeadlinesWrapped && (
                  <span className="box-wrapped-pill" style={{ marginTop: '2px', display: 'inline-block' }}>
                    {upcomingDeadlines.length} targets
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsDeadlinesWrapped(!isDeadlinesWrapped)}
              className={`box-toggle-btn ${isDeadlinesWrapped ? 'wrapped' : ''}`}
              title={isDeadlinesWrapped ? "Unwrap Upcoming Deadlines" : "Wrap Upcoming Deadlines"}
            >
              <ChevronDown size={14} className="toggle-chevron" />
            </button>
          </div>

          <div className={`box-collapsible-wrapper ${isDeadlinesWrapped ? 'wrapped' : 'unwrapped'}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '11px', paddingTop: '2px' }}>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((d) => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: d.dotColor, flexShrink: 0 }} />
                      <span style={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.title}
                      </span>
                    </div>
                    <span style={{ color: d.dotColor, fontSize: '10px', fontWeight: 650, flexShrink: 0 }}>
                      {d.date}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '6px 0' }}>
                  No pending deadlines! 🎉
                </div>
              )}
            </div>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 4. FAR-RIGHT COLUMN: TEAM CHAT STREAM & PERSISTENT MESSAGING */}
      {/* ========================================================================= */}
      <aside style={{
        width: isChatWrapped ? '0px' : '280px',
        minWidth: isChatWrapped ? '0px' : '280px',
        maxWidth: isChatWrapped ? '0px' : '280px',
        backgroundColor: isLight ? '#ffffff' : '#0c0f17',
        borderLeft: isChatWrapped ? 'none' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isChatWrapped ? '0px' : '20px 14px',
        opacity: isChatWrapped ? 0 : 1,
        overflow: 'hidden',
        pointerEvents: isChatWrapped ? 'none' : 'auto',
        zIndex: 10,
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* Chat Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: isChatWrapped ? 0 : '12px', borderBottom: isChatWrapped ? 'none' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                className="box-title-icon" 
                style={{ 
                  background: 'rgba(99, 102, 241, 0.15)', 
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)' 
                }}
                title="Team Chat"
              >
                <MessageSquare size={13} />
              </div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                Team Chat
              </h3>
              {isChatWrapped && (
                <span className="box-wrapped-pill" style={{ color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                  {chatMessages.length} msgs
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
              <Users size={14} style={{ cursor: 'pointer' }} title="Channel Members" />
              <button
                type="button"
                onClick={() => setIsChatWrapped(!isChatWrapped)}
                className={`box-toggle-btn ${isChatWrapped ? 'wrapped' : ''}`}
                title={isChatWrapped ? "Unwrap Team Chat" : "Wrap Team Chat"}
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Wrapped Banner */}
        {isChatWrapped && (
          <div 
            onClick={() => {
              setIsChatWrapped(false);
              setNewMessagesCount(0);
            }}
            style={{ 
              marginTop: '16px', 
              padding: '14px 12px', 
              borderRadius: '10px', 
              background: 'rgba(99, 102, 241, 0.06)', 
              border: '1px dashed rgba(99, 102, 241, 0.25)',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#818cf8',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <MessageSquare size={13} />
            <span>Chat is wrapped &bull; Click to unwrap</span>
          </div>
        )}

        {/* Collapsible Content Area */}
        <div 
          className={`box-collapsible-wrapper ${isChatWrapped ? 'wrapped' : 'unwrapped'}`} 
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc' }}>
                # {activeProjectName} Team
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#10b981' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Online</span>
            </div>
          </div>

          {/* Message Stream */}
          <div 
            ref={chatScrollRef}
            style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}
            className="sm-scroll-area"
          >
            {chatMessages.map(msg => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.isSelf ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}
              >
                {!msg.isSelf && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: msg.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 800
                    }}>
                      {msg.initials}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 650, color: isLight ? '#0f172a' : '#f8fafc' }}>{msg.sender}</span>
                    <span style={{ fontSize: '9.5px', color: '#64748b' }}>{msg.time}</span>
                  </div>
                )}

                {msg.isSelf && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 650, color: isLight ? '#0f172a' : '#f8fafc' }}>{msg.sender}</span>
                    <span style={{ fontSize: '9.5px', color: '#64748b' }}>{msg.time}</span>
                  </div>
                )}

                <div className={msg.isSelf ? 'chat-outgoing' : 'chat-incoming'} style={{ maxWidth: '90%' }}>
                  {msg.text}
                </div>

                {/* Reaction Badges */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                  {(msg.reactions || []).map((r, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => handleReactionClick(msg.id, r.emoji)}
                      className="sm-reaction-pill"
                      style={{
                        background: r.reacted ? 'rgba(99, 102, 241, 0.2)' : isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                        border: r.reacted ? '1px solid rgba(99, 102, 241, 0.4)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        color: r.reacted ? '#6366f1' : isLight ? '#475569' : '#94a3b8',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.count}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => handleReactionClick(msg.id, '👍')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '0 2px'
                    }}
                    title="React with 👍"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontSize: '11.5px',
                  width: '100%',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                  <Smile 
                    size={14} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setChatInput(prev => prev + ' 👍')}
                    title="Add thumbs-up emoji"
                  />
                  <Paperclip 
                    size={14} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => showGlassToast.info('Files Vault', 'File attachments can be uploaded and managed in the Files tab.')}
                    title="Attach file"
                  />
                  <AtSign 
                    size={14} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setChatInput(prev => prev + `@${user?.fullname?.split(' ')[0] || 'Team'} `)}
                    title="Mention team member"
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.15s'
                  }}
                  className="sm-card-interactive"
                  title="Send message"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </form>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 5. FAR-RIGHT DOCKED ICON RAIL (Wrap / Unwrap on Right Side of Page) */}
      {/* ========================================================================= */}
      <aside className="sm-right-rail">
        {/* Top: Master Wrap/Unwrap All Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleAllRightPanels}
            className="sm-rail-btn"
            data-tooltip={allRightWrapped ? "Unwrap All Panels" : "Wrap All to Right Icons"}
            title={allRightWrapped ? "Unwrap all panels" : "Wrap all panels to right icons"}
          >
            {allRightWrapped ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <div style={{ width: '28px', height: '1px', backgroundColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
        </div>

        {/* Center: The 4 Box Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          
          {/* 1. Today's Agenda Icon */}
          <button
            onClick={() => {
              setIsAgendaWrapped(prev => {
                const next = !prev;
                if (!next) setNewAgendaCount(0);
                return next;
              });
            }}
            className={`sm-rail-icon ${!isAgendaWrapped ? 'active-unwrapped' : 'active-wrapped'}`}
            style={{
              '--icon-color': '#38bdf8',
              '--icon-bg': 'rgba(56, 189, 248, 0.15)',
              '--icon-border': 'rgba(56, 189, 248, 0.35)',
              color: '#38bdf8'
            }}
            data-tooltip="Today's Agenda"
          >
            <Calendar size={18} />
            {newAgendaCount > 0 && (
              <span className="sm-rail-badge" style={{ backgroundColor: '#0284c7' }}>
                {newAgendaCount}
              </span>
            )}
            {!isAgendaWrapped && <span className="sm-rail-active-dot" style={{ backgroundColor: '#38bdf8' }} />}
          </button>

          {/* 2. Recent Activities Icon */}
          <button
            onClick={() => {
              setIsActivityWrapped(prev => {
                const next = !prev;
                if (!next) setNewActivitiesCount(0);
                return next;
              });
            }}
            className={`sm-rail-icon ${!isActivityWrapped ? 'active-unwrapped' : 'active-wrapped'}`}
            style={{
              '--icon-color': '#10b981',
              '--icon-bg': 'rgba(16, 185, 129, 0.15)',
              '--icon-border': 'rgba(16, 185, 129, 0.35)',
              color: '#10b981'
            }}
            data-tooltip="Recent Activities"
          >
            <Activity size={18} />
            {newActivitiesCount > 0 && (
              <span className="sm-rail-badge" style={{ backgroundColor: '#059669' }}>
                {newActivitiesCount}
              </span>
            )}
            {!isActivityWrapped && <span className="sm-rail-active-dot" style={{ backgroundColor: '#10b981' }} />}
          </button>

          {/* 3. Upcoming Deadlines Icon */}
          <button
            onClick={() => {
              setIsDeadlinesWrapped(prev => {
                const next = !prev;
                if (!next) setNewDeadlinesCount(0);
                return next;
              });
            }}
            className={`sm-rail-icon ${!isDeadlinesWrapped ? 'active-unwrapped' : 'active-wrapped'}`}
            style={{
              '--icon-color': '#f59e0b',
              '--icon-bg': 'rgba(245, 158, 11, 0.15)',
              '--icon-border': 'rgba(245, 158, 11, 0.35)',
              color: '#f59e0b'
            }}
            data-tooltip="Upcoming Deadlines"
          >
            <Clock size={18} />
            {newDeadlinesCount > 0 && (
              <span className="sm-rail-badge" style={{ backgroundColor: '#d97706' }}>
                {newDeadlinesCount}
              </span>
            )}
            {!isDeadlinesWrapped && <span className="sm-rail-active-dot" style={{ backgroundColor: '#f59e0b' }} />}
          </button>

          {/* 4. Team Chat Icon */}
          <button
            onClick={() => {
              setIsChatWrapped(prev => {
                const next = !prev;
                if (!next) setNewMessagesCount(0);
                return next;
              });
            }}
            className={`sm-rail-icon ${!isChatWrapped ? 'active-unwrapped' : 'active-wrapped'}`}
            style={{
              '--icon-color': '#818cf8',
              '--icon-bg': 'rgba(99, 102, 241, 0.15)',
              '--icon-border': 'rgba(99, 102, 241, 0.35)',
              color: '#818cf8'
            }}
            data-tooltip="Team Chat"
          >
            <MessageSquare size={18} />
            {newMessagesCount > 0 && (
              <span className="sm-rail-badge" style={{ backgroundColor: '#4f46e5' }}>
                {newMessagesCount}
              </span>
            )}
            <span className="sm-rail-online-dot" />
            {!isChatWrapped && <span className="sm-rail-active-dot" style={{ backgroundColor: '#818cf8' }} />}
          </button>

        </div>
      </aside>

      {/* ========================================================================= */}
      {/* ADD TASK MODAL (Connected to MongoDB Database) */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="sm-card" style={{ width: '460px', padding: '24px', backgroundColor: isLight ? '#ffffff' : '#0f172a', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                Add New Task in {activeProjectName}
              </h3>
              <button 
                onClick={() => setIsTaskModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth Flow"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                  placeholder="Task details and scope..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Phase</label>
                  <select
                    value={newTaskPhase}
                    onChange={(e) => setNewTaskPhase(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 8px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Planning">Planning Phase</option>
                    <option value="Database">Database Phase</option>
                    <option value="Backend">Backend Phase</option>
                    <option value="Frontend">Frontend Phase</option>
                    <option value="Integration">Integration Phase</option>
                    <option value="Testing">Testing Phase</option>
                    <option value="Deployment">Deployment Phase</option>
                    <option value="General">General Deliverables</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 8px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Estimated Hours</label>
                  <input
                    type="number"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', display: 'block', marginBottom: '4px' }}>Assignee</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0 8px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '12px'
                  }}
                >
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.user?.fullname || emp.designation} ({emp.designation})
                    </option>
                  ))}
                  {employees.length === 0 && (
                    <option value="emp-harsh">Harsh Saini (Admin)</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isLight ? '#64748b' : '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="sm-btn-primary"
                  style={{ height: '36px', padding: '0 20px', borderRadius: '8px' }}
                >
                  {isSubmittingTask ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GENERATE NEW PROJECT MODAL (AI PLANNER INTEGRATION & CREATOR TRACKING)   */}
      {/* ========================================================================= */}
      {isProjectModalOpen && (
        <div className="sm-gen-modal-overlay">
          <div className="sm-gen-modal-card">
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                  flexShrink: 0
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc', margin: 0 }}>
                    Generate New Project with AI Planner
                  </h3>
                  <p style={{ fontSize: '11.5px', color: isLight ? '#475569' : '#94a3b8', margin: '3px 0 0', lineHeight: 1.4 }}>
                    Synthesize architectural blueprint, enterprise modules, and deliverable tasks
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                style={{
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: isLight ? '#64748b' : '#94a3b8',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
                  e.currentTarget.style.background = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isLight ? '#64748b' : '#94a3b8';
                  e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Creator Attribution Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLight ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.08)',
              border: isLight ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#4f46e5' : '#a5b4fc' }}>
                <User size={13} />
                <span>Generated by: <strong>{user?.fullname || 'Harsh Saini'}</strong></span>
              </div>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {user?.role || 'Super Admin'} Access
              </span>
            </div>

            {/* Project Input Form */}
            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Project Name */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                  Project Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  name="projName"
                  type="text"
                  required
                  placeholder="e.g. Enterprise Security Audit Platform"
                  style={{
                    width: '100%',
                    height: '38px',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '12.5px',
                    fontWeight: 550
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                  Well-Defined Description & Scope
                </label>
                <textarea
                  name="projDesc"
                  rows={3}
                  placeholder="Provide system goals, business objectives, compliance criteria, and key functional requirements to optimize AI task synthesis..."
                  style={{
                    width: '100%',
                    minHeight: '65px',
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Domain & Priority Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                    Project Domain / Category
                  </label>
                  <select
                    name="projCategory"
                    defaultValue="Security & Compliance"
                    style={{
                      width: '100%',
                      height: '38px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    <option value="Security & Compliance">Security & Compliance Audit</option>
                    <option value="AI & Machine Learning">AI Knowledge & Vector RAG Engine</option>
                    <option value="FinTech & Invoicing">FinTech & Invoicing / Billing Automation</option>
                    <option value="IoT & Fleet Tracking">IoT Telemetry & Fleet Tracking Suite</option>
                    <option value="Cloud Migration">Cloud Infrastructure Migration & DevOps</option>
                    <option value="Enterprise ERP & Operations">Enterprise ERP, Operations & Business Intelligence</option>
                    <option value="Vendor Management">Strategic Vendor & Procurement Portal</option>
                    <option value="Mobile Application">Cross-Platform Mobile Application</option>
                    <option value="General">General Enterprise Software</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                    Sprint Priority
                  </label>
                  <select
                    name="projPriority"
                    defaultValue="High"
                    style={{
                      width: '100%',
                      height: '38px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    <option value="Critical">Critical Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Architecture & Target Cloud Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                    Architecture Style
                  </label>
                  <select
                    name="projArchitecture"
                    defaultValue="Modular Microservices Architecture"
                    style={{
                      width: '100%',
                      height: '38px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '11.5px',
                      fontWeight: 500
                    }}
                  >
                    <option value="Modular Microservices Architecture">Modular Microservices</option>
                    <option value="Zero-Trust Microservices & Immutable Ledger">Zero-Trust & Audit Ledger</option>
                    <option value="Vector RAG & Async Worker Pipeline">Vector RAG & Async Worker</option>
                    <option value="Event-Driven Serverless Architecture">Event-Driven Serverless</option>
                    <option value="Clean Modular Monolith">Clean Modular Monolith</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                    Target Cloud Infrastructure
                  </label>
                  <select
                    name="projTargetCloud"
                    defaultValue="Multi-Region High-Availability Cloud (AWS / Azure)"
                    style={{
                      width: '100%',
                      height: '38px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '11.5px',
                      fontWeight: 500
                    }}
                  >
                    <option value="Multi-Region High-Availability Cloud (AWS / Azure)">Multi-Region AWS / Azure</option>
                    <option value="AWS GovCloud / High-Availability EKS Cluster">AWS GovCloud / EKS</option>
                    <option value="Google Cloud Platform & GPU Acceleration">Google Cloud with GPU</option>
                    <option value="PCI-DSS Tier 1 Certified Cloud Environment">PCI-DSS Tier 1 Cloud</option>
                    <option value="Hybrid Private Kubernetes Cluster">Private Hybrid K8s</option>
                  </select>
                </div>
              </div>

              {/* Start Date & Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                    Start Date
                  </label>
                  <input
                    name="projStartDate"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 650, color: isLight ? '#334155' : '#cbd5e1', display: 'block', marginBottom: '5px' }}>
                    Project Deadline
                  </label>
                  <input
                    name="projDeadline"
                    type="date"
                    defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {/* Actions: Cancel & Generate Tasks */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                marginTop: '10px',
                paddingTop: '14px',
                borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#64748b' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="sm-gen-btn"
                >
                  <Sparkles size={15} />
                  <span>{isSubmittingProject ? 'Synthesizing AI Tasks...' : 'Generate Tasks'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
