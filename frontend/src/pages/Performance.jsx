import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { showGlassToast } from '../components/GlassToast';
import {
  TrendingUp,
  Award,
  Target,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  ChevronRight,
  Filter,
  Plus,
  Zap,
  Flame,
  BrainCircuit,
  Users
} from 'lucide-react';

const COMPETENCIES = [
  {
    title: 'Technical Architecture & Problem Solving',
    score: 96,
    level: 'Exceptional',
    color: '#6366f1',
    description: 'Consistently architectures scalable, zero-downtime distributed systems with resilient fallback patterns.'
  },
  {
    title: 'Code Quality & Design System Governance',
    score: 94,
    level: 'Exceptional',
    color: '#38bdf8',
    description: 'Enforces high standards in token matrices, semantic theme variables, and modular component architectures.'
  },
  {
    title: 'Team Mentorship & Technical Guidance',
    score: 88,
    level: 'Exceeds Expectations',
    color: '#10b981',
    description: 'Actively conducts in-depth code reviews, pairs with junior engineers, and documents enterprise engineering guidelines.'
  },
  {
    title: 'Cross-Functional Collaboration & Delivery',
    score: 90,
    level: 'Exceeds Expectations',
    color: '#8b5cf6',
    description: 'Bridges design and backend engineering smoothly, ensuring fast sprint velocity with zero regressions.'
  },
  {
    title: 'Operational Excellence & Reliability',
    score: 92,
    level: 'Exceeds Expectations',
    color: '#f59e0b',
    description: 'Maintains 99.98% uptime across microservice clusters and sets up automated smoke testing pipelines.'
  }
];

const INITIAL_GOALS = [
  {
    id: 1,
    category: 'Engineering',
    title: 'Achieve Complete Light/Dark Mode Design Token System',
    description: 'Standardize semantic CSS variables across header, sidebar, cards, and modal components without hardcoded values.',
    progress: 100,
    targetDate: '2026-09-15',
    status: 'Completed',
    weight: '25%'
  },
  {
    id: 2,
    category: 'Architecture',
    title: 'Enterprise WebSocket Sync & Zero-Drop Message Queue',
    description: 'Design and deploy resilient socket state broadcasting with Redis pub/sub room isolation.',
    progress: 85,
    targetDate: '2026-09-25',
    status: 'On Track',
    weight: '30%'
  },
  {
    id: 3,
    category: 'Leadership',
    title: 'Staff Engineering Mentorship Program',
    description: 'Mentor 2 senior developers through frontend tokenization and backend authorization middleware design.',
    progress: 75,
    targetDate: '2026-10-10',
    status: 'On Track',
    weight: '20%'
  },
  {
    id: 4,
    category: 'Engineering',
    title: 'Sub-150ms Average API Response Optimization',
    description: 'Audit MongoDB indexes, implement multi-tier cache invalidation, and compress JSON payloads.',
    progress: 60,
    targetDate: '2026-10-30',
    status: 'In Progress',
    weight: '25%'
  }
];

const PEER_REVIEWS = [
  {
    name: 'Priya Verma',
    role: 'Lead Product Designer',
    department: 'Design',
    avatarBg: '#ec4899',
    rating: 5.0,
    date: 'Sep 04, 2026',
    badges: ['Design Token Hero', 'Flawless Polish'],
    feedback: 'Harsh has an unmatched eye for technical polish and design systems. Translating our Figma tokens into dynamic CSS variables was executed with flawless perfection.'
  },
  {
    name: 'Kartik Sharma',
    role: 'Backend Architect',
    department: 'Engineering',
    avatarBg: '#10b981',
    rating: 4.9,
    date: 'Aug 29, 2026',
    badges: ['System Architect', 'Rock-solid Code'],
    feedback: 'Extremely thorough architectural planning. The authorization middleware and JWT token refresh logic have zero loopholes. A joy to build alongside.'
  },
  {
    name: 'Vikram Singh',
    role: 'DevOps & Cloud Engineer',
    department: 'Engineering',
    avatarBg: '#6366f1',
    rating: 4.8,
    date: 'Aug 22, 2026',
    badges: ['DevOps Champion', 'Fast Troubleshooter'],
    feedback: 'Proactive communication during production deployments. Docker orchestration runs seamlessly with our backend microservices.'
  }
];

