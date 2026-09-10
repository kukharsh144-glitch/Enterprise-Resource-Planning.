import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  Bot, 
  Sparkles, 
  Check, 
  X, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  User, 
  Trash2, 
  Plus, 
  Edit3, 
  CheckCircle,
  ShieldAlert,
  List,
  Compass,
  Code,
  Database,
  Server,
  LayoutGrid,
  Layers,
  Rocket,
  Activity,
  CheckSquare,
  Shield,
  Layers3,
  Award,
  Filter,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus
} from 'lucide-react';

import { showGlassToast } from '../components/GlassToast';

// Helper to calculate initials from a full name
const getInitials = (name) => {
  if (!name) return 'EM';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AIProjectDashboard = ({ projectId, projectName, onTasksUpdated }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [employees, setEmployees] = useState([]);


  const [editingTaskIdx, setEditingTaskIdx] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskHours, setEditTaskHours] = useState(16);
  const [editTaskPriority, setEditTaskPriority] = useState('Medium');
  const [editTaskAssignee, setEditTaskAssignee] = useState('');
  const [editTaskPhase, setEditTaskPhase] = useState('Planning');
  const [techFilter, setTechFilter] = useState('All');

  // Multi-employee phase assignment mapping: { [phaseName]: [empId1, empId2, ...] }
  const [phaseTeamMap, setPhaseTeamMap] = useState({});

  // Wrap entire Project Overview & Architectural Blueprint section (default: wrapped)
  const [isOverviewSectionWrapped, setIsOverviewSectionWrapped] = useState(true);

  // Wrappable overview boxes state (default: wrapped)
  const [wrappedBoxes, setWrappedBoxes] = useState({
    overview: true,
    missingReqs: true,
    securityRisks: true,
    techStack: true,
    modules: true,
    skillGaps: true
  });

  const toggleBoxWrap = (boxId) => {
    setWrappedBoxes(prev => ({
      ...prev,
      [boxId]: !prev[boxId]
    }));
  };

  const toggleAllOverviewBoxes = () => {
    const allWrapped = Object.values(wrappedBoxes).every(Boolean);
    setWrappedBoxes({
      overview: !allWrapped,
      missingReqs: !allWrapped,
      securityRisks: !allWrapped,
      techStack: !allWrapped,
      modules: !allWrapped,
      skillGaps: !allWrapped
    });
  };
  
  useEffect(() => {
    setPhaseTeamMap({});
    fetchAnalysisReport();
    fetchEmployees();
  }, [projectId]);

  const fetchAnalysisReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/ai/analysis`);
      setAnalysis(res.data?.data || res.data);
    } catch (err) {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data?.data?.employees || res.data?.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/ai/analyze`);
      setAnalysis(res.data?.data || res.data);
      showGlassToast.success(
        'AI Plan Generated',
        'Successfully synthesized architecture blueprint, enterprise modules, and lifecycle deliverables.'
      );
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to analyze project. Please try again.';
      showGlassToast.error('Analysis Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskField = (idx, field, value) => {
    setAnalysis(prev => {
      const tasks = prev.recommendedTasks.map((t, i) => i === idx ? { ...t, [field]: value } : t);
      return { ...prev, recommendedTasks: tasks };
    });
  };

  const handleDeleteTask = (idx) => {
    setAnalysis(prev => {
      const tasks = prev.recommendedTasks.filter((_, i) => i !== idx);
      return { ...prev, recommendedTasks: tasks };
    });
  };

  const handleStartEdit = (idx, task) => {
    setEditingTaskIdx(idx);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description);
    setEditTaskHours(task.estimatedHours || 16);
    setEditTaskPriority(task.priority || 'Medium');
    setEditTaskPhase(task.phase || 'Planning');
    const matchedRec = (analysis?.teamRecommendations || []).find(r => r.taskTitle === task.title);
    setEditTaskAssignee(task.assignedTo || matchedRec?.recommendedEmployee || '');
  };

  const handleSaveEdit = () => {
    if (editingTaskIdx === null) return;
    
    setAnalysis(prev => {
      const tasks = prev.recommendedTasks.map((t, i) => {
        if (i === editingTaskIdx) {
          return {
            ...t,
            title: editTaskTitle,
            description: editTaskDesc,
            estimatedHours: Number(editTaskHours) || 16,
            priority: editTaskPriority,
            phase: editTaskPhase,
            assignedTo: editTaskAssignee
          };
        }
        return t;
      });

      const recs = (prev.teamRecommendations || []).map(r => {
        if (r.taskTitle === prev.recommendedTasks[editingTaskIdx].title) {
          const emp = employees.find(e => e._id === editTaskAssignee);
          return {
            ...r,
            taskTitle: editTaskTitle,
            recommendedEmployee: editTaskAssignee,
            recommendedEmployeeName: emp ? (emp.user?.fullname || emp.designation) : 'Unassigned',
            skillMatchPercent: editTaskAssignee ? 100 : 0
          };
        }
        return r;
      });

      return { ...prev, recommendedTasks: tasks, teamRecommendations: recs };
    });

    setEditingTaskIdx(null);
  };

  const handleAddCustomTask = () => {
    const newTaskTitle = `Custom Task ${(analysis?.recommendedTasks?.length || 0) + 1}`;
    setAnalysis(prev => {
      const newTask = {
        title: newTaskTitle,
        description: 'Custom implementation deliverable specifications...',
        phase: 'Planning',
        priority: 'Medium',
        complexity: 'Medium',
        estimatedHours: 16,
        requiredSkills: ['JavaScript'],
        dependencies: [],
        recommendedRole: 'Software Engineer',
        acceptanceCriteria: ['Task compiles and fulfills functional requirements.'],
        potentialRisks: []
      };
      
      const newRec = {
        taskTitle: newTaskTitle,
        recommendedEmployee: null,
        skillMatchPercent: 0,
        reason: 'Manually added custom step.'
      };

      return {
        ...prev,
        recommendedTasks: [...(prev.recommendedTasks || []), newTask],
        teamRecommendations: [...(prev.teamRecommendations || []), newRec]
      };
    });
  };

  // Sync phase team map when analysis tasks are loaded
  useEffect(() => {
    if (analysis?.recommendedTasks && Array.isArray(analysis.recommendedTasks)) {
      setPhaseTeamMap(prev => {
        const nextMap = { ...prev };
        analysis.recommendedTasks.forEach(task => {
          if (task.phase && task.assignedTo) {
            if (!nextMap[task.phase]) {
              nextMap[task.phase] = [];
            }
            if (!nextMap[task.phase].includes(task.assignedTo)) {
              nextMap[task.phase] = [...nextMap[task.phase], task.assignedTo];
            }
          }
        });
        return nextMap;
      });
    }
  }, [analysis?.recommendedTasks]);

  // Multi-employee phase distribution logic
  const distributePhaseTasks = (phase, teamList) => {
    setAnalysis(prev => {
      if (!prev) return prev;
      let counter = 0;

      const updatedTasks = (prev.recommendedTasks || []).map(t => {
        if (t.phase === phase) {
          if (!teamList || teamList.length === 0) {
            return { ...t, assignedTo: '' };
          }
          const assignedEmpId = teamList[counter % teamList.length];
          counter++;
          return { ...t, assignedTo: assignedEmpId };
        }
        return t;
      });

      const updatedRecs = (prev.teamRecommendations || []).map(r => {
        const matchingTask = updatedTasks.find(t => t.title === r.taskTitle && t.phase === phase);
        if (matchingTask) {
          if (matchingTask.assignedTo) {
            const emp = employees.find(e => e._id === matchingTask.assignedTo);
            const empName = emp ? (emp.user?.fullname || emp.designation) : 'Assigned';
            return {
              ...r,
              recommendedEmployee: matchingTask.assignedTo,
              recommendedEmployeeName: empName,
              skillMatchPercent: 100,
              reason: `Assigned to ${phase} Phase team specialist.`
            };
          } else {
            return {
              ...r,
              recommendedEmployee: null,
              recommendedEmployeeName: 'Unassigned',
              skillMatchPercent: 0,
              reason: `Unassigned phase deliverable.`
            };
          }
        }
        return r;
      });

      return {
        ...prev,
        recommendedTasks: updatedTasks,
        teamRecommendations: updatedRecs
      };
    });
  };

  const handleAddEmployeeToPhase = (phase, employeeId) => {
    if (!employeeId) return;
    const emp = employees.find(e => e._id === employeeId);
    const empName = emp ? (emp.user?.fullname || emp.designation) : 'Team Member';

    setPhaseTeamMap(prev => {
      const currentList = prev[phase] || [];
      if (currentList.includes(employeeId)) return prev;
      const nextList = [...currentList, employeeId];
      distributePhaseTasks(phase, nextList);
      return { ...prev, [phase]: nextList };
    });

    showGlassToast.info('Phase Team Updated', `${empName} assigned to ${phase} Phase. Deliverables auto-distributed.`);
  };

  const handleRemoveEmployeeFromPhase = (phase, employeeId) => {
    const emp = employees.find(e => e._id === employeeId);
    const empName = emp ? (emp.user?.fullname || emp.designation) : 'Team Member';

    setPhaseTeamMap(prev => {
      const currentList = prev[phase] || [];
      const nextList = currentList.filter(id => id !== employeeId);
      distributePhaseTasks(phase, nextList);
      return { ...prev, [phase]: nextList };
    });

    showGlassToast.warning('Member Removed', `${empName} removed from ${phase} Phase. Deliverables updated.`);
  };

  const handleAutoAssignAllPhases = () => {
    if (!analysis?.recommendedTasks || employees.length === 0) {
      showGlassToast.warning('No Employees Found', 'Cannot auto-assign: No employee records available in workspace.');
      return;
    }

    const currentTasks = [...analysis.recommendedTasks];
    const phases = [...new Set(currentTasks.map(t => t.phase).filter(Boolean))];
    const newPhaseMap = { ...phaseTeamMap };

    phases.forEach((phase, pIdx) => {
      const existingTeam = newPhaseMap[phase] ? [...newPhaseMap[phase]] : [];

      currentTasks.filter(t => t.phase === phase).forEach(task => {
        const rec = (analysis.teamRecommendations || []).find(r => r.taskTitle === task.title);
        const recEmpId = rec?.recommendedEmployee;
        if (recEmpId && employees.some(e => String(e._id) === String(recEmpId))) {
          if (!existingTeam.includes(recEmpId)) {
            existingTeam.push(recEmpId);
          }
        }
      });

      if (existingTeam.length === 0 && employees.length > 0) {
        const fallbackEmp = employees[pIdx % employees.length];
        existingTeam.push(fallbackEmp._id);
      }

      newPhaseMap[phase] = existingTeam;

      let counter = 0;
      currentTasks.forEach((t, idx) => {
        if (t.phase === phase) {
          const assignedEmpId = existingTeam[counter % existingTeam.length];
          counter++;
          currentTasks[idx] = { ...t, assignedTo: assignedEmpId };
        }
      });
    });

    setPhaseTeamMap(newPhaseMap);
    setAnalysis(prev => ({
      ...prev,
      recommendedTasks: currentTasks
    }));

    showGlassToast.success(
      'Phases Auto-Assigned',
      `Assigned team members across all ${phases.length} phases. You can now confirm and proceed.`
    );
  };

  const handleApprove = async () => {
    if (!analysis) return;

    const tasks = analysis.recommendedTasks || [];
    if (tasks.length === 0) {
      showGlassToast.warning('No Deliverables to Confirm', 'Please generate or add deliverables before confirming.');
      return;
    }

    // Strict validation: Verify every task has an assigned employee
    const unassignedTasks = tasks.filter(t => {
      return !t.assignedTo || !employees.some(e => String(e._id) === String(t.assignedTo));
    });

    if (unassignedTasks.length > 0) {
      const unassignedPhases = [...new Set(unassignedTasks.map(t => t.phase || 'Uncategorized'))];
      showGlassToast.error(
        'Employee Assignment Required',
        `Cannot proceed to the next step: ${unassignedTasks.length} task(s) across ${unassignedPhases.length} phase(s) [${unassignedPhases.slice(0, 3).join(', ')}${unassignedPhases.length > 3 ? '...' : ''}] have no employee assigned. You must assign employees to all phases or tasks before confirming.`,
        9000,
        {
          label: '⚡ Auto-Assign All Phases',
          onClick: handleAutoAssignAllPhases
        }
      );
      return; // STOP! DO NOT PROCEED TO NEXT STEP!
    }

    setIsApproving(true);
    try {
      const payload = {
        name: projectName,
        description: analysis.projectOverview?.projectPurpose,
        startDate: analysis.startDate,
        deadline: analysis.deadline,
        tasks: tasks.map(t => ({
          title: t.title,
          description: t.description,
          estimatedHours: t.estimatedHours || 16,
          priority: t.priority || 'Medium',
          startDate: t.startDate,
          dueDate: t.dueDate,
          dependencies: t.dependencies || [],
          assignedTo: t.assignedTo,
          parentTaskTitle: t.parentTaskTitle,
          phase: t.phase || 'Planning',
          category: t.category || 'Engineering'
        }))
      };

      await api.post(`/projects/${projectId}/ai/approve`, payload);
      showGlassToast.success(
        'Plan Confirmed & Provisioned',
        `Successfully provisioned all ${tasks.length} deliverables to the Kanban board and lifecycle pipeline.`
      );

      if (typeof onTasksUpdated === 'function') {
        onTasksUpdated();
      }
      await fetchAnalysisReport();
    } catch (err) {
      console.error('Approve plan error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to approve project plan. Please try again.';
      showGlassToast.error('Confirmation Error', errMsg, 8000);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDiscard = () => {
    setAnalysis(null);
    showGlassToast.info('Plan Reset', 'AI recommendations cleared. You can generate a fresh analysis anytime.');
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e._id === empId);
    return emp ? (emp.user?.fullname || emp.designation) : 'Unassigned';
  };

  // Dynamic Phase Discovery from recommendations
  const canonicalPhases = useMemo(() => [
    "Planning",
    "Architecture",
    "Database",
    "Backend",
    "Frontend",
    "Integration",
    "Security",
    "Testing",
    "DevOps",
    "Deployment",
    "Monitoring"
  ], []);

  const activePhases = useMemo(() => {
    if (!analysis?.recommendedTasks) return canonicalPhases;
    const present = [...new Set(analysis.recommendedTasks.map(t => t.phase).filter(Boolean))];
    return present.sort((a, b) => {
      const idxA = canonicalPhases.findIndex(p => p.toLowerCase() === a.toLowerCase());
      const idxB = canonicalPhases.findIndex(p => p.toLowerCase() === b.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [analysis, canonicalPhases]);

  const getPhaseMeta = (phaseName) => {
    switch ((phaseName || '').toLowerCase()) {
      case 'planning': return { icon: Compass, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
      case 'architecture': return { icon: Code, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
      case 'database': return { icon: Database, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'backend': return { icon: Server, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)' };
      case 'frontend': return { icon: LayoutGrid, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'integration': return { icon: Layers, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
      case 'security': return { icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'testing': return { icon: CheckSquare, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'devops': return { icon: Cpu, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
      case 'deployment': return { icon: Rocket, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'monitoring': return { icon: Activity, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' };
      default: return { icon: Briefcase, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
    }
  };

  // Filtered Tech Stack
  const filteredTechList = useMemo(() => {
    if (analysis?.technologiesDetail && analysis.technologiesDetail.length > 0) {
      if (techFilter === 'All') return analysis.technologiesDetail;
      return analysis.technologiesDetail.filter(t => (t.category || '').toLowerCase() === techFilter.toLowerCase());
    }
    return null;
  }, [analysis, techFilter]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', gap: '20px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: '#f59e0b',
          animation: 'spin 1.2s linear infinite'
        }} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>🤖 Enterprise AI Planning Engine Analyzing...</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Evaluating project requirements, mapping staff skill sets, and calculating critical dependency routes.</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', gap: '16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}>
          <Bot size={26} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>AI Project Planning Pending</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px', margin: '4px auto 0', lineHeight: 1.5 }}>
            Synthesize multi-phase architectural blueprints, evaluate organization skill gaps, provision enterprise module trees, and generate structured deliverables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#111827', fontWeight: 700 }}>
          <Sparkles size={14} />
          Analyze Project with AI
        </button>
      </div>
    );
  }

  const skillCoverage = analysis.skillGapAnalysis?.coverageScore || 82;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ========================================================================= */}
      {/* 2. PROJECT OVERVIEW & ARCHITECTURAL BLUEPRINT (WRAPPABLE / COLLAPSIBLE) */}
      {/* ========================================================================= */}
      {isOverviewSectionWrapped ? (
        <div 
          className="glass-panel sm-card-interactive" 
          onClick={() => setIsOverviewSectionWrapped(false)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '14px 20px',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(15, 23, 42, 0.6) 100%)',
            transition: 'all 0.25s ease'
          }}
          title="Click to unwrap Project Overview & Architectural Blueprint"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0
            }}>
              <Compass size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Project Overview & Architectural Blueprint
                </h3>
                {analysis.projectOverview?.complexityLevel && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.25)'
                  }}>
                    {analysis.projectOverview.complexityLevel} Complexity
                  </span>
                )}
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  6 Modules Wrapped
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Strategic architecture, technology stack, modules topology, risk audits, and organization skills
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOverviewSectionWrapped(false);
              }}
              className="sm-card-interactive"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '6px 14px',
                color: '#f59e0b',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <ChevronDown size={14} />
              <span>Unwrap Blueprint</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 22px' }}>
          {/* Overview Master Header with Wrap / Unwrap All Control */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}>
                <Compass size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                    Project Overview & Architectural Blueprint
                  </h3>
                  {analysis.projectOverview?.complexityLevel && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.25)'
                    }}>
                      {analysis.projectOverview.complexityLevel} Complexity
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Strategic architecture, technology stack, modules topology, risk audits, and organization skills
                </p>
              </div>
            </div>

            {/* Action Buttons: Unwrap/Wrap All Boxes + Wrap Entire Blueprint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={toggleAllOverviewBoxes}
                className="sm-card-interactive"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                title={Object.values(wrappedBoxes).every(Boolean) ? "Unwrap all overview boxes" : "Wrap all overview boxes"}
              >
                {Object.values(wrappedBoxes).every(Boolean) ? (
                  <>
                    <ChevronDown size={13} />
                    <span>Unwrap All Boxes</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={13} />
                    <span>Wrap All Boxes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOverviewSectionWrapped(true)}
                className="sm-card-interactive"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#f59e0b',
                  fontSize: '11px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                title="Wrap entire Project Overview & Architectural Blueprint section"
              >
                <ChevronUp size={13} />
                <span>Wrap Blueprint</span>
              </button>
            </div>
          </div>

          {/* 2-Column Grid for the 6 Wrappable Boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1.35fr', gap: '20px' }}>
          
          {/* Left Column: Project Overview, Missing Requirements, Security & Delivery Risks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* BOX 1: PROJECT OVERVIEW ANALYSIS */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: wrappedBoxes.overview ? '12px 16px' : '16px 18px',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div
                onClick={() => toggleBoxWrap('overview')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Compass size={17} style={{ color: '#f59e0b' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 750, margin: 0, color: '#f8fafc' }}>
                    Project Overview Analysis
                  </h4>
                  {wrappedBoxes.overview && (
                    <span className="box-wrapped-pill">
                      {analysis.projectOverview?.architectureStyle || 'Microservices'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#a5b4fc',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {analysis.projectOverview?.projectType || 'Enterprise Application'}
                  </span>
                  <button
                    type="button"
                    className={`box-toggle-btn ${wrappedBoxes.overview ? 'wrapped' : ''}`}
                    title={wrappedBoxes.overview ? "Unwrap Project Overview" : "Wrap Project Overview"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoxWrap('overview');
                    }}
                  >
                    <ChevronDown size={14} className="toggle-chevron" />
                  </button>
                </div>
              </div>

              <div className={`box-collapsible-wrapper ${wrappedBoxes.overview ? 'wrapped' : 'unwrapped'}`}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', fontSize: '12.5px', lineHeight: 1.5, marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '14px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 650 }}>Architecture:</span>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{analysis.projectOverview?.architectureStyle || 'Modular Microservices Architecture'}</span>

                  <span style={{ color: 'var(--text-muted)', fontWeight: 650 }}>Target Cloud:</span>
                  <span style={{ color: 'var(--text-main)' }}>{analysis.projectOverview?.targetDeployment || 'Multi-Region High-Availability Cloud'}</span>

                  <span style={{ color: 'var(--text-muted)', fontWeight: 650 }}>Primary Objective:</span>
                  <span style={{ color: 'var(--text-main)' }}>{analysis.projectOverview?.mainObjective}</span>

                  <span style={{ color: 'var(--text-muted)', fontWeight: 650 }}>Scope Summary:</span>
                  <span style={{ color: 'var(--text-main)' }}>{analysis.projectOverview?.estimatedProjectScope}</span>

                  {analysis.projectOverview?.complianceStandards && analysis.projectOverview.complianceStandards.length > 0 && (
                    <>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 650, marginTop: '2px' }}>Compliance Standards:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {analysis.projectOverview.complianceStandards.map((std, i) => (
                          <span key={i} style={{
                            fontSize: '10.5px',
                            fontWeight: 650,
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '2px 7px',
                            borderRadius: '4px'
                          }}>
                            {std}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {analysis.projectOverview?.keyMilestones && analysis.projectOverview.keyMilestones.length > 0 && (
                    <>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 650, marginTop: '4px' }}>Key Milestones:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {analysis.projectOverview.keyMilestones.map((ms, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#cbd5e1' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            <span>{ms}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* BOX 2: MISSING REQUIREMENTS DETECTED */}
            {analysis.missingRequirements && analysis.missingRequirements.length > 0 && (
              <div style={{
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: wrappedBoxes.missingReqs ? '12px 16px' : '16px 18px',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div
                  onClick={() => toggleBoxWrap('missingReqs')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                    <h4 style={{ fontSize: '13.5px', fontWeight: 750, color: '#ef4444', margin: 0 }}>
                      Missing Requirements Detected
                    </h4>
                    {wrappedBoxes.missingReqs && (
                      <span className="box-wrapped-pill" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                        {analysis.missingRequirements.length} Detected
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.15)',
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}>
                      {analysis.missingRequirements.length} Items
                    </span>
                    <button
                      type="button"
                      className={`box-toggle-btn ${wrappedBoxes.missingReqs ? 'wrapped' : ''}`}
                      title={wrappedBoxes.missingReqs ? "Unwrap Missing Requirements" : "Wrap Missing Requirements"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBoxWrap('missingReqs');
                      }}
                    >
                      <ChevronDown size={14} className="toggle-chevron" />
                    </button>
                  </div>
                </div>

                <div className={`box-collapsible-wrapper ${wrappedBoxes.missingReqs ? 'wrapped' : 'unwrapped'}`}>
                  <ul style={{ paddingLeft: '20px', margin: '14px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '12px' }}>
                    {analysis.missingRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* BOX 3: SECURITY & DELIVERY RISK AUDITS */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: wrappedBoxes.securityRisks ? '12px 16px' : '16px 18px',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div
                onClick={() => toggleBoxWrap('securityRisks')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 750, margin: 0, color: '#f8fafc' }}>
                    Security & Delivery Risk Audits
                  </h4>
                  {wrappedBoxes.securityRisks && (
                    <span className="box-wrapped-pill">
                      {analysis.risks?.length || 0} Risk Audits
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {analysis.risks?.length || 0} Audits
                  </span>
                  <button
                    type="button"
                    className={`box-toggle-btn ${wrappedBoxes.securityRisks ? 'wrapped' : ''}`}
                    title={wrappedBoxes.securityRisks ? "Unwrap Security & Delivery Risks" : "Wrap Security & Delivery Risks"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoxWrap('securityRisks');
                    }}
                  >
                    <ChevronDown size={14} className="toggle-chevron" />
                  </button>
                </div>
              </div>

              <div className={`box-collapsible-wrapper ${wrappedBoxes.securityRisks ? 'wrapped' : 'unwrapped'}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '14px' }}>
                  {analysis.risks && analysis.risks.map((r, i) => (
                    <div key={i} style={{ borderBottom: i < analysis.risks.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>{r.risk}</span>
                        <span style={{ 
                          fontSize: '9.5px', 
                          fontWeight: 700, 
                          backgroundColor: r.severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: r.severity === 'High' ? '#ef4444' : '#f59e0b',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>{r.severity} Risk</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{r.reason}</p>
                      <p style={{ fontSize: '11.5px', color: 'var(--color-primary-light)', marginTop: '4px' }}>
                        <strong>Mitigation Solution:</strong> {r.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Technology Stack, Required Modules, Organization Skill Gaps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* BOX 4: TECHNOLOGY STACK */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: wrappedBoxes.techStack ? '12px 16px' : '16px 18px',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div
                onClick={() => toggleBoxWrap('techStack')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Code size={16} style={{ color: '#818cf8' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 750, margin: 0, color: '#f8fafc' }}>
                    Technology Stack
                  </h4>
                  {wrappedBoxes.techStack && (
                    <span className="box-wrapped-pill">
                      {filteredTechList?.length || analysis.technologies?.length || 0} Tools
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!wrappedBoxes.techStack && analysis.technologiesDetail && analysis.technologiesDetail.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: '220px' }} onClick={e => e.stopPropagation()}>
                      {['All', 'Frontend', 'Backend', 'Database', 'Security', 'DevOps'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setTechFilter(cat)}
                          style={{
                            padding: '1px 6px',
                            fontSize: '9.5px',
                            fontWeight: 650,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: techFilter === cat ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                            background: techFilter === cat ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                            color: techFilter === cat ? '#a5b4fc' : '#64748b'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className={`box-toggle-btn ${wrappedBoxes.techStack ? 'wrapped' : ''}`}
                    title={wrappedBoxes.techStack ? "Unwrap Technology Stack" : "Wrap Technology Stack"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoxWrap('techStack');
                    }}
                  >
                    <ChevronDown size={14} className="toggle-chevron" />
                  </button>
                </div>
              </div>

              <div className={`box-collapsible-wrapper ${wrappedBoxes.techStack ? 'wrapped' : 'unwrapped'}`}>
                <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                  {filteredTechList ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                      {filteredTechList.map((tech, i) => (
                        <div key={i} style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: tech.badgeColor || '#f8fafc' }}>
                              {tech.name}
                            </span>
                            {tech.version && (
                              <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 600 }}>{tech.version}</span>
                            )}
                          </div>
                          {tech.role && (
                            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.2 }}>{tech.role}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {analysis.technologies && analysis.technologies.map((tech, i) => (
                        <span key={i} style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          padding: '3px 9px',
                          borderRadius: '5px',
                          fontWeight: 600
                        }}>{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOX 5: REQUIRED MODULES ARCHITECTURE */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: wrappedBoxes.modules ? '12px 16px' : '16px 18px',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div
                onClick={() => toggleBoxWrap('modules')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers3 size={16} style={{ color: '#10b981' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 750, margin: 0, color: '#f8fafc' }}>
                    Required Modules Architecture
                  </h4>
                  {wrappedBoxes.modules && (
                    <span className="box-wrapped-pill">
                      {analysis.modulesDetail?.length || analysis.modules?.length || 0} Modules
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 650 }}>
                    {analysis.modulesDetail?.length || analysis.modules?.length || 0} Modules
                  </span>
                  <button
                    type="button"
                    className={`box-toggle-btn ${wrappedBoxes.modules ? 'wrapped' : ''}`}
                    title={wrappedBoxes.modules ? "Unwrap Required Modules" : "Wrap Required Modules"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoxWrap('modules');
                    }}
                  >
                    <ChevronDown size={14} className="toggle-chevron" />
                  </button>
                </div>
              </div>

              <div className={`box-collapsible-wrapper ${wrappedBoxes.modules ? 'wrapped' : 'unwrapped'}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', marginTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                  {analysis.modulesDetail && analysis.modulesDetail.length > 0 ? (
                    analysis.modulesDetail.map((mod, i) => {
                      const isCrit = mod.status === 'Security Critical' || mod.status === 'Critical';
                      const isCore = mod.status === 'Core';

                      return (
                        <div key={i} style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 650, color: 'var(--text-main)' }}>
                              {mod.name}
                            </span>
                            <span style={{
                              fontSize: '8.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: isCrit ? 'rgba(239, 68, 68, 0.15)' : (isCore ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                              color: isCrit ? '#ef4444' : (isCore ? '#a5b4fc' : '#f59e0b'),
                              whiteSpace: 'nowrap'
                            }}>
                              {mod.status}
                            </span>
                          </div>
                          {mod.description && (
                            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                              {mod.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    analysis.modules && analysis.modules.map((mod, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={13} style={{ color: 'var(--color-success)' }} />
                        <span>{mod}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* BOX 6: ORGANIZATION SKILL GAPS & READINESS */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: wrappedBoxes.skillGaps ? '12px 16px' : '16px 18px',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div
                onClick={() => toggleBoxWrap('skillGaps')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Cpu size={16} style={{ color: '#f59e0b' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 750, margin: 0, color: '#f8fafc' }}>
                    Organization Skill Gaps & Readiness
                  </h4>
                  {wrappedBoxes.skillGaps && (
                    <span className="box-wrapped-pill">
                      {skillCoverage}% Readiness
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: skillCoverage >= 80 ? '#10b981' : '#f59e0b' }}>
                    {skillCoverage}% Readiness
                  </span>
                  <button
                    type="button"
                    className={`box-toggle-btn ${wrappedBoxes.skillGaps ? 'wrapped' : ''}`}
                    title={wrappedBoxes.skillGaps ? "Unwrap Skill Gaps" : "Wrap Skill Gaps"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBoxWrap('skillGaps');
                    }}
                  >
                    <ChevronDown size={14} className="toggle-chevron" />
                  </button>
                </div>
              </div>

              <div className={`box-collapsible-wrapper ${wrappedBoxes.skillGaps ? 'wrapped' : 'unwrapped'}`}>
                <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Coverage Meter */}
                  <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${skillCoverage}%`,
                      height: '100%',
                      background: skillCoverage >= 80 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.skillGaps && analysis.skillGaps.map((gap, i) => {
                      const isCrit = gap.severity === 'Critical';
                      const isHigh = gap.severity === 'High';

                      return (
                        <div key={i} style={{
                          fontSize: '11.5px',
                          borderLeft: `3px solid ${isCrit ? '#ef4444' : (isHigh ? '#f97316' : '#38bdf8')}`,
                          paddingLeft: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {gap.requiredSkill}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <span style={{
                                fontSize: '8.5px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor: isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: isCrit ? '#ef4444' : '#f59e0b'
                              }}>
                                {gap.severity || 'Medium'}
                              </span>
                              {gap.actionType && (
                                <span style={{
                                  fontSize: '8.5px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc'
                                }}>
                                  {gap.actionType}
                                </span>
                              )}
                            </div>
                          </div>
                          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                            {gap.recommendation}
                          </p>
                        </div>
                      );
                    })}

                    {(!analysis.skillGaps || analysis.skillGaps.length === 0) && (
                      <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-success)' }}>
                        All project skills are fully covered by existing active team member profiles.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    )}

      {/* AI TASK RECOMMENDATIONS (GROUPED BY LIFECYCLE PHASES) */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>AI Lifecycle Task Recommendations</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Comprehensive deliverables categorized across {activePhases.length} development lifecycle phases.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary sm-phase-distribute-btn" 
              onClick={handleAutoAssignAllPhases} 
              title="Automatically assign recommended employees across all phases"
              style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', fontWeight: 650 }}
            >
              <Sparkles size={14} />
              Auto-Assign All Phases
            </button>
            <button className="btn btn-secondary" onClick={handleAddCustomTask} style={{ color: '#f59e0b', fontWeight: 650 }}>
              <Plus size={14} />
              Add Custom Task
            </button>
            <button className="btn btn-secondary" onClick={handleDiscard} style={{ color: 'var(--color-danger)', fontWeight: 650 }}>
              <X size={14} />
              Reject All
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleApprove} 
              disabled={isApproving}
              style={{ 
                backgroundColor: '#f59e0b', 
                borderColor: '#f59e0b', 
                color: '#111827', 
                fontWeight: 750,
                opacity: isApproving ? 0.7 : 1,
                cursor: isApproving ? 'not-allowed' : 'pointer'
              }}
            >
              <Check size={14} />
              {isApproving ? 'Provisioning Plan...' : 'Accept & Create Tasks'}
            </button>
          </div>
        </div>

        {/* Phase Groups Loop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {activePhases.map(phase => {
            const phaseTasks = (analysis.recommendedTasks || []).filter(t => t.phase === phase);
            if (phaseTasks.length === 0) return null;

            const meta = getPhaseMeta(phase);
            const PhaseIcon = meta.icon;
            const phaseHours = phaseTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
            const phaseTeam = phaseTeamMap[phase] || [];

            return (
              <div key={phase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Phase Header with Icon, Task Count, Hours & Multi-Employee Phase Team */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 10px ${meta.color}33`
                    }}>
                      <PhaseIcon size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 750, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        {phase} Phase
                      </h4>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {phaseTasks.length} Deliverables • {phaseHours} Total Hours
                      </span>
                    </div>
                  </div>

                  {/* Multi-Employee Phase Assignment Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={13} style={{ color: meta.color }} />
                      <span style={{ fontSize: '11px', fontWeight: 650, color: '#cbd5e1' }}>
                        Phase Team ({phaseTeam.length}):
                      </span>
                    </div>

                    {/* Chips for employees assigned to this phase */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      {phaseTeam.map(empId => {
                        const emp = employees.find(e => e._id === empId);
                        const empName = emp ? (emp.user?.fullname || emp.designation) : 'Team Member';
                        const initials = getInitials(empName);

                        return (
                          <div 
                            key={empId} 
                            className="sm-phase-team-chip"
                            title={`${empName}${emp?.designation ? ` - ${emp.designation}` : ''}`}
                          >
                            <div className="sm-phase-chip-avatar">
                              {initials}
                            </div>
                            <span className="sm-phase-chip-name">
                              {empName}
                            </span>
                            <button
                              type="button"
                              className="sm-phase-chip-remove"
                              onClick={() => handleRemoveEmployeeFromPhase(phase, empId)}
                              title={`Remove ${empName} from this phase`}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        );
                      })}

                      {phaseTeam.length === 0 && (
                        <span style={{ 
                          fontSize: '10.5px', 
                          color: '#f87171', 
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.14)',
                          border: '1px solid rgba(239, 68, 68, 0.38)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <AlertTriangle size={11} />
                          No team assigned (Required)
                        </span>
                      )}
                    </div>

                    {/* Add Employee Select Dropdown */}
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddEmployeeToPhase(phase, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="sm-phase-add-emp-select"
                      title="Add employee to this phase (can add multiple employees)"
                    >
                      <option value="" disabled style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                        + Add Employee...
                      </option>
                      {employees
                        .filter(emp => !phaseTeam.includes(emp._id))
                        .map(emp => (
                          <option key={emp._id} value={emp._id} style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                            + {emp.user?.fullname || emp.designation} {emp.designation ? `(${emp.designation})` : ''}
                          </option>
                        ))}
                    </select>

                    {/* Re-Distribute Tasks Button when multiple team members */}
                    {phaseTeam.length > 1 && (
                      <button
                        type="button"
                        className="sm-phase-distribute-btn"
                        onClick={() => distributePhaseTasks(phase, phaseTeam)}
                        title="Evenly distribute deliverables across all assigned phase team members"
                      >
                        <Sparkles size={12} />
                        Distribute Tasks
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 2-Column Task Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '14px' }}>
                  {phaseTasks.map((task) => {
                    const taskIdx = (analysis.recommendedTasks || []).findIndex(t => t.title === task.title);
                    const isEditing = editingTaskIdx === taskIdx;
                    const rec = (analysis.teamRecommendations || []).find(r => r.taskTitle === task.title);

                    return (
                      <div 
                        key={task.title} 
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.55)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={editTaskTitle} 
                                onChange={e => setEditTaskTitle(e.target.value)} 
                                placeholder="Task Title"
                                style={{ height: '34px', fontSize: '12px' }}
                              />
                              <select 
                                className="form-input" 
                                value={editTaskPriority} 
                                onChange={e => setEditTaskPriority(e.target.value)}
                                style={{ height: '34px', width: '100px', fontSize: '12px' }}
                              >
                                <option>Critical</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                              </select>
                            </div>
                            
                            <textarea 
                              className="form-input" 
                              value={editTaskDesc} 
                              onChange={e => setEditTaskDesc(e.target.value)} 
                              placeholder="Task Description"
                              style={{ minHeight: '52px', fontSize: '12px' }}
                            />

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={editTaskHours} 
                                onChange={e => setEditTaskHours(e.target.value)} 
                                placeholder="Hours"
                                style={{ height: '34px', width: '80px', fontSize: '12px' }}
                              />
                              <select 
                                className="form-input" 
                                value={editTaskAssignee} 
                                onChange={e => setEditTaskAssignee(e.target.value)}
                                style={{ height: '34px', flex: 1, fontSize: '12px' }}
                              >
                                <option value="">Select Assignee</option>
                                {employees.map(emp => (
                                  <option key={emp._id} value={emp._id}>
                                    {emp.user?.fullname || emp.designation}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                              <button className="btn btn-secondary" onClick={() => setEditingTaskIdx(null)} style={{ padding: '4px 10px', fontSize: '11px' }}>Cancel</button>
                              <button className="btn btn-primary" onClick={handleSaveEdit} style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#111827' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <h5 style={{ fontSize: '13.5px', fontWeight: 750, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                                {task.title}
                              </h5>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                <span className={`badge ${
                                  task.priority === 'Critical' || task.priority === 'High' ? 'badge-danger' : 
                                  task.priority === 'Medium' ? 'badge-warning' : 'badge-info'
                                }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                  {task.priority}
                                </span>
                                <button onClick={() => handleStartEdit(taskIdx, task)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }} title="Edit Task">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleDeleteTask(taskIdx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px' }} title="Delete Task">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                              {task.description}
                            </p>
                            
                            {task.requiredSkills && task.requiredSkills.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {task.requiredSkills.map((skill, sIdx) => (
                                  <span key={`${skill}-${sIdx}`} style={{
                                    fontSize: '9.5px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.07)',
                                    color: '#f59e0b',
                                    border: '1px solid rgba(245, 158, 11, 0.18)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600
                                  }}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {task.dependencies && task.dependencies.length > 0 && (
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                <span style={{ fontWeight: 650 }}>Depends on: </span>
                                {task.dependencies.join(', ')}
                              </div>
                            )}

                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              borderTop: '1px solid var(--border-color)', 
                              paddingTop: '8px',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              marginTop: '2px'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Clock size={12} />
                                {task.estimatedHours}h
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {task.assignedTo ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <User size={12} style={{ color: 'var(--color-success)' }} />
                                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{getEmployeeName(task.assignedTo)}</span>
                                    {phaseTeam.includes(task.assignedTo) && (
                                      <span style={{
                                        fontSize: '9px',
                                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                        color: '#818cf8',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        fontWeight: 700,
                                        border: '1px solid rgba(99, 102, 241, 0.3)'
                                      }}>
                                        Phase Team
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ 
                                      fontSize: '9.5px', 
                                      color: '#ef4444', 
                                      backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                                      border: '1px solid rgba(239, 68, 68, 0.4)',
                                      padding: '2px 7px', 
                                      borderRadius: '4px', 
                                      fontWeight: 750,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}>
                                      <AlertTriangle size={10} />
                                      Unassigned
                                    </span>
                                    {rec && (
                                      <span style={{ fontSize: '10.5px', color: '#94a3b8' }} title={`AI Suggestion: ${rec.reason}`}>
                                        (Rec: <strong style={{ color: '#f59e0b' }}>{rec.recommendedEmployeeName}</strong>)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar: Accept & Provision */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button 
            className="btn btn-secondary sm-phase-distribute-btn" 
            onClick={handleAutoAssignAllPhases} 
            title="Automatically assign recommended employees across all phases"
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', fontWeight: 650 }}
          >
            <Sparkles size={14} />
            Auto-Assign All Phases
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleDiscard}>Discard Plan</button>
          <button 
            className="btn btn-primary" 
            onClick={handleApprove} 
            disabled={isApproving}
            style={{ 
              backgroundColor: '#f59e0b', 
              borderColor: '#f59e0b', 
              color: '#111827', 
              fontWeight: 750, 
              padding: '10px 28px',
              opacity: isApproving ? 0.7 : 1,
              cursor: isApproving ? 'not-allowed' : 'pointer'
            }}
          >
            <Check size={16} />
            {isApproving ? 'Provisioning Plan...' : 'Accept & Provision Project Plan'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default AIProjectDashboard;
