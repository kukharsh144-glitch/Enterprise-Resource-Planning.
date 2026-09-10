import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Download, 
  Clock, 
  CheckCircle,
  FileText,
  CreditCard,
  User,
  Cpu,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Account Settings States
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  const [dobVerify, setDobVerify] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Set initial username when user object loads
  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);

  const handleGenerateUsername = async (e) => {
    e.preventDefault();
    if (!newUsername || !newUsername.trim()) return;

    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess('');

    try {
      const response = await api.put('/auth/profile/username', {
        username: newUsername.trim()
      });
      const updatedUser = response.data?.data;
      if (updatedUser) {
        // Update user locally in context & localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const newUserObj = { ...storedUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUserObj));
        setUser(newUserObj);
        setUsernameSuccess('Username successfully updated! You can now login using either email or this username.');
      }
    } catch (err) {
      setUsernameError(err.response?.data?.message || 'Failed to update username. Make sure it is unique.');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!dobVerify || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all verification and password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.put('/auth/profile/password', {
        dob: dobVerify,
        newPassword
      });
      setPasswordSuccess('Password successfully updated! Use your new password on next login.');
      setDobVerify('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Verification failed. Date of birth does not match.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Sparkline/Performance chart mock data
  const performanceChartData = [
    { month: 'Jan', score: 4.0 },
    { month: 'Feb', score: 4.2 },
    { month: 'Mar', score: 4.5 },
    { month: 'Apr', score: 4.3 },
    { month: 'May', score: 4.6 },
  ];

  // Default rich profile (Rohit Kumar) to match mockup exactly!
  const defaultProfile = {
    _id: id || 'emp1',
    fullname: 'Rohit Kumar',
    employeeId: 'EMP001',
    designation: 'Senior Developer',
    department: 'Engineering',
    experience: '5.2 Years',
    salary: '₹85,000',
    status: 'Active',
    about: {
      email: 'rohit.kumar@company.com',
      phone: '+91 98765 43210',
      location: 'New Delhi, India',
      joiningDate: '15 Jan 2020',
      manager: 'Harsh Saini'
    },
    skills: [
      { name: 'JavaScript', percentage: 90 },
      { name: 'React', percentage: 85 },
      { name: 'Node.js', percentage: 80 },
      { name: 'MongoDB', percentage: 75 }
    ],
    performanceScore: '4.6',
    documents: [
      { name: 'Employment_Agreement.pdf', size: '1.2 MB', date: '15 Jan 2020' },
      { name: 'NDA_Signed.pdf', size: '840 KB', date: '15 Jan 2020' },
      { name: 'Identity_Proof_Aadhar.pdf', size: '2.1 MB', date: '12 Jan 2020' },
    ],
    payroll: [
      { month: 'May 2025', base: 85000, allowances: 15000, deductions: 5000, net: 95000, status: 'Paid' },
      { month: 'Apr 2025', base: 85000, allowances: 15000, deductions: 5000, net: 95000, status: 'Paid' },
      { month: 'Mar 2025', base: 85000, allowances: 15000, deductions: 5000, net: 95000, status: 'Paid' },
    ],
    leaves: [
      { type: 'Sick Leave', start: '10 May 2025', end: '11 May 2025', days: 2, reason: 'Viral Fever', status: 'Approved' },
      { type: 'Casual Leave', start: '03 Apr 2025', end: '05 Apr 2025', days: 3, reason: 'Family Function', status: 'Approved' },
    ],
    assets: [
      { name: 'MacBook Pro 14"', serial: 'C02FX555Q05D', category: 'Laptop', value: 120000, status: 'Assigned' },
      { name: 'Dell UltraSharp 27"', serial: 'CN0839D5581', category: 'Monitor', value: 35000, status: 'Assigned' },
    ],
    timeline: [
      { title: 'Joined the company', date: '15 Jan 2020', desc: 'Started as Junior Software Developer.' },
      { title: 'Allocated to Project "ERP Suite"', date: '10 Feb 2020', desc: 'Joined core development module.' },
      { title: 'Promoted to Senior Developer', date: '01 Jul 2023', desc: 'Recognized for excellent performance.' },
    ]
  };

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const startTime = Date.now();
        
        // 1. Fetch main employee details
        const response = await api.get(`/employees/${id}`);
        const data = response.data?.data;
        
        // 2. Fetch leaves history
        let leavesList = [];
        try {
          const leavesRes = await api.get(`/leaves?employee=${id}`);
          leavesList = leavesRes.data?.data?.leaves || leavesRes.data?.data || [];
        } catch (e) {
          console.warn('Failed to load leaves history:', e);
        }

        // 3. Fetch payroll history
        let payrollList = [];
        try {
          const payrollRes = await api.get(`/payrolls?employeeId=${id}`);
          payrollList = payrollRes.data?.data?.payrolls || payrollRes.data?.data || [];
        } catch (e) {
          console.warn('Failed to load payroll history:', e);
        }

        // 4. Fetch activity log timeline
        let timelineList = [];
        try {
          const actRes = await api.get('/employees/stats/activities');
          const recentActivitiesData = actRes.data?.data || actRes.data || [];
          if (data?.user?._id) {
            timelineList = recentActivitiesData.filter(act => 
              (act.actor?._id === data.user._id || act.actor === data.user._id)
            );
          }
        } catch (e) {
          console.warn('Failed to load timeline history:', e);
        }

        // Format timeline items
        let timelineFormatted = timelineList.map(act => {
          let title = 'Action Performed';
          let desc = act.action || 'Performed system update';
          if (act.action === 'login') {
            title = 'Logged In';
            desc = 'Successfully logged into the ERP system.';
          } else if (act.action === 'apply_leave') {
            title = 'Applied for Leave';
            desc = `Submitted request for time off: ${act.details?.leaveType || 'General'}`;
          } else if (act.action === 'create_task') {
            title = 'Task Created';
            desc = `Created new task: ${act.details?.taskTitle || ''}`;
          } else if (act.action === 'change_task_status') {
            title = 'Updated Task Status';
            desc = `Task changed status to: ${act.details?.newStatus || 'Updated'}`;
          }
          return {
            title,
            date: new Date(act.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            desc
          };
        });

        if (timelineFormatted.length === 0 && data) {
          timelineFormatted.push({
            title: 'Account Created',
            date: data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
            desc: 'Joined the company. System profile created.'
          });
        }

        // Enforce the 2-second loading delay
        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, 2000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingDelay));

        if (data) {
          // Format skills dynamically (from array of strings in database)
          const skillsArray = data.skills || [];
          const skillsFormatted = skillsArray.map(skillName => {
            const name = typeof skillName === 'string' ? skillName : (skillName.name || '');
            const percentage = typeof skillName === 'string' 
              ? (70 + (name.length % 4) * 8) 
              : (skillName.percentage || 80);
            return { name, percentage };
          });

          // Format payroll
          const payrollFormatted = payrollList.map(pay => {
            const date = new Date(pay.payCycle + "-02");
            const formattedMonth = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            const base = pay.baseSalary || 0;
            const allowances = pay.bonus || 0;
            const deductions = (pay.tax || 0) + (pay.providentFund || 0) + (pay.leaveDeduction || 0);
            const net = base + allowances - deductions;
            return {
              month: formattedMonth,
              base,
              allowances,
              deductions,
              net,
              status: pay.status || 'Draft'
            };
          });

          // Format leaves
          const leavesFormatted = leavesList.map(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return {
              type: leave.type || 'Sick Leave',
              start: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              end: end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              days: diffDays,
              reason: leave.reason || 'No reason provided',
              status: leave.status || 'Pending'
            };
          });

          // Format assets
          const assetsFormatted = (data.assignedAssets || []).map(asset => ({
            name: asset.name || 'Equipment',
            serial: asset.serialNumber || 'N/A',
            category: asset.type || 'IT Asset',
            value: asset.bookValue || 0,
            status: asset.status || 'Assigned'
          }));

          setEmployee({
            fullname: data.fullname || data.user?.fullname || 'Unnamed Employee',
            employeeId: data.employeeId || 'EMP-' + id.substring(20),
            designation: data.designation || 'Staff Member',
            department: data.department?.name || 'Unassigned',
            experience: `${data.experience || 0} Years`,
            salary: '₹' + (data.salaryBand || 'B2'), // Display salary band
            status: data.status || 'Active',
            avatar: data.avatar || '',
            avatarScale: data.avatarScale || 1,
            avatarPositionX: data.avatarPositionX || 50,
            avatarPositionY: data.avatarPositionY || 50,
            address: data.address || data.user?.address || 'Not Provided',
            about: {
              email: data.user?.email || 'Not Provided',
              phone: data.phone || data.user?.phone || 'Not Provided',
              location: data.address || data.user?.address || 'Not Provided',
              joiningDate: data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Provided',
              manager: data.department?.manager?.user?.fullname || 'Not Assigned'
            },
            skills: skillsFormatted,
            documents: data.documents || [],
            payroll: payrollFormatted,
            leaves: leavesFormatted,
            assets: assetsFormatted,
            timeline: timelineFormatted,
            userId: data.user?._id || data.user
          });
        }
      } catch (err) {
        console.error('Error fetching employee details:', err);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="content-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: '20px' }}>
        <div className="loader" style={{ fontSize: '18px' }}>
          <span>Loading staff profile details...</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Retrieving secure database records...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="content-pane">
        <button className="btn btn-secondary" onClick={() => navigate('/employees')}>
          <ArrowLeft size={16} /> Back to Directory
        </button>
        <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginTop: '40px' }}>Employee profile not found.</p>
      </div>
    );
  }

  return (
    <div className="content-pane" style={{ gap: '20px' }}>
      {/* Back Button */}
      <div>
        <button className="btn btn-secondary" onClick={() => navigate('/employees')} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="glass-panel" style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        {employee.avatar ? (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
            flexShrink: 0
          }}>
            <img 
              src={employee.avatar} 
              alt={employee.fullname} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${employee.avatarScale || 1})`,
                objectPosition: `${employee.avatarPositionX || 50}% ${employee.avatarPositionY || 50}%`
              }}
            />
          </div>
        ) : (
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '28px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)'
          }}>
            {employee.fullname.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{employee.fullname}</h1>
            <span className="badge badge-success" style={{ padding: '3px 8px', fontSize: '11px' }}>{employee.status}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>
            {employee.designation}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', borderLeft: '1px solid var(--border-color)', paddingLeft: '32px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee ID</span>
            <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{employee.employeeId}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</span>
            <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{employee.department}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience</span>
            <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{employee.experience}</p>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Salary</span>
            <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px', color: 'var(--color-primary-light)' }}>{employee.salary}</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px', overflowX: 'auto' }}>
        {(() => {
          const isOwnProfile = user && employee && (employee.userId === user._id);
          const tabsList = ['Overview', 'Documents', 'Payroll', 'Leaves', 'Performance', 'Assets', 'Timeline'];
          if (isOwnProfile) {
            tabsList.push('Account Settings');
          }
          return tabsList.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          ));
        })()}
      </div>

      {/* Tab Panels */}
      <div style={{ minHeight: '300px' }}>
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'Overview' && (
          <div className="grid-3" style={{ gridTemplateColumns: '1.2fr 1.2fr 0.6fr' }}>
            
            {/* About Box */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>About</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{employee.about.email}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Phone Number</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{employee.about.phone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Address</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{employee.address || employee.about.location || 'N/A'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Joining Date</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{employee.about.joiningDate}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserCheck size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Manager</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{employee.about.manager}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Box */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Skills</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {employee.skills.length === 0 ? (
                  <div style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No skills listed on this profile.
                  </div>
                ) : (
                  employee.skills.map((skill, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      <span>{typeof skill === 'string' ? skill : skill.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Performance score Box */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Performance</h3>
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--color-success)' }}>{employee.performanceScore}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}> / 5.0</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Excellent Rating</p>
                </div>
              </div>

              {/* Sparkline chart */}
              <div style={{ height: '80px', width: '100%', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceChartData}>
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* DOCUMENTS PANEL */}
        {activeTab === 'Documents' && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Employee Documents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(!employee.documents || employee.documents.length === 0) ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  No documents uploaded for this employee yet.
                </div>
              ) : (
                employee.documents.map((doc, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '14px 18px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--input-bg)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '14px', display: 'block' }}>{doc.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {doc.url ? 'Official Verification Attachment' : `Uploaded on ${doc.date || '15 Jan 2020'} • ${doc.size || '1.2 MB'}`}
                        </span>
                      </div>
                    </div>
                    {doc.url ? (
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} />
                        Download / View
                      </a>
                    ) : (
                      <button className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                        <Download size={14} />
                        Download
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PAYROLL PANEL */}
        {activeTab === 'Payroll' && (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Pay Period</th>
                    <th>Base Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.payroll.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No payroll periods generated for this employee yet.
                      </td>
                    </tr>
                  ) : (
                    employee.payroll.map((pay, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{pay.month}</td>
                        <td>₹{pay.base.toLocaleString('en-IN')}</td>
                        <td>₹{pay.allowances.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--color-danger)' }}>-₹{pay.deductions.toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>₹{pay.net.toLocaleString('en-IN')}</td>
                        <td>
                          <span className="badge badge-success" style={{ display: 'flex', gap: '4px', width: 'fit-content' }}>
                            <CheckCircle size={12} />
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEAVES PANEL */}
        {activeTab === 'Leaves' && (
          <div className="grid-2-1">
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.leaves.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          No leave history found for this employee.
                        </td>
                      </tr>
                    ) : (
                      employee.leaves.map((leave, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{leave.type}</td>
                          <td>{leave.start}</td>
                          <td>{leave.end}</td>
                          <td>{leave.days} days</td>
                          <td style={{ color: 'var(--text-muted)' }}>{leave.reason}</td>
                          <td>
                            <span className="badge badge-success">{leave.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Submit Leave Request */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Request Time Off</h3>
              <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Leave Type</label>
                  <select className="form-input">
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Earned Leave</option>
                    <option>Unpaid Leave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Reason / Comments</label>
                  <textarea className="form-input" rows="3" placeholder="Explain details..."></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Request</button>
              </form>
            </div>
          </div>
        )}

        {/* PERFORMANCE PANEL */}
        {activeTab === 'Performance' && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Evaluation History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { period: 'Q1 Review 2025', reviewer: 'Harsh Saini', rating: '4.6/5.0', comments: 'Excellent delivery of DB optimization and project architectures. Leadership skills are improving.' },
                { period: 'Annual Appraisal 2024', reviewer: 'Harsh Saini', rating: '4.5/5.0', comments: 'Promoted to Senior Developer. Met and exceeded all engineering team targets.' }
              ].map((perf, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--input-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{perf.period}</span>
                    <span className="badge badge-success" style={{ fontSize: '12px' }}>Rating: {perf.rating}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Evaluator: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{perf.reviewer}</span></p>
                  <p style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '4px', lineHeight: 1.4 }}>"{perf.comments}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSETS PANEL */}
        {activeTab === 'Assets' && (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Serial Number</th>
                    <th>Asset Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.assets.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No company assets currently assigned to this employee.
                      </td>
                    </tr>
                  ) : (
                    employee.assets.map((asset, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{asset.name}</td>
                        <td>{asset.category}</td>
                        <td><code>{asset.serial}</code></td>
                        <td>₹{asset.value.toLocaleString('en-IN')}</td>
                        <td>
                          <span className="badge badge-success">{asset.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TIMELINE PANEL */}
        {activeTab === 'Timeline' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border-color)' }}>
              {employee.timeline.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Bullet */}
                  <div style={{
                    position: 'absolute',
                    left: '-31px',
                    top: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    border: '3px solid var(--bg-panel)'
                  }} />
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{item.title}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {item.date}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACCOUNT SETTINGS PANEL */}
        {activeTab === 'Account Settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Username settings */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Account Identity (Username)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Your username is unique and can be used as an alternative login credential instead of your email.
              </p>
              
              {usernameSuccess && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '6px', fontSize: '12px' }}>
                  {usernameSuccess}
                </div>
              )}
              {usernameError && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '12px' }}>
                  {usernameError}
                </div>
              )}

              <form onSubmit={handleGenerateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. harsh_saini"
                    className="form-input"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', height: '36px', padding: '0 16px', fontSize: '13px', cursor: 'pointer' }}
                  disabled={usernameLoading}
                >
                  {usernameLoading ? 'Saving...' : user?.username ? 'Update Username' : 'Generate Username'}
                </button>
              </form>
            </div>

            {/* Password settings */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Security Settings (Change Password)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                To modify your password, please confirm your Date of Birth as recorded in the organization's database for identity verification.
              </p>

              {passwordSuccess && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '6px', fontSize: '12px' }}>
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '12px' }}>
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>Date of Birth (Verification)</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={dobVerify}
                    onChange={e => setDobVerify(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', height: '36px', padding: '0 16px', fontSize: '13px', cursor: 'pointer' }}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Verifying...' : 'Change Password'}
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeProfile;
