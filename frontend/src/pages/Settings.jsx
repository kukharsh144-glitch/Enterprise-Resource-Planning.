import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showGlassToast } from '../components/GlassToast';
import {
  User,
  Briefcase,
  Phone,
  GraduationCap,
  CreditCard,
  Shield,
  Sliders,
  Lock,
  Save,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  Award,
  Check
} from 'lucide-react';

const Settings = () => {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Extract linked Employee record from user
  const emp = user?.employee && typeof user.employee === 'object' ? user.employee : null;

  // Candidate Profile State (100% database driven)
  const [candidateForm, setCandidateForm] = useState({
    // 1. Personal & Identity
    fullname: user?.fullname || 'Harsh Saini',
    employeeId: emp?.employeeId || 'EMP-0001',
    gender: emp?.gender || 'Male',
    dateOfBirth: emp?.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '1998-05-14',
    maritalStatus: emp?.maritalStatus || 'Single',
    bloodGroup: emp?.bloodGroup || 'O+',
    nationality: emp?.nationality || 'Indian',
    religion: emp?.religion || 'Hinduism',

    // 2. Employment & Role
    designation: emp?.designation || user?.role || 'Super Admin',
    department: emp?.department?.name || (typeof user?.department === 'object' ? user?.department?.name : null) || 'Engineering',
    employmentType: emp?.employmentType || 'Full-Time',
    workLocation: emp?.workLocation || 'HQ Campus, Gurugram, India',
    dateOfJoining: emp?.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '2024-01-15',
    experience: emp?.experience ?? 6,
    probationPeriod: emp?.probationPeriod ?? 3,
    noticePeriod: emp?.noticePeriod ?? 30,

    // 3. Contact & Address
    email: user?.email || 'harsh@company.com',
    phone: emp?.phone || '+91 98765 43210',
    alternatePhone: emp?.alternatePhone || '+91 98111 22334',
    currentStreet: emp?.currentAddress?.address || 'Tower B, Cyber City',
    currentCity: emp?.currentAddress?.city || 'Gurugram',
    currentState: emp?.currentAddress?.state || 'Haryana',
    currentPinCode: emp?.currentAddress?.pinCode || '122002',
    currentCountry: emp?.currentAddress?.country || 'India',
    permanentAddress: emp?.permanentAddress?.address || 'Green Park Main, South Delhi, Delhi 110016',

    // 4. Skills & Qualifications
    skills: emp?.skills?.join(', ') || 'Enterprise Architecture, React, Node.js, Cloud Operations, MongoDB',
    educationQualification: emp?.educationQualification || 'B.Tech in Computer Science & Engineering',
    previousCompany: emp?.previousCompany || 'Global Enterprise Cloud Systems',
    bio: emp?.notes || 'Super Admin & Lead Enterprise Architect directing cloud ERP systems and infrastructure.',

    // 5. Payroll & Capacity
    salaryBand: emp?.salaryBand || 'Band E4 - Executive Architect',
    payrollGroup: emp?.payrollGroup || 'Executive Leadership Monthly',
    weeklyCapacityHours: emp?.weeklyCapacityHours ?? 40,
    workingHoursPerDay: emp?.workingHoursPerDay ?? 8,
    status: emp?.status || 'Active',
  });

  // Security Sub-states
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('24 hours');
  const [apiKey] = useState('sk_live_erp_9f823a817bca492e8c892');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Workspace Settings State
  const [orgForm, setOrgForm] = useState({
    orgName: 'Enterprise Resource Planning',
    supportEmail: 'support@erp.com',
    timezone: 'Asia/Kolkata (IST +5:30)',
    currency: 'INR (₹)',
    fiscalYear: 'April - March',
  });

  // Sync state whenever live user changes in MongoDB
  useEffect(() => {
    if (user) {
      const e = user.employee && typeof user.employee === 'object' ? user.employee : null;
      setCandidateForm({
        fullname: user.fullname || 'Harsh Saini',
        employeeId: e?.employeeId || 'EMP-0001',
        gender: e?.gender || 'Male',
        dateOfBirth: e?.dateOfBirth ? new Date(e.dateOfBirth).toISOString().split('T')[0] : '1998-05-14',
        maritalStatus: e?.maritalStatus || 'Single',
        bloodGroup: e?.bloodGroup || 'O+',
        nationality: e?.nationality || 'Indian',
        religion: e?.religion || 'Hinduism',

        designation: e?.designation || user.role || 'Super Admin',
        department: e?.department?.name || (typeof user?.department === 'object' ? user?.department?.name : null) || 'Engineering',
        employmentType: e?.employmentType || 'Full-Time',
        workLocation: e?.workLocation || 'HQ Campus, Gurugram, India',
        dateOfJoining: e?.dateOfJoining ? new Date(e.dateOfJoining).toISOString().split('T')[0] : '2024-01-15',
        experience: e?.experience ?? 6,
        probationPeriod: e?.probationPeriod ?? 3,
        noticePeriod: e?.noticePeriod ?? 30,

        email: user.email || 'harsh@company.com',
        phone: e?.phone || '+91 98765 43210',
        alternatePhone: e?.alternatePhone || '+91 98111 22334',
        currentStreet: e?.currentAddress?.address || 'Tower B, Cyber City',
        currentCity: e?.currentAddress?.city || 'Gurugram',
        currentState: e?.currentAddress?.state || 'Haryana',
        currentPinCode: e?.currentAddress?.pinCode || '122002',
        currentCountry: e?.currentAddress?.country || 'India',
        permanentAddress: e?.permanentAddress?.address || 'Green Park Main, South Delhi, Delhi 110016',

        skills: e?.skills?.join(', ') || 'Enterprise Architecture, React, Node.js, Cloud Operations, MongoDB',
        educationQualification: e?.educationQualification || 'B.Tech in Computer Science & Engineering',
        previousCompany: e?.previousCompany || 'Global Enterprise Cloud Systems',
        bio: e?.notes || 'Super Admin & Lead Enterprise Architect directing cloud ERP systems and infrastructure.',

        salaryBand: e?.salaryBand || 'Band E4 - Executive Architect',
        payrollGroup: e?.payrollGroup || 'Executive Leadership Monthly',
        weeklyCapacityHours: e?.weeklyCapacityHours ?? 40,
        workingHoursPerDay: e?.workingHoursPerDay ?? 8,
        status: e?.status || 'Active',
      });
    }
  }, [user]);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data?.settings?.organization) {
          setOrgForm((prev) => ({ ...prev, ...res.data.data.settings.organization }));
        }
      } catch {
        // use defaults
      }
    };
    loadSettings();
  }, []);

  // Copy helper
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showGlassToast.info('Copied', `${fieldName} copied to clipboard.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Initials generator
  const getInitials = (name) => {
    if (!name) return 'HS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Save Candidate Profile Changes to MongoDB
  const handleSaveCandidateProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const skillsArray = candidateForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        fullname: candidateForm.fullname,
        phone: candidateForm.phone,
        alternatePhone: candidateForm.alternatePhone,
        designation: candidateForm.designation,
        gender: candidateForm.gender,
        dateOfBirth: candidateForm.dateOfBirth,
        maritalStatus: candidateForm.maritalStatus,
        bloodGroup: candidateForm.bloodGroup,
        nationality: candidateForm.nationality,
        religion: candidateForm.religion,
        workLocation: candidateForm.workLocation,
        educationQualification: candidateForm.educationQualification,
        previousCompany: candidateForm.previousCompany,
        bio: candidateForm.bio,
        skills: skillsArray,
        currentAddress: {
          address: candidateForm.currentStreet,
          city: candidateForm.currentCity,
          state: candidateForm.currentState,
          pinCode: candidateForm.currentPinCode,
          country: candidateForm.currentCountry,
        },
        permanentAddress: {
          address: candidateForm.permanentAddress,
        },
      };

      const res = await updateProfile(payload);
      if (res.success) {
        setSavedSuccess(true);
        showGlassToast.success('Candidate Profile Saved', 'All candidate information successfully persisted to MongoDB.');
        setTimeout(() => setSavedSuccess(false), 3500);
      } else {
        showGlassToast.error('Save Failed', res.message || 'Could not save profile.');
      }
    } catch (err) {
      showGlassToast.error('Save Error', err?.message || 'Failed to update candidate record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Workspace Settings to MongoDB
  const handleSaveWorkspace = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/settings', { organization: orgForm });
      setSavedSuccess(true);
      showGlassToast.success('Workspace Saved', 'Enterprise workspace parameters saved to MongoDB.');
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      showGlassToast.error('Save Failed', err.response?.data?.message || 'Could not save workspace parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showGlassToast.error('Required', 'Please fill in current and new password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showGlassToast.error('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    try {
      setIsUpdatingPassword(true);
      const res = await api.put('/auth/profile/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data?.success) {
        showGlassToast.success('Password Updated', 'Your administrator password has been updated in database.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showGlassToast.error('Failed', err.response?.data?.message || 'Current password incorrect.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Standard CSS classes and styling with smooth hover animations
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--input-text)',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const disabledInputStyle = {
    ...inputStyle,
    backgroundColor: 'var(--input-disabled-bg)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--input-disabled-text)',
    cursor: 'not-allowed',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 650,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  const primaryBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 22px',
    borderRadius: '9px',
    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: isSaving ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.45)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isSaving ? 0.75 : 1,
  };

  return (
    <div
      style={{
        padding: '24px 28px',
        backgroundColor: 'var(--bg-app)',
        minHeight: '100%',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      {/* 
        NOTE: Red-selected header block has been completely removed as requested!
        The page starts directly with the standard tab buttons in the yellow area.
      */}

      {/* YELLOW AREA: Standard Candidate & Employee Information Tab Buttons with Hover Animations */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'personal', label: 'Personal & Identity', icon: User },
          { id: 'employment', label: 'Employment & Role', icon: Briefcase },
          { id: 'contact', label: 'Contact & Address', icon: Phone },
          { id: 'skills', label: 'Skills & Qualifications', icon: GraduationCap },
          { id: 'payroll', label: 'Payroll & Capacity', icon: CreditCard },
          { id: 'security', label: 'Account & Security', icon: Shield },
          { id: 'workspace', label: 'Workspace Parameters', icon: Sliders },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '9px',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary-light)' : 'var(--border-subtle)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                color: isActive ? 'var(--color-primary-light)' : 'var(--text-secondary)',
                fontWeight: isActive ? 650 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.2)' : 'none',
                transform: isActive ? 'translateY(-1px)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <Icon size={15} style={{ color: isActive ? 'var(--color-primary-light)' : 'var(--text-muted)' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* WHITE AREA: Main Candidate Profile Panel showing ALL information present */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '28px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maxWidth: '880px',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Candidate Top Identity Card (Always Visible Across Information Tabs) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 900,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                flexShrink: 0,
              }}
            >
              {getInitials(candidateForm.fullname)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {candidateForm.fullname}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {candidateForm.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Candidate ID: <strong style={{ color: 'var(--text-accent)' }}>{candidateForm.employeeId}</strong> &bull; Role:{' '}
                <strong style={{ color: '#10b981' }}>{candidateForm.designation}</strong>
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Department: <strong style={{ color: 'var(--text-secondary)' }}>{candidateForm.department}</strong> &bull; Location:{' '}
                <strong style={{ color: 'var(--text-secondary)' }}>{candidateForm.workLocation}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontSize: '11px',
                fontWeight: 650,
              }}
            >
              <Check size={13} />
              Enterprise Verified
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Joined: {candidateForm.dateOfJoining}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BUTTON 1: PERSONAL & IDENTITY INFORMATION                                 */}
        {/* ========================================================================= */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSaveCandidateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Candidate Name</label>
                <input
                  type="text"
                  value={candidateForm.fullname}
                  onChange={(e) => setCandidateForm({ ...candidateForm, fullname: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Candidate Employee ID</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Read-only</span>
                </label>
                <input
                  type="text"
                  value={candidateForm.employeeId}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  value={candidateForm.dateOfBirth}
                  onChange={(e) => setCandidateForm({ ...candidateForm, dateOfBirth: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  value={candidateForm.gender}
                  onChange={(e) => setCandidateForm({ ...candidateForm, gender: e.target.value })}
                  style={{ ...inputStyle, backgroundColor: '#0f172a' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Marital Status</label>
                <select
                  value={candidateForm.maritalStatus}
                  onChange={(e) => setCandidateForm({ ...candidateForm, maritalStatus: e.target.value })}
                  style={{ ...inputStyle, backgroundColor: '#0f172a' }}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Blood Group</label>
                <input
                  type="text"
                  value={candidateForm.bloodGroup}
                  onChange={(e) => setCandidateForm({ ...candidateForm, bloodGroup: e.target.value })}
                  placeholder="e.g. O+, A+, B+"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Nationality</label>
                <input
                  type="text"
                  value={candidateForm.nationality}
                  onChange={(e) => setCandidateForm({ ...candidateForm, nationality: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Religion / Belief</label>
                <input
                  type="text"
                  value={candidateForm.religion}
                  onChange={(e) => setCandidateForm({ ...candidateForm, religion: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} style={primaryBtnStyle}>
                <Save size={16} />
                <span>{isSaving ? 'Saving to Database...' : 'Save & Sync to Database'}</span>
              </button>
              {savedSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 650 }}>
                  <CheckCircle size={16} />
                  <span>Changes saved in MongoDB!</span>
                </span>
              )}
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* BUTTON 2: EMPLOYMENT & ROLE INFORMATION                                   */}
        {/* ========================================================================= */}
        {activeTab === 'employment' && (
          <form onSubmit={handleSaveCandidateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Designation / Professional Title</label>
                <input
                  type="text"
                  value={candidateForm.designation}
                  onChange={(e) => setCandidateForm({ ...candidateForm, designation: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Assigned Department</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>HR Managed</span>
                </label>
                <input
                  type="text"
                  value={candidateForm.department}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Employment Type</label>
                <input
                  type="text"
                  value={candidateForm.employmentType}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Work Location / Office</label>
                <input
                  type="text"
                  value={candidateForm.workLocation}
                  onChange={(e) => setCandidateForm({ ...candidateForm, workLocation: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Official Date of Joining</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Statutory</span>
                </label>
                <input
                  type="date"
                  value={candidateForm.dateOfJoining}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Total Professional Experience (Years)</label>
                <input
                  type="number"
                  value={candidateForm.experience}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Probation Period (Months)</label>
                <input
                  type="number"
                  value={candidateForm.probationPeriod}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Notice Period (Days)</label>
                <input
                  type="number"
                  value={candidateForm.noticePeriod}
                  disabled
                  style={disabledInputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} style={primaryBtnStyle}>
                <Save size={16} />
                <span>{isSaving ? 'Saving to Database...' : 'Save & Sync to Database'}</span>
              </button>
              {savedSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 650 }}>
                  <CheckCircle size={16} />
                  <span>Employment information updated in MongoDB!</span>
                </span>
              )}
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* BUTTON 3: CONTACT & ADDRESS INFORMATION                                   */}
        {/* ========================================================================= */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSaveCandidateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Primary Email (Corporate Login)</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Read-only</span>
                </label>
                <input
                  type="email"
                  value={candidateForm.email}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Direct Mobile / Phone</label>
                <input
                  type="text"
                  value={candidateForm.phone}
                  onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Alternate Phone / Emergency Contact</label>
                <input
                  type="text"
                  value={candidateForm.alternatePhone}
                  onChange={(e) => setCandidateForm({ ...candidateForm, alternatePhone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Current Street Address</label>
                <input
                  type="text"
                  value={candidateForm.currentStreet}
                  onChange={(e) => setCandidateForm({ ...candidateForm, currentStreet: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Current City & State</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    value={candidateForm.currentCity}
                    onChange={(e) => setCandidateForm({ ...candidateForm, currentCity: e.target.value })}
                    placeholder="City"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={candidateForm.currentState}
                    onChange={(e) => setCandidateForm({ ...candidateForm, currentState: e.target.value })}
                    placeholder="State"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>PIN Code & Country</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    value={candidateForm.currentPinCode}
                    onChange={(e) => setCandidateForm({ ...candidateForm, currentPinCode: e.target.value })}
                    placeholder="PIN"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={candidateForm.currentCountry}
                    onChange={(e) => setCandidateForm({ ...candidateForm, currentCountry: e.target.value })}
                    placeholder="Country"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Permanent Address</label>
              <textarea
                rows={2}
                value={candidateForm.permanentAddress}
                onChange={(e) => setCandidateForm({ ...candidateForm, permanentAddress: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} style={primaryBtnStyle}>
                <Save size={16} />
                <span>{isSaving ? 'Saving to Database...' : 'Save & Sync to Database'}</span>
              </button>
              {savedSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 650 }}>
                  <CheckCircle size={16} />
                  <span>Contact and address saved in MongoDB!</span>
                </span>
              )}
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* BUTTON 4: SKILLS & QUALIFICATIONS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'skills' && (
          <form onSubmit={handleSaveCandidateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Core Competencies & Stack (Comma separated)</label>
              <input
                type="text"
                value={candidateForm.skills}
                onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })}
                placeholder="React, Node.js, Enterprise Architecture, MongoDB"
                style={inputStyle}
              />
              <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Used for automated skill matching in project task assignments.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Educational Qualification</label>
                <input
                  type="text"
                  value={candidateForm.educationQualification}
                  onChange={(e) => setCandidateForm({ ...candidateForm, educationQualification: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Previous Company / Organization</label>
                <input
                  type="text"
                  value={candidateForm.previousCompany}
                  onChange={(e) => setCandidateForm({ ...candidateForm, previousCompany: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Professional Biography & Operational Focus</label>
              <textarea
                rows={4}
                value={candidateForm.bio}
                onChange={(e) => setCandidateForm({ ...candidateForm, bio: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} style={primaryBtnStyle}>
                <Save size={16} />
                <span>{isSaving ? 'Saving to Database...' : 'Save & Sync to Database'}</span>
              </button>
              {savedSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 650 }}>
                  <CheckCircle size={16} />
                  <span>Skills and bio persisted in MongoDB!</span>
                </span>
              )}
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* BUTTON 5: PAYROLL & CAPACITY INFORMATION                                  */}
        {/* ========================================================================= */}
        {activeTab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Salary Band</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>HR Confidential</span>
                </label>
                <input
                  type="text"
                  value={candidateForm.salaryBand}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Payroll Group</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Statutory</span>
                </label>
                <input
                  type="text"
                  value={candidateForm.payrollGroup}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Weekly Capacity Hours</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Fixed</span>
                </label>
                <input
                  type="text"
                  value={`${candidateForm.weeklyCapacityHours} Hours / Week`}
                  disabled
                  style={disabledInputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Working Hours Per Day</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Shift SLA</span>
                </label>
                <input
                  type="text"
                  value={`${candidateForm.workingHoursPerDay} Hours / Day`}
                  disabled
                  style={disabledInputStyle}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Payroll Direct Deposit & Tax Status
                </h5>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Managed by enterprise accounting batch processing and statutory compliance module.
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#34d399',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                Disbursement Verified
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BUTTON 6: ACCOUNT & SECURITY PROTOCOLS                                    */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 2FA Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <h5 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Two-Factor Authentication (2FA)
                </h5>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Enforces secondary TOTP cryptographic authenticator verification on administrator login
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorAuth(!twoFactorAuth);
                  showGlassToast.info('2FA Preference', `Two-factor authentication ${!twoFactorAuth ? 'enabled' : 'disabled'}.`);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: twoFactorAuth ? '#10b981' : 'var(--border-strong)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {twoFactorAuth ? 'Active • Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Change Account Password */}
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h5 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--text-primary)' }}>
                Change Account Password
              </h5>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="password"
                    placeholder="New Secure Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  style={{
                    width: 'fit-content',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--color-primary-light)',
                    border: '1px solid var(--border-focus)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* REST API Key */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Developer REST API Token
                  </h5>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    Authorizes automated external CI/CD integrations
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                    }}
                  >
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showApiKey ? 'Hide' : 'Reveal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(apiKey, 'API Token')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={13} />
                    <span>{copiedField === 'API Token' ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
              </div>
              <div
                style={{
                  marginTop: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--text-accent)',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px',
                  borderRadius: '6px',
                }}
              >
                {showApiKey ? apiKey : 'sk_live_erp_••••••••••••••••••••••••••••••••'}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BUTTON 7: WORKSPACE PARAMETERS                                            */}
        {/* ========================================================================= */}
        {activeTab === 'workspace' && (
          <form onSubmit={handleSaveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Enterprise Organization Name</label>
                <input
                  type="text"
                  value={orgForm.orgName}
                  onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Support & IT Contact Email</label>
                <input
                  type="email"
                  value={orgForm.supportEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, supportEmail: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Workspace Timezone</label>
                <select
                  value={orgForm.timezone}
                  onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                  style={{ ...inputStyle, backgroundColor: '#0f172a' }}
                >
                  <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                  <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Default Base Currency</label>
                <select
                  value={orgForm.currency}
                  onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                  style={{ ...inputStyle, backgroundColor: '#0f172a' }}
                >
                  <option value="INR (₹)">Indian Rupee - INR (₹)</option>
                  <option value="USD ($)">US Dollar - USD ($)</option>
                  <option value="EUR (€)">Euro - EUR (€)</option>
                  <option value="GBP (£)">British Pound - GBP (£)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Fiscal Year Cycle</label>
                <input
                  type="text"
                  value={orgForm.fiscalYear}
                  onChange={(e) => setOrgForm({ ...orgForm, fiscalYear: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={12} style={{ color: '#94a3b8' }} />
                  <span>Workspace Organization ID</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: 'auto' }}>Read-only</span>
                </label>
                <input
                  type="text"
                  value="org_erp_8849204"
                  disabled
                  style={disabledInputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} style={primaryBtnStyle}>
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Workspace Parameters'}</span>
              </button>
              {savedSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 650 }}>
                  <CheckCircle size={16} />
                  <span>Workspace parameters saved in MongoDB!</span>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings;