export default function Performance() {
  const { user } = useAuth();
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [kudosCount, setKudosCount] = useState(14);

  const filteredGoals = goals.filter(g =>
    selectedCategory === 'All' ? true : g.category === selectedCategory
  );

  const handleGiveKudos = () => {
    setKudosCount(prev => prev + 1);
    showGlassToast.success('Kudos Recorded!', 'You gave kudos for outstanding performance in Q3!');
  };

  const handleRequestFeedback = () => {
    showGlassToast.info(
      'Feedback Request Dispatched',
      'Requests for 360° peer reviews have been sent to team members.'
    );
  };

  const handleUpdateGoalProgress = (goalId) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const newProgress = g.progress >= 100 ? 50 : Math.min(100, g.progress + 15);
          const newStatus = newProgress === 100 ? 'Completed' : 'In Progress';
          return { ...g, progress: newProgress, status: newStatus };
        }
        return g;
      })
    );
    showGlassToast.success('Goal Updated', 'Milestone progress updated successfully.');
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
      {/* Header */}
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
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Performance & Career Growth
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0.2rem 0 0 0'
            }}>
              Quarterly OKRs, core competency gauges, 360° peer feedback, and appraisal milestones.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRequestFeedback}
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
            <MessageSquare size={16} />
            Request 360° Feedback
          </button>
          <button
            onClick={handleGiveKudos}
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
            <ThumbsUp size={16} />
            Give Kudos ({kudosCount})
          </button>
        </div>
      </div>

      {/* Hero Scorecard Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Overall Rating Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--color-warning, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Star size={28} fill="currentColor" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Overall Scorecard
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                4.8
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                / 5.0 Rating
              </span>
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: '0.35rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--color-success, #10b981)'
            }}>
              Exceeds Expectations
            </div>
          </div>
        </div>

        {/* OKR Goal Completion */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Target size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Quarterly OKR Status
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                88%
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Target Completion
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--border-default)',
              borderRadius: '2px',
              marginTop: '0.6rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '88%',
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        </div>

        {/* Appraisal Cycle */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Current Evaluation Cycle
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              Q3 2026 Appraisal
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Review closes: Sept 30, 2026
            </div>
          </div>
        </div>

        {/* Peer Kudos */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(236, 72, 153, 0.12)',
            color: '#ec4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Peer Recognitions
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {kudosCount}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Kudos Received
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '600', marginTop: '0.25rem' }}>
              Top 3% across organization
            </div>
          </div>
        </div>
      </div>

      {/* Competencies Matrix */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Core Engineering Competencies
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Assessed across technical leadership, architectural scale, and cross-functional impact.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {COMPETENCIES.map((comp, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: comp.color
                  }} />
                  <span style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {comp.title}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: comp.color,
                    backgroundColor: `${comp.color}15`,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px'
                  }}>
                    {comp.level}
                  </span>
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {comp.score}%
                </div>
              </div>

              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '4px',
                border: '1px solid var(--border-default)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${comp.score}%`,
                  height: '100%',
                  backgroundColor: comp.color,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {comp.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active OKRs / Milestones */}
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
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Active OKRs & Key Milestones
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Track goal execution and update progress toward quarterly targets.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {['All', 'Engineering', 'Architecture', 'Leadership'].map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? '700' : '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: active ? 'var(--color-primary)' : 'var(--bg-app)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredGoals.map(goal => (
            <div
              key={goal.id}
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--color-primary)'
                    }}>
                      {goal.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Weight: {goal.weight}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Due: {goal.targetDate}
                    </span>
                  </div>

                  <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {goal.title}
                  </h4>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {goal.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    backgroundColor: goal.status === 'Completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: goal.status === 'Completed' ? 'var(--color-success, #10b981)' : 'var(--color-primary)',
                    border: goal.status === 'Completed' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)'
                  }}>
                    {goal.status === 'Completed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {goal.status}
                  </span>
                </div>
              </div>

              {/* Progress and interactive button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '4px',
                    border: '1px solid var(--border-default)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${goal.progress}%`,
                      height: '100%',
                      backgroundColor: goal.status === 'Completed' ? 'var(--color-success, #10b981)' : 'var(--color-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)', minWidth: '40px' }}>
                  {goal.progress}%
                </div>

                <button
                  onClick={() => handleUpdateGoalProgress(goal.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Plus size={13} />
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 360° Peer Feedback Wall */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            360° Peer Testimonials & Accolades
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Direct endorsements submitted by cross-functional team collaborators during review rounds.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {PEER_REVIEWS.map((review, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-default)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: review.avatarBg,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.8125rem'
                    }}>
                      {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {review.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {review.role} · {review.department}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    color: 'var(--color-warning, #f59e0b)'
                  }}>
                    <Star size={14} fill="currentColor" />
                    {review.rating.toFixed(1)}
                  </div>
                </div>

                <p style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  "{review.feedback}"
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {review.badges.map((b, bi) => (
                    <span
                      key={bi}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)'
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {review.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
