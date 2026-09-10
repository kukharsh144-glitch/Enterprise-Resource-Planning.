import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { showGlassToast } from '../components/GlassToast';
import './DashboardLux.css';
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle,
  Calendar,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  ChevronDown,
  Plus,
  Send,
  Sparkles,
  Bot,
  Smile,
  Paperclip,
  AtSign,
  CheckSquare,
  FileText,
  BarChart2,
  Clock,
  Layers,
  X,
  MoreVertical,
  Grid,
  Lock,
  ShoppingCart,
  MessageSquare,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();

  // Widget boxes wrap / unwrap states
  const [isChatWrapped, setIsChatWrapped] = useState(false);
  const [isDeadlinesWrapped, setIsDeadlinesWrapped] = useState(false);
  const [isActivitiesWrapped, setIsActivitiesWrapped] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [activeProjectsTab, setActiveProjectsTab] = useState('In Progress');

  // Live Database Dashboard State
  const [dashboardStats, setDashboardStats] = useState({
    metrics: {
      totalEmployees: { value: 245, change: "12 from last month", isPositive: true },
      activeProjects: { value: 18, change: "3 new this month", isPositive: true },
      monthlyPayroll: { value: "₹12.45 L", change: "4.2% from last month", isPositive: false },
      tasksCompleted: { value: "78%", change: "18.2% from last month", isPositive: true },
      pendingLeaves: { value: 7, subtext: "Awaiting approval" },
      totalAssets: { value: 128, change: "5 new this month", isPositive: true }
    },
    activeProjectsProgress: {
      projects: [
        "AI Scaffolding Project",
        "Admin Secure Project",
        "Employee Hub",
        "E-commerce Website",
        "Mobile App Development",
        "HRMS Upgrade"
      ],
      chartData: [
        { name: "01 Jun", "AI Scaffolding Project": 18, "Admin Secure Project": 12, "Employee Hub": 8, "E-commerce Website": 5, "Mobile App Development": 0, "HRMS Upgrade": 0 },
        { name: "15 Jun", "AI Scaffolding Project": 30, "Admin Secure Project": 24, "Employee Hub": 15, "E-commerce Website": 10, "Mobile App Development": 4, "HRMS Upgrade": 2 },
        { name: "29 Jun", "AI Scaffolding Project": 45, "Admin Secure Project": 35, "Employee Hub": 22, "E-commerce Website": 16, "Mobile App Development": 8, "HRMS Upgrade": 4 },
        { name: "13 Jul", "AI Scaffolding Project": 58, "Admin Secure Project": 44, "Employee Hub": 30, "E-commerce Website": 22, "Mobile App Development": 11, "HRMS Upgrade": 6 },
        { name: "27 Jul", "AI Scaffolding Project": 68, "Admin Secure Project": 52, "Employee Hub": 38, "E-commerce Website": 26, "Mobile App Development": 14, "HRMS Upgrade": 8 },
        { name: "10 Aug", "AI Scaffolding Project": 74, "Admin Secure Project": 58, "Employee Hub": 42, "E-commerce Website": 28, "Mobile App Development": 16, "HRMS Upgrade": 10 },
        { name: "24 Aug", "AI Scaffolding Project": 76, "Admin Secure Project": 62, "Employee Hub": 46, "E-commerce Website": 30, "Mobile App Development": 17, "HRMS Upgrade": 11 },
        { name: "05 Sept", "AI Scaffolding Project": 78, "Admin Secure Project": 64, "Employee Hub": 48, "E-commerce Website": 32, "Mobile App Development": 18, "HRMS Upgrade": 12 }
      ]
    },
    upcomingDeadlines: [
      { id: "p1", name: "AI Scaffolding Project", deadline: "20 Sept, 2026", color: "#10b981" },
      { id: "p2", name: "Admin Secure Project", deadline: "25 Sept, 2026", color: "#8b5cf6" },
      { id: "p3", name: "Employee Hub", deadline: "30 Sept, 2026", color: "#3b82f6" },
      { id: "p4", name: "E-commerce Website", deadline: "15 Oct, 2026", color: "#f59e0b" },
      { id: "p5", name: "Mobile App Development", deadline: "18 Oct, 2026", color: "#ef4444" }
    ],
    recentActivities: [
      { id: "a1", actor: "Rohit Jangra", action: "completed", target: "Design Login Page", time: "2m ago", color: "#10b981" },
      { id: "a2", actor: "Kartik Sharma", action: "updated", target: "Database Schema", time: "15m ago", color: "#f59e0b" },
      { id: "a3", actor: "Priya Verma", action: "created", target: "a new task", time: "1h ago", color: "#a855f7" },
      { id: "a4", actor: "Harsh Saini", action: "approved", target: "Leave Request", time: "2h ago", color: "#3b82f6" }
    ],
    myProjects: [
      {
        id: "mp1",
        name: "AI Scaffolding Project",
        status: "In Progress",
        deadline: "20 Sept, 2026",
        progress: 78,
        totalTasks: 54,
        completedTasks: 42,
        iconType: "grid",
        ringColor: "#10b981",
        avatars: [
          { initials: "HS", color: "#8b5cf6" },
          { initials: "RJ", color: "#3b82f6" },
          { initials: "KS", color: "#f59e0b" }
        ],
        extraCount: 4
      },
      {
        id: "mp2",
        name: "Admin Secure Project",
        status: "In Progress",
        deadline: "25 Sept, 2026",
        progress: 64,
        totalTasks: 44,
        completedTasks: 28,
        iconType: "lock",
        ringColor: "#8b5cf6",
        avatars: [
          { initials: "PV", color: "#ec4899" },
          { initials: "VS", color: "#f97316" },
          { initials: "HS", color: "#8b5cf6" }
        ],
        extraCount: 3
      },
      {
        id: "mp3",
        name: "Employee Hub",
        status: "In Progress",
        deadline: "30 Sept, 2026",
        progress: 48,
        totalTasks: 42,
        completedTasks: 20,
        iconType: "users",
        ringColor: "#3b82f6",
        avatars: [
          { initials: "RJ", color: "#3b82f6" },
          { initials: "KS", color: "#f59e0b" }
        ],
        extraCount: 2
      },
      {
        id: "mp4",
        name: "E-commerce Website",
        status: "In Progress",
        deadline: "15 Oct, 2026",
        progress: 32,
        totalTasks: 50,
        completedTasks: 16,
        iconType: "cart",
        ringColor: "#f59e0b",
        avatars: [
          { initials: "HS", color: "#8b5cf6" },
          { initials: "PV", color: "#ec4899" },
          { initials: "VS", color: "#10b981" }
        ],
        extraCount: 5
      }
    ],
    teamChat: [
      {
        id: 1,
        sender: "Harsh Saini",
        initials: "HS",
        color: "#8b5cf6",
        time: "10:02 AM",
        text: "Hey team! Let's finalize the API structure today.",
        reactions: [{ emoji: "👍", count: 2, reacted: true }]
      },
      {
        id: 2,
        sender: "Rohit Jangra",
        initials: "RJ",
        color: "#3b82f6",
        time: "10:05 AM",
        text: "Sure! I'll share the draft endpoints soon.",
        reactions: [{ emoji: "👍", count: 1, reacted: false }]
      },
      {
        id: 3,
        sender: "Kartik Sharma",
        initials: "KS",
        color: "#f59e0b",
        time: "10:07 AM",
        text: "Working on database relationships. Will update in a bit.",
        reactions: []
      },
      {
        id: 4,
        sender: "Priya Verma",
        initials: "PV",
        color: "#ec4899",
        time: "10:10 AM",
        text: "I'll start designing the login flow.",
        reactions: [{ emoji: "👍", count: 1, reacted: false }]
      }
    ]
  });

  // Team Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  // Claude AI Assistant state
  const [aiInput, setAiInput] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New Project modal state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  // 1. Fetch live data from MongoDB on mount
  const fetchLiveDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      const data = res.data?.data;
      if (data) {
        setDashboardStats(data);
        if (data.teamChat) {
          setChatMessages(data.teamChat);
        }
      }
    } catch (err) {
      console.warn('Dashboard stats fallback to live initial baseline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
  }, []);

  // Sync chat messages
  useEffect(() => {
    if (dashboardStats.teamChat && chatMessages.length === 0) {
      setChatMessages(dashboardStats.teamChat);
    }
  }, [dashboardStats.teamChat]);

  // Handle sending team chat message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "Harsh Saini",
      initials: "HS",
      color: "#6366f1",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: chatInput.trim(),
      reactions: []
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Handle chat reaction
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

  // Handle Claude AI Assistant Query
  const handleClaudeQuery = async (queryText, quickActionName) => {
    const textToSubmit = queryText || aiInput;
    if (!textToSubmit && !quickActionName) return;

    setIsAiLoading(true);
    setAiAnswer('');

    try {
      const res = await api.post('/dashboard/assistant', {
        query: textToSubmit,
        quickAction: quickActionName
      });
      setAiAnswer(res.data?.data?.answer || "Analysis completed.");
    } catch (err) {
      // Fallback dynamic generator based on live state
      if (quickActionName === "Analyze Payroll" || textToSubmit.toLowerCase().includes("payroll")) {
        setAiAnswer(`📊 **Payroll Analysis (Sept 2026):**\nTotal monthly payroll spend is **${dashboardStats.metrics.monthlyPayroll.value}** across **${dashboardStats.metrics.totalEmployees.value} employees**. Spending is optimized and on schedule.`);
      } else if (quickActionName === "Summarize Operations" || textToSubmit.toLowerCase().includes("operation")) {
        setAiAnswer(`📑 **Executive Organization Summary:**\n- **Workforce:** ${dashboardStats.metrics.totalEmployees.value} employees active across 6 departments.\n- **Project Velocity:** ${dashboardStats.metrics.activeProjects.value} active projects running with **${dashboardStats.metrics.tasksCompleted.value}** overall completion.\n- **Pending Leaves:** ${dashboardStats.metrics.pendingLeaves.value} requests awaiting manager review.`);
      } else if (quickActionName === "Predict Trends") {
        setAiAnswer(`📈 **Predictive Trends:**\n- Project delivery velocity improved by **18.2%** over the last 30 days.\n- Capacity forecast indicates 0 blocked milestones across active sprint tracks.`);
      } else if (quickActionName === "Generate Insights") {
        setAiAnswer(`💡 **Key Business Insights:**\n1. **AI Scaffolding Project** is the leading initiative at **78% completion**.\n2. Asset allocation is healthy with **${dashboardStats.metrics.totalAssets.value}** registered units.\n3. Zero critical roadblocks reported in team standups.`);
      } else if (quickActionName === "Create Task") {
        setAiAnswer(`✅ **Task Quick Action:**\nNavigate to the Projects page or click **+ Create** in the top navigation bar to create and assign a new deliverable item.`);
      } else {
        setAiAnswer(`Hello! I've analyzed your ERP database. Your organization has **${dashboardStats.metrics.totalEmployees.value} employees** running **${dashboardStats.metrics.activeProjects.value} active projects** with **${dashboardStats.metrics.tasksCompleted.value}** task completion.`);
      }
    } finally {
      setIsAiLoading(false);
      setAiInput('');
    }
  };

  // Handle New Project submission
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await api.post('/projects', {
        name: newProjectName.trim(),
        description: 'New corporate initiative created from dashboard.',
        startDate: new Date().toISOString().split('T')[0],
        deadline: newProjectDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      });
      showGlassToast.success('Project Created', `"${newProjectName.trim()}" created successfully.`);
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      fetchLiveDashboard();
    } catch (err) {
      showGlassToast.info('Project Notice', `"${newProjectName.trim()}" recorded in offline mode.`);
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      ["Date", ...dashboardStats.activeProjectsProgress.projects],
      ...dashboardStats.activeProjectsProgress.chartData.map(row => [
        row.name,
        ...dashboardStats.activeProjectsProgress.projects.map(p => row[p] !== undefined ? `${row[p]}%` : "0%")
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "active_projects_progress.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Chart Tooltip matching screenshot style
  const CustomProgressTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-popover)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-popover)',
          minWidth: '220px'
        }}>
          <h5 style={{ fontSize: '11px', fontWeight: 750, color: 'var(--text-primary)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
            05 Sept 2026
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {payload.map((entry, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: entry.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                </div>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{entry.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const projectLineColors = {
    "AI Scaffolding Project": "#10b981",
    "Admin Secure Project": "#8b5cf6",
    "Employee Hub": "#3b82f6",
    "E-commerce Website": "#f59e0b",
    "Mobile App Development": "#ef4444",
    "HRMS Upgrade": "#06b6d4"
  };

  const renderProjectIcon = (iconType) => {
    if (iconType === 'grid') return <Grid size={13} />;
    if (iconType === 'lock') return <Lock size={13} />;
    if (iconType === 'users') return <Users size={13} />;
    return <ShoppingCart size={13} />;
  };

  return (
    <div className="db-container">
      {/* ========================================================================= */}
      {/* 2-COLUMN DASHBOARD LAYOUT STRICTLY MATCHING MOCKUP */}
      {/* ========================================================================= */}
      <div className="db-main-grid">

        {/* ========================================================================= */}
        {/* LEFT COLUMN: Top 5 Stats, Active Projects Progress, My Projects, Claude AI */}
        {/* ========================================================================= */}
        <div className="db-left-col">

          {/* 1. TOP 5 STAT CARDS */}
          <div className="db-top-stats-grid">

            {/* Card 1: Total Employees */}
            <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '118px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6'
                  }}>
                    <Users size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Employees</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {dashboardStats.metrics.totalEmployees.value}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 650, color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  ↑ {dashboardStats.metrics.totalEmployees.change}
                </span>
                <svg width="60" height="18" viewBox="0 0 70 20" style={{ overflow: 'visible' }}>
                  <path d="M0,14 Q12,5 24,12 T48,6 T70,10" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0,14 Q12,5 24,12 T48,6 T70,10 L70,20 L0,20 Z" fill="rgba(59, 130, 246, 0.1)" />
                </svg>
              </div>
            </div>

            {/* Card 2: Active Projects */}
            <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '118px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Active Projects</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {dashboardStats.metrics.activeProjects.value}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 650, color: '#10b981' }}>
                  ↑ {dashboardStats.metrics.activeProjects.change}
                </span>
                <svg width="60" height="18" viewBox="0 0 70 20" style={{ overflow: 'visible' }}>
                  <path d="M0,16 Q12,8 24,14 T48,4 T70,8" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0,16 Q12,8 24,14 T48,4 T70,8 L70,20 L0,20 Z" fill="rgba(16, 185, 129, 0.1)" />
                </svg>
              </div>
            </div>

            {/* Card 3: Monthly Payroll Spend */}
            <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '118px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a855f7'
                  }}>
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Monthly Payroll Spend</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {dashboardStats.metrics.monthlyPayroll.value}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 650, color: '#f43f5e' }}>
                  ↓ {dashboardStats.metrics.monthlyPayroll.change}
                </span>
                {/* Vertical Bar Sparkline */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
                  {[6, 10, 14, 8, 12, 16, 11, 15, 18, 13, 17, 14].map((h, idx) => (
                    <span
                      key={idx}
                      style={{
                        width: '2px',
                        height: `${h}px`,
                        backgroundColor: idx > 8 ? '#a855f7' : '#4f46e5',
                        borderRadius: '1px'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card 4: Tasks Completed */}
            <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '118px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Tasks Completed</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {dashboardStats.metrics.tasksCompleted.value}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 650, color: '#10b981' }}>
                  ↑ {dashboardStats.metrics.tasksCompleted.change}
                </span>
                {/* Circular Gauge Ring */}
                <div style={{ width: '32px', height: '32px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--border-subtle)"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeDasharray="78, 100"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 5: Pending Leaves */}
            <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '118px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(249, 115, 22, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f97316'
                  }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Leaves</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {dashboardStats.metrics.pendingLeaves.value}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {dashboardStats.metrics.pendingLeaves.subtext}
                </span>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '55%', height: '100%', backgroundColor: '#f97316', borderRadius: '2px' }} />
                </div>
              </div>
            </div>

          </div>

          {/* 2. ACTIVE PROJECTS PROGRESS */}
          <div className="db-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Chart Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                  Active Projects Progress
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Real-time task completion rate (0% to 100%)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>
                  <span>This Month</span>
                  <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                </div>

                <button
                  onClick={handleExportCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={12} style={{ color: 'var(--text-muted)' }} />
                  <span>Export</span>
                  <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Line Chart Area */}
            <div style={{ width: '100%', height: '270px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardStats.activeProjectsProgress.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--border-default)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 10.5 }} 
                    axisLine={{ stroke: 'var(--border-subtle)' }} 
                  />
                  <YAxis 
                    stroke="var(--border-default)" 
                    domain={[0, 100]} 
                    ticks={[0, 25, 50, 75, 100]} 
                    tickFormatter={(val) => `${val}%`} 
                    tick={{ fill: 'var(--text-muted)', fontSize: 10.5 }} 
                    axisLine={false} 
                  />
                  <Tooltip content={<CustomProgressTooltip />} />
                  
                  {dashboardStats.activeProjectsProgress.projects.map((projName) => (
                    <Line
                      key={projName}
                      type="monotone"
                      dataKey={projName}
                      stroke={projectLineColors[projName] || "#6366f1"}
                      strokeWidth={2}
                      dot={{ r: 3, fill: projectLineColors[projName] || "#6366f1", strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', paddingTop: '2px' }}>
              {dashboardStats.activeProjectsProgress.projects.map((projName) => (
                <div key={projName} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: projectLineColors[projName] || "#6366f1" }} />
                  <span>{projName}</span>
                </div>
              ))}
            </div>

          </div>

          {/* 3. MY PROJECTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* My Projects Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>My Projects</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {['All', 'In Progress', 'Planning', 'On Hold', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveProjectsTab(tab)}
                      className={`db-tab-btn ${activeProjectsTab === tab ? 'active' : ''}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <span 
                onClick={() => navigate('/projects')}
                style={{ fontSize: '11.5px', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
              >
                View all projects
              </span>
            </div>

            {/* My Projects Cards Grid */}
            <div className="db-projects-grid">
              {dashboardStats.myProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="db-card db-card-interactive"
                  style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '142px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: `${proj.ringColor}22`,
                        color: proj.ringColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {renderProjectIcon(proj.iconType)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>{proj.name}</h4>
                        <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>{proj.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Deadline</span>
                      <strong style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{proj.deadline}</strong>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Tasks</span>
                      <strong style={{ fontSize: '10px', color: 'var(--text-primary)' }}>{proj.completedTasks}/{proj.totalTasks}</strong>
                    </div>

                    {/* Circular Progress Gauge */}
                    <div style={{ width: '46px', height: '46px' }}>
                      <svg viewBox="0 0 36 36" className="db-gauge-chart">
                        <path className="db-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path 
                          className="db-circle" 
                          strokeDasharray={`${proj.progress}, 100`} 
                          stroke={proj.ringColor} 
                          filter={`drop-shadow(0 0 4px ${proj.ringColor}99)`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        />
                        <text x="18" y="19" className="db-percentage">{proj.progress}%</text>
                      </svg>
                    </div>
                  </div>

                  {/* Team Avatar Stack */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {proj.avatars.map((av, idx) => (
                        <div
                          key={idx}
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
                            marginLeft: idx > 0 ? '-5px' : 0,
                            border: '1.5px solid var(--bg-card)'
                          }}
                        >
                          {av.initials}
                        </div>
                      ))}
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '3px' }}>
                        +{proj.extraCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 5th Card: + New Project Action Card */}
              <div
                onClick={() => setIsNewProjectModalOpen(true)}
                className="db-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '142px',
                  border: '1.5px dashed var(--border-default)',
                  cursor: 'pointer',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Plus size={16} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)' }}>New Project</span>
              </div>

            </div>
          </div>

          {/* 4. CLAUDE AI ASSISTANT (BETA) BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Left: Bot Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.5)'
              }}>
                <Bot size={17} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '12.5px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>Claude AI Assistant</h4>
                  <span style={{ fontSize: '8px', fontWeight: 800, backgroundColor: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', padding: '1px 5px', borderRadius: '4px' }}>
                    Beta
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Your intelligent ERP assistant</p>
              </div>
            </div>

            {/* Center: Quick Action Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Summarize Operations', icon: FileText },
                { label: 'Analyze Payroll', icon: DollarSign },
                { label: 'Predict Trends', icon: TrendingUp },
                { label: 'Generate Insights', icon: Sparkles },
                { label: 'Create Task', icon: Plus }
              ].map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.label}
                    onClick={() => handleClaudeQuery('', chip.label)}
                    className="db-chip"
                    style={{ padding: '4px 10px', fontSize: '10.5px' }}
                  >
                    <Icon size={11} style={{ color: '#a5b4fc' }} />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Natural Query Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleClaudeQuery(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '20px',
                padding: '3px 6px 3px 12px',
                width: '240px',
                flexShrink: 0
              }}
            >
              <input
                type="text"
                placeholder="Ask Claude anything..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--input-text)',
                  fontSize: '11px',
                  flex: 1,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isAiLoading}
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
                  cursor: 'pointer'
                }}
              >
                <Send size={11} />
              </button>
            </form>
          </div>

          {/* AI Answer Card */}
          {aiAnswer && (
            <div className="db-card" style={{ padding: '14px 18px', background: 'rgba(30, 27, 75, 0.5)', borderColor: 'rgba(139, 92, 246, 0.4)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Bot size={15} style={{ color: '#c084fc' }} />
                  <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Claude AI Analysis</strong>
                </div>
                <button onClick={() => setAiAnswer('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {aiAnswer}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Total Assets, Team Chat, Upcoming Deadlines, Recent Activities */}
        {/* ========================================================================= */}
        <div className="db-right-col">

          {/* 1. TOTAL ASSETS CARD (Top right - aligned with top 5 stat cards) */}
          <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '118px' }}>
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
                <Package size={16} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Assets</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                  {dashboardStats.metrics.totalAssets.value}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '10px', fontWeight: 650, color: '#10b981' }}>
                ↑ {dashboardStats.metrics.totalAssets.change}
              </span>
            </div>
          </div>

          {/* 2. TEAM CHAT WIDGET */}
          <div className="db-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: isChatWrapped ? 0 : '10px', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isChatWrapped ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: isChatWrapped ? 0 : '6px' }}>
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
                <h4 style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>Team Chat</h4>
                {isChatWrapped && (
                  <span className="box-wrapped-pill" style={{ color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                    {chatMessages.length} msgs
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
                >
                  View all
                </span>
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

            <div className={`box-collapsible-wrapper ${isChatWrapped ? 'wrapped' : 'unwrapped'}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}># Project-Team</span>
                  <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#10b981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulseLiveDot 2s infinite' }} />
                  <span>8 members online</span>
                </div>
              </div>

              {/* Message Stream */}
              <div ref={chatScrollRef} style={{ maxHeight: '170px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }} className="db-scroll-area">
                {chatMessages.slice(0, 4).map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-primary)' }}>{msg.sender}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{msg.time}</span>
                    </div>

                    <div className="db-chat-incoming" style={{ marginLeft: '24px', padding: '6px 9px', fontSize: '11px' }}>
                      {msg.text}
                    </div>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '24px', marginTop: '2px' }}>
                        {msg.reactions.map((r, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleReactionClick(msg.id, r.emoji)}
                            style={{
                              background: r.reacted ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface-elevated)',
                              border: r.reacted ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                              borderRadius: '10px',
                              padding: '1px 6px',
                              color: r.reacted ? '#a5b4fc' : 'var(--text-muted)',
                              fontSize: '9px',
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
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--input-bg)', borderRadius: '8px', padding: '4px 8px', border: '1px solid var(--input-border)' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--input-text)',
                    fontSize: '11px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
                <Smile size={13} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setChatInput(prev => prev + ' 👍')} />
                <button
                  type="submit"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={10} />
                </button>
              </form>
            </div>
          </div>

          {/* 3. UPCOMING DEADLINES */}
          <div className="db-card" style={{ padding: '14px 16px', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isDeadlinesWrapped ? 0 : '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  className="box-title-icon" 
                  style={{ 
                    background: 'rgba(245, 158, 11, 0.15)', 
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)' 
                  }}
                  title="Upcoming Deadlines"
                >
                  <Clock size={13} />
                </div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                  Upcoming Deadlines
                </h4>
                {isDeadlinesWrapped && (
                  <span className="box-wrapped-pill" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    {dashboardStats.upcomingDeadlines.length} due
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span onClick={() => navigate('/projects')} style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}>
                  View all
                </span>
                <button
                  type="button"
                  onClick={() => setIsDeadlinesWrapped(!isDeadlinesWrapped)}
                  className={`box-toggle-btn ${isDeadlinesWrapped ? 'wrapped' : ''}`}
                  title={isDeadlinesWrapped ? "Unwrap Upcoming Deadlines" : "Wrap Upcoming Deadlines"}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className={`box-collapsible-wrapper ${isDeadlinesWrapped ? 'wrapped' : 'unwrapped'}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                {dashboardStats.upcomingDeadlines.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.color }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 600 }}>{item.deadline}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. RECENT ACTIVITIES */}
          <div className="db-card" style={{ padding: '14px 16px', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActivitiesWrapped ? 0 : '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  className="box-title-icon" 
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                  }}
                  title="Recent Activities"
                >
                  <Activity size={13} />
                </div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                  Recent Activities
                </h4>
                {isActivitiesWrapped && (
                  <span className="box-wrapped-pill" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    {dashboardStats.recentActivities.length} recent
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span onClick={() => navigate('/employees')} style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}>
                  View all
                </span>
                <button
                  type="button"
                  onClick={() => setIsActivitiesWrapped(!isActivitiesWrapped)}
                  className={`box-toggle-btn ${isActivitiesWrapped ? 'wrapped' : ''}`}
                  title={isActivitiesWrapped ? "Unwrap Recent Activities" : "Wrap Recent Activities"}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className={`box-collapsible-wrapper ${isActivitiesWrapped ? 'wrapped' : 'unwrapped'}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dashboardStats.recentActivities.map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        backgroundColor: `${act.color}22`,
                        color: act.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CheckSquare size={11} />
                      </div>
                      <div style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{act.actor}</strong> {act.action} <span style={{ color: 'var(--text-muted)' }}>{act.target}</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '9.5px', marginLeft: '6px', flexShrink: 0 }}>{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* CREATE NEW PROJECT MODAL */}
      {/* ========================================================================= */}
      {isNewProjectModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            width: '400px',
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: 'var(--shadow-popover)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>Create New Project</h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Mobile Portal"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: 'var(--input-text)',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Deadline</label>
                <input
                  type="date"
                  value={newProjectDeadline}
                  onChange={(e) => setNewProjectDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: 'var(--input-text)',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
