import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showGlassToast } from '../components/GlassToast';
import { 
  ArrowLeft, 
  Users, 
  Upload, 
  Lock, 
  Check, 
  RefreshCw, 
  AlertCircle,
  FileText,
  MapPin,
  Briefcase,
  User,
  Search,
  BookOpen
} from 'lucide-react';

const RegisterEmployee = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // States for lookup data
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Auto-generate unique Employee ID
  const generateEmpId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `EMP-${randomNum}`;
  };

  // Section 01: Personal Information
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [nationality, setNationality] = useState('Indian');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [religion, setReligion] = useState('Hinduism');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarPositionX, setAvatarPositionX] = useState(50);
  const [avatarPositionY, setAvatarPositionY] = useState(50);
  const [isAvatarConfirmed, setIsAvatarConfirmed] = useState(false);
  const [isAdjustingAvatar, setIsAdjustingAvatar] = useState(false);

  // Section 02: Employment Information
  const [employeeId, setEmployeeId] = useState(generateEmpId());
  const [selectedDept, setSelectedDept] = useState('');
  const [designation, setDesignation] = useState('Developer');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [reportingManager, setReportingManager] = useState('');
  const [workLocation, setWorkLocation] = useState('Noida Office');
  const [probationPeriod, setProbationPeriod] = useState('6');
  const [employeeStatus, setEmployeeStatus] = useState('Active');
  const [noticePeriod, setNoticePeriod] = useState('60');
  const [workingHours, setWorkingHours] = useState('8');
  const [payrollGroup, setPayrollGroup] = useState('Regular Staff');

  // Section 03: Address Information
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  
  const [currentAddressVal, setCurrentAddressVal] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentPIN, setCurrentPIN] = useState('');
  const [currentCountry, setCurrentCountry] = useState('India');

  const [permAddressVal, setPermAddressVal] = useState('');
  const [permCity, setPermCity] = useState('');
  const [permState, setPermState] = useState('');
  const [permPIN, setPermPIN] = useState('');
  const [permCountry, setPermCountry] = useState('India');

  // Section 04: Skills
  const [skillsSearch, setSkillsSearch] = useState('');
  const [skillsList, setSkillsList] = useState([]);
  
  const availableSkills = [
    'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express.js', 'Python', 'Java', 'SQL',
    'Git', 'HTML', 'CSS', 'TypeScript', 'Next.js', 'Tailwind CSS', 'AWS', 'Docker',
    'Postman', 'Jest', 'Figma', 'Communication', 'Teamwork', 'Problem Solving',
    'Leadership', 'Time Management', 'Analytical Thinking'
  ];

  // Section 05: Documents Upload
  const [doc12th, setDoc12th] = useState(null);
  const [docGrad, setDocGrad] = useState(null);
  const [docAadhaar, setDocAadhaar] = useState(null);
  const [docPan, setDocPan] = useState(null);
  const [docResume, setDocResume] = useState(null);
  const [docOther, setDocOther] = useState(null);

  // Section 06: Additional Info
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('0');
  const [previousCompany, setPreviousCompany] = useState('');
  const [notes, setNotes] = useState('');

  // Status/Error States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  // Toast State for invalid inputs
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    showGlassToast({ 
      title: type === 'error' ? 'Validation Notice' : 'Notice', 
      message, 
      type 
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const validateEmail = (val) => {
    if (!val) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      showToast('email is not valid', 'error');
      setEmail(''); // remove the input
    }
  };

  const validatePhone = (val, isAlt = false) => {
    if (!val) return;
    const phoneRegex = /^\+?[0-9\s\-]{10,15}$/;
    if (!phoneRegex.test(val)) {
      showToast('mobile number is not valid', 'error');
      if (isAlt) {
        setAlternatePhone(''); // remove the input
      } else {
        setPhone(''); // remove the input
      }
    }
  };

  // Load Lookup values
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          api.get('/departments'),
          api.get('/employees')
        ]);
        
        const deptsData = deptRes.data?.data?.departments || deptRes.data?.data || [];
        setDepartments(deptsData);
        if (deptsData.length > 0) {
          setSelectedDept(deptsData[0]._id);
        }

        const empsData = empRes.data?.data?.employees || empRes.data?.data || [];
        setManagers(empsData);
      } catch (err) {
        console.warn("Failed to load department or manager lookups:", err);
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, []);

  // Sync permanent address when check box ticked
  useEffect(() => {
    if (sameAsCurrent) {
      setPermAddressVal(currentAddressVal);
      setPermCity(currentCity);
      setPermState(currentState);
      setPermPIN(currentPIN);
      setPermCountry(currentCountry);
    }
  }, [sameAsCurrent, currentAddressVal, currentCity, currentState, currentPIN, currentCountry]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarScale(1);
      setAvatarPositionX(50);
      setAvatarPositionY(50);
      setIsAvatarConfirmed(false);
      setIsAdjustingAvatar(true);
    }
  };

  const handleMouseDown = (e) => {
    if (isAvatarConfirmed) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = avatarPositionX;
    const initialY = avatarPositionY;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const sensitivity = 0.4 / avatarScale;
      setAvatarPositionX(Math.max(0, Math.min(100, Math.round(initialX - deltaX * sensitivity))));
      setAvatarPositionY(Math.max(0, Math.min(100, Math.round(initialY - deltaY * sensitivity))));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSkillToggle = (skill) => {
    if (skillsList.includes(skill)) {
      setSkillsList(prev => prev.filter(s => s !== skill));
    } else {
      setSkillsList(prev => [...prev, skill]);
    }
  };

  const resetForm = () => {
    setFullname('');
    setEmail('');
    setPhone('');
    setAlternatePhone('');
    setDateOfBirth('');
    setGender('Male');
    setMaritalStatus('Single');
    setNationality('Indian');
    setBloodGroup('A+');
    setReligion('Hinduism');
    setAvatar(null);
    setAvatarPreview(null);
    setAvatarScale(1);
    setAvatarPositionX(50);
    setAvatarPositionY(50);
    setIsAvatarConfirmed(false);
    setIsAdjustingAvatar(false);
    
    setEmployeeId(generateEmpId());
    setDesignation('Developer');
    setEmploymentType('Full-Time');
    setDateOfJoining(new Date().toISOString().split('T')[0]);
    setReportingManager('');
    setWorkLocation('Noida Office');
    setProbationPeriod('6');
    setEmployeeStatus('Active');
    setNoticePeriod('60');
    setWorkingHours('8');
    setPayrollGroup('Regular Staff');

    setSameAsCurrent(false);
    setCurrentAddressVal('');
    setCurrentCity('');
    setCurrentState('');
    setCurrentPIN('');
    setPermAddressVal('');
    setPermCity('');
    setPermState('');
    setPermPIN('');

    setSkillsList([]);
    setDoc12th(null);
    setDocGrad(null);
    setDocAadhaar(null);
    setDocPan(null);
    setDocResume(null);
    setDocOther(null);

    setEducation('');
    setExperience('0');
    setPreviousCompany('');
    setNotes('');

    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      // 1. Create the User account on the backend first
      // Pass email & password same (password123)
      const userPayload = new FormData();
      userPayload.append('fullname', fullname);
      userPayload.append('email', email);
      userPayload.append('password', 'password123'); // Password same as per requirements
      userPayload.append('role', 'Employee');
      userPayload.append('address', `${currentAddressVal}, ${currentCity}, ${currentState}`);
      userPayload.append('avatarScale', avatarScale);
      userPayload.append('avatarPositionX', avatarPositionX);
      userPayload.append('avatarPositionY', avatarPositionY);
      if (avatar) {
        userPayload.append('avatar', avatar);
      }

      const registerRes = await api.post('/auth/register', userPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const createdUser = registerRes.data?.data?.user || registerRes.data?.data;
      if (!createdUser?._id) {
        throw new Error('User registration failed');
      }

      // 2. Upload documents to obtain public URLs (simulating or passing files)
      const employeePayload = new FormData();
      employeePayload.append('user', createdUser._id);
      employeePayload.append('department', selectedDept);
      employeePayload.append('designation', designation);
      employeePayload.append('experience', Number(experience));
      employeePayload.append('salaryBand', 'B2');
      employeePayload.append('status', employeeStatus);
      employeePayload.append('weeklyCapacityHours', Number(workingHours) * 5);
      employeePayload.append('dateOfJoining', dateOfJoining);
      
      // New form fields
      employeePayload.append('employeeId', employeeId);
      employeePayload.append('phone', phone);
      employeePayload.append('alternatePhone', alternatePhone);
      employeePayload.append('dateOfBirth', dateOfBirth);
      employeePayload.append('gender', gender);
      employeePayload.append('maritalStatus', maritalStatus);
      employeePayload.append('nationality', nationality);
      employeePayload.append('bloodGroup', bloodGroup);
      employeePayload.append('religion', religion);
      employeePayload.append('employmentType', employmentType);
      if (reportingManager) {
        employeePayload.append('reportingManager', reportingManager);
      }
      employeePayload.append('workLocation', workLocation);
      employeePayload.append('probationPeriod', Number(probationPeriod));
      employeePayload.append('noticePeriod', Number(noticePeriod));
      employeePayload.append('workingHoursPerDay', Number(workingHours));
      employeePayload.append('payrollGroup', payrollGroup);

      // Addresses
      employeePayload.append('currentAddress[address]', currentAddressVal);
      employeePayload.append('currentAddress[city]', currentCity);
      employeePayload.append('currentAddress[state]', currentState);
      employeePayload.append('currentAddress[pinCode]', currentPIN);
      employeePayload.append('currentAddress[country]', currentCountry);

      employeePayload.append('permanentAddress[address]', permAddressVal);
      employeePayload.append('permanentAddress[city]', permCity);
      employeePayload.append('permanentAddress[state]', permState);
      employeePayload.append('permanentAddress[pinCode]', permPIN);
      employeePayload.append('permanentAddress[country]', permCountry);
      
      employeePayload.append('sameAsCurrentAddress', sameAsCurrent);
      employeePayload.append('educationQualification', education);
      employeePayload.append('previousCompany', previousCompany);
      employeePayload.append('notes', notes);
      employeePayload.append('avatarScale', Number(avatarScale));
      employeePayload.append('avatarPositionX', Number(avatarPositionX));
      employeePayload.append('avatarPositionY', Number(avatarPositionY));

      // Append skills array
      skillsList.forEach(s => employeePayload.append('skills[]', s));

      // Append documents files
      if (doc12th) employeePayload.append('documents', doc12th);
      if (docGrad) employeePayload.append('documents', docGrad);
      if (docAadhaar) employeePayload.append('documents', docAadhaar);
      if (docPan) employeePayload.append('documents', docPan);
      if (docResume) employeePayload.append('documents', docResume);
      if (docOther) employeePayload.append('documents', docOther);

      await api.post('/employees', employeePayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showGlassToast.success('Employee Registered', 'Employee registered successfully! Default login password: password123');
      setSuccessMsg('Employee registered successfully! Default login password is: password123');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/employees');
      }, 3000);
    } catch (err) {
      console.error(err);
      const errTxt = err.response?.data?.message || 'Failed to register employee. Verify your inputs.';
      showGlassToast.error('Registration Failed', errTxt);
      setErrorMsg(errTxt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSkills = availableSkills.filter(s => 
    s.toLowerCase().includes(skillsSearch.toLowerCase())
  );

  const isFormValid = 
    fullname.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    dateOfBirth !== '' &&
    gender !== '' &&
    maritalStatus !== '' &&
    selectedDept !== '' &&
    designation !== '' &&
    employmentType !== '' &&
    dateOfJoining !== '' &&
    workLocation !== '' &&
    employeeStatus !== '' &&
    currentAddressVal.trim() !== '' &&
    currentCity.trim() !== '' &&
    currentState.trim() !== '' &&
    currentPIN.trim() !== '' &&
    currentCountry !== '' &&
    (sameAsCurrent || (
      permAddressVal.trim() !== '' &&
      permCity.trim() !== '' &&
      permState.trim() !== '' &&
      permPIN.trim() !== '' &&
      permCountry !== ''
    )) &&
    doc12th !== null &&
    docGrad !== null &&
    docAadhaar !== null &&
    docPan !== null &&
    docResume !== null;

  return (
    <div className="content-pane" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.05) 0%, transparent 40%), var(--bg-app)',
      padding: '24px 30px'
    }}>
      {/* Custom styles matching the mockup screenshot */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .register-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .section-num {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
          letter-spacing: 0.2px;
        }
        .input-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .form-label-required::after {
          content: ' *';
          color: var(--color-danger);
          font-weight: bold;
        }
        .photo-dropzone {
          border: 2px dashed var(--input-border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          background: var(--input-bg);
          transition: border-color 0.2s, background-color 0.2s;
          text-align: center;
          height: 180px;
        }
        .photo-dropzone:hover {
          border-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.03);
        }
        .doc-upload-box {
          border: 1px solid var(--input-border);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--input-bg);
          text-align: center;
        }
        .doc-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-upload-btn {
          font-size: 11px;
          padding: 6px 12px;
          height: 28px;
          border-radius: 6px;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-main);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .doc-upload-btn:hover {
          background: var(--border-color);
        }
        .skills-container {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        .skills-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          min-height: 120px;
        }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: var(--color-primary-light);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
        }
        .skill-tag:hover {
          background: rgba(23, 27, 38, 0.1);
          border-color: rgba(23, 27, 38, 0.3);
          color: var(--color-danger);
        }
        .btn-gradient-glow {
          position: relative;
          cursor: pointer;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          font-family: var(--font-title);
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 28px;
          height: 42px;
          border: none;
          background: linear-gradient(90deg, #8b5cf6 10%, #0ea5e9 30%, #ec4899 90%);
          background-size: 400% 400%;
          border-radius: 30px;
          z-index: 1;
          transition: transform 0.2s ease, filter 0.2s ease, background-size 0.5s ease;
          will-change: transform, filter;
        }
        .btn-gradient-glow::before {
          content: "";
          position: absolute;
          top: -4px;
          bottom: -4px;
          left: -4px;
          right: -4px;
          background: linear-gradient(90deg, #8b5cf6 10%, #0ea5e9 30%, #ec4899 90%);
          background-size: 400% 400%;
          z-index: -1;
          border-radius: 34px;
          transition: filter 1s ease-in-out, background-size 1s ease-in-out;
          will-change: filter;
        }
        .btn-gradient-glow:hover:not(:disabled) {
          background-size: 100% 100%;
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .btn-gradient-glow:hover:not(:disabled)::before {
          filter: blur(16px);
          background-size: 10% 10%;
        }
        .btn-gradient-glow:active:not(:disabled) {
          transform: translateY(2px);
          filter: brightness(0.9);
        }
        .btn-gradient-glow:disabled {
          cursor: not-allowed;
          background: var(--input-border);
          color: var(--text-muted);
          opacity: 0.5;
        }
        .btn-gradient-glow:disabled::before {
          display: none;
        }
        .smky-btn3 {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 24px;
          height: 42px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          font-family: var(--font-title);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          z-index: 1;
          transition: color 0.5s ease-in-out, border-color 0.5s ease-in-out;
        }
        .smky-btn3::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 4px;
          bottom: 0;
          left: 0;
          background: var(--color-danger);
          border-top-left-radius: 9999px;
          border-top-right-radius: 9999px;
          z-index: -1;
          transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.5s ease;
        }
        .smky-btn3:hover {
          color: #ffffff;
          border-color: var(--color-danger);
        }
        .smky-btn3:hover::after {
          height: 250%;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
        .smky-btn3 .reset-icon {
          display: inline-block;
          transform-origin: center;
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          will-change: transform;
        }
        .smky-btn3:hover .reset-icon {
          transform: rotate(180deg);
        }
      `}</style>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
            <span>Dashboard</span>
            <span>&gt;</span>
            <span>Employees</span>
            <span>&gt;</span>
            <span style={{ color: 'var(--text-main)' }}>Register New Employee</span>
          </div>
          <h1 className="page-title">Register New Employee</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Add new employee details to the organization
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/employees')} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}>
            <Users size={16} />
            <span>All Employees</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/employees')} style={{ padding: '0 10px', height: '36px' }}>
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="register-container">
        {/* SECTION 01: PERSONAL INFORMATION */}
        <div className="form-section-card">
          <div className="section-header">
            <span className="section-num">01</span>
            <h3 className="section-title">Personal Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '24px' }}>
            {/* Input grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label-required">Full Name</label>
                <input type="text" required placeholder="Enter full name" className="form-input" value={fullname} onChange={e => setFullname(e.target.value)} />
              </div>

              <div className="input-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter email address" 
                    className="form-input" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    onBlur={e => validateEmail(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="Enter phone number" 
                    className="form-input" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    onBlur={e => validatePhone(e.target.value, false)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Alternate Phone</label>
                  <input 
                    type="tel" 
                    placeholder="Enter alternate number" 
                    className="form-input" 
                    value={alternatePhone} 
                    onChange={e => setAlternatePhone(e.target.value)} 
                    onBlur={e => validatePhone(e.target.value, true)}
                  />
                </div>
              </div>

              <div className="input-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Date of Birth</label>
                  <input type="date" required className="form-input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Gender</label>
                  <select className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Marital Status</label>
                  <select className="form-input" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
              </div>

              <div className="input-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nationality</label>
                  <select className="form-input" value={nationality} onChange={e => setNationality(e.target.value)}>
                    <option>Indian</option>
                    <option>American</option>
                    <option>British</option>
                    <option>Canadian</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Blood Group</label>
                  <select className="form-input" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Religion</label>
                  <select className="form-input" value={religion} onChange={e => setReligion(e.target.value)}>
                    <option>Hinduism</option>
                    <option>Islam</option>
                    <option>Christianity</option>
                    <option>Sikhism</option>
                    <option>Buddhism</option>
                    <option>Jainism</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Photo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Profile Photo</label>
              {avatar && isAdjustingAvatar ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Drag image to position. Use slider to zoom.
                  </span>
                  
                  <div 
                    onMouseDown={handleMouseDown}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid var(--color-primary)',
                      boxShadow: 'var(--shadow-md)',
                      cursor: 'move',
                      position: 'relative',
                      backgroundColor: '#000'
                    }}
                    title="Drag to position"
                  >
                    <img 
                      src={avatarPreview} 
                      alt="Cropping Preview"
                      draggable="false"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${avatarScale})`,
                        objectPosition: `${avatarPositionX}% ${avatarPositionY}%`,
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    />
                  </div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                      <span>Zoom</span>
                      <span>{avatarScale}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.1" 
                      value={avatarScale} 
                      onChange={e => setAvatarScale(Number(e.target.value))}
                      style={{ accentColor: 'var(--color-primary)', cursor: 'pointer', width: '100%', height: '4px' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    style={{ height: '28px', fontSize: '11px', padding: '0 12px' }}
                    onClick={() => {
                      setIsAvatarConfirmed(true);
                      setIsAdjustingAvatar(false);
                    }}
                  >
                    Apply Adjustment
                  </button>
                </div>
              ) : avatar && isAvatarConfirmed ? (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '180px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1.5px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--input-bg)'
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--border-color)'
                  }}>
                    <img 
                      src={avatarPreview} 
                      alt="Confirmed Avatar" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transform: `scale(${avatarScale})`,
                        objectPosition: `${avatarPositionX}% ${avatarPositionY}%`
                      }} 
                    />
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setIsAdjustingAvatar(true)}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '4px 0',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar(null);
                        setAvatarPreview(null);
                        setIsAvatarConfirmed(false);
                        setIsAdjustingAvatar(false);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 0',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="photo-dropzone" onClick={() => fileInputRef.current.click()}>
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAvatarChange} />
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <Upload size={22} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Upload Photo</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>JPG, PNG or GIF (Max. 2MB)</span>
                  <button type="button" className="doc-upload-btn" style={{ marginTop: '4px' }}>Choose File</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 02: EMPLOYMENT INFORMATION */}
        <div className="form-section-card">
          <div className="section-header">
            <span className="section-num">02</span>
            <h3 className="section-title">Employment Information</h3>
          </div>

          <div className="input-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Employee ID</label>
              <div style={{ position: 'relative' }}>
                <input type="text" disabled className="form-input" style={{ paddingLeft: '34px', cursor: 'not-allowed', color: 'var(--text-muted)' }} value={employeeId} />
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Department</label>
              <select className="form-input" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Designation</label>
              <select className="form-input" value={designation} onChange={e => setDesignation(e.target.value)}>
                <option>Developer</option>
                <option>Senior Developer</option>
                <option>Lead Developer</option>
                <option>Manager</option>
                <option>HR Recruiter</option>
                <option>Accountant</option>
                <option>System Administrator</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Employment Type</label>
              <select className="form-input" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                <option>Full-Time</option>
                <option>Part-Time</option>
                <option>Contract</option>
                <option>Intern</option>
              </select>
            </div>
          </div>

          <div className="input-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Date of Joining</label>
              <input type="date" required className="form-input" value={dateOfJoining} onChange={e => setDateOfJoining(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Reporting Manager</label>
              <select className="form-input" value={reportingManager} onChange={e => setReportingManager(e.target.value)}>
                <option value="">Select reporting manager</option>
                {managers.map(m => (
                  <option key={m._id} value={m._id}>{m.fullname || m.user?.fullname}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Work Location</label>
              <select className="form-input" value={workLocation} onChange={e => setWorkLocation(e.target.value)}>
                <option>Noida Office</option>
                <option>Bangalore Office</option>
                <option>Remote</option>
                <option>Hybrid</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Probation Period (Months)</label>
              <input 
                type="number" 
                min="0" 
                placeholder="Enter probation period" 
                className="form-input" 
                value={probationPeriod} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= 0) {
                    setProbationPeriod(val);
                  }
                }} 
              />
            </div>
          </div>

          <div className="input-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-required">Employee Status</label>
              <select className="form-input" value={employeeStatus} onChange={e => setEmployeeStatus(e.target.value)}>
                <option>Active</option>
                <option>On Leave</option>
                <option>Terminated</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notice Period (Days)</label>
              <input 
                type="number" 
                min="0" 
                placeholder="Enter notice period" 
                className="form-input" 
                value={noticePeriod} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= 0) {
                    setNoticePeriod(val);
                  }
                }} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Working Hours/Day</label>
              <input 
                type="number" 
                min="0" 
                placeholder="Enter working hours" 
                className="form-input" 
                value={workingHours} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= 0) {
                    setWorkingHours(val);
                  }
                }} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Payroll Group</label>
              <select className="form-input" value={payrollGroup} onChange={e => setPayrollGroup(e.target.value)}>
                <option>Regular Staff</option>
                <option>Executive</option>
                <option>Management</option>
                <option>Interns</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 03: ADDRESS INFORMATION */}
        <div className="form-section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="section-num">03</span>
              <h3 className="section-title">Address Information</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <input type="checkbox" id="sameAddress" checked={sameAsCurrent} onChange={e => setSameAsCurrent(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
              <label htmlFor="sameAddress" style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Same as Current Address</label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Current Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>Current Address</h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label-required">Address</label>
                <textarea rows={3} required placeholder="Enter current address" className="form-input" value={currentAddressVal} onChange={e => setCurrentAddressVal(e.target.value)} style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">City</label>
                  <input type="text" required placeholder="Enter city" className="form-input" value={currentCity} onChange={e => setCurrentCity(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">State</label>
                  <input type="text" required placeholder="Enter state" className="form-input" value={currentState} onChange={e => setCurrentState(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">PIN Code</label>
                  <input type="text" required placeholder="Enter PIN code" className="form-input" value={currentPIN} onChange={e => setCurrentPIN(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Country</label>
                  <select className="form-input" value={currentCountry} onChange={e => setCurrentCountry(e.target.value)}>
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: sameAsCurrent ? 0.6 : 1, pointerEvents: sameAsCurrent ? 'none' : 'auto' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>Permanent Address</h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label-required">Address</label>
                <textarea rows={3} required placeholder="Enter permanent address" className="form-input" value={permAddressVal} onChange={e => setPermAddressVal(e.target.value)} style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">City</label>
                  <input type="text" required placeholder="Enter city" className="form-input" value={permCity} onChange={e => setPermCity(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">State</label>
                  <input type="text" required placeholder="Enter state" className="form-input" value={permState} onChange={e => setPermState(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">PIN Code</label>
                  <input type="text" required placeholder="Enter PIN code" className="form-input" value={permPIN} onChange={e => setPermPIN(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label-required">Country</label>
                  <select className="form-input" value={permCountry} onChange={e => setPermCountry(e.target.value)}>
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 04: SKILLS INFORMATION */}
        <div className="form-section-card">
          <div className="section-header">
            <span className="section-num">04</span>
            <h3 className="section-title">Skills Information</h3>
          </div>

          <div className="skills-container">
            <div>
              <label className="form-label-required" style={{ fontSize: '13px' }}>Skills</label>
              <div style={{ position: 'relative', marginTop: '6px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Select or search skills..." 
                  className="form-input" 
                  style={{ paddingLeft: '34px' }}
                  value={skillsSearch} 
                  onChange={e => setSkillsSearch(e.target.value)} 
                />
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              {/* Tag Selection container */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                {filteredSkills.map(skill => {
                  const isSelected = skillsList.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 500,
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--input-bg)',
                        color: isSelected ? 'var(--color-primary-light)' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of currently selected tags (matching design tag cloud style) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Selected Skills ({skillsList.length})</label>
              <div className="skills-tag-list">
                {skillsList.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 'auto' }}>No skills selected yet. Click on the left list to select.</span>
                ) : (
                  skillsList.map(skill => (
                    <div key={skill} className="skill-tag" onClick={() => handleSkillToggle(skill)} title="Click to remove">
                      <span>{skill}</span>
                      <span>×</span>
                    </div>
                  ))
                )}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(You can select multiple skills)</span>
            </div>
          </div>
        </div>

        {/* SECTION 05: DOCUMENTS UPLOAD */}
        <div className="form-section-card">
          <div className="section-header">
            <span className="section-num">05</span>
            <h3 className="section-title">Documents Upload</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px' }}>Upload the required documents</span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {/* 12th Marksheet */}
            <div className="doc-upload-box">
              <span className="doc-title form-label-required">12th Marksheet</span>
              <FileText size={24} style={{ color: doc12th ? 'var(--color-success)' : 'var(--text-muted)' }} />
              <input type="file" accept=".pdf,image/*" id="doc12" style={{ display: 'none' }} onChange={e => setDoc12th(e.target.files[0])} />
              <label htmlFor="doc12" className="doc-upload-btn">
                <Upload size={12} />
                <span>{doc12th ? 'Uploaded' : 'Upload File'}</span>
              </label>
              {doc12th && <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{doc12th.name}</span>}
            </div>

            {/* Graduation Marksheet/Degree */}
            <div className="doc-upload-box">
              <span className="doc-title form-label-required">Graduation Degree</span>
              <FileText size={24} style={{ color: docGrad ? 'var(--color-success)' : 'var(--text-muted)' }} />
              <input type="file" accept=".pdf,image/*" id="docGrad" style={{ display: 'none' }} onChange={e => setDocGrad(e.target.files[0])} />
              <label htmlFor="docGrad" className="doc-upload-btn">
                <Upload size={12} />
                <span>{docGrad ? 'Uploaded' : 'Upload File'}</span>
              </label>
              {docGrad && <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{docGrad.name}</span>}
            </div>

            {/* Aadhaar Card */}
            <div className="doc-upload-box">
              <span className="doc-title form-label-required">Aadhaar Card</span>
              <FileText size={24} style={{ color: docAadhaar ? 'var(--color-success)' : 'var(--text-muted)' }} />
              <input type="file" accept=".pdf,image/*" id="docAadhaar" style={{ display: 'none' }} onChange={e => setDocAadhaar(e.target.files[0])} />
              <label htmlFor="docAadhaar" className="doc-upload-btn">
                <Upload size={12} />
                <span>{docAadhaar ? 'Uploaded' : 'Upload File'}</span>
              </label>
              {docAadhaar && <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{docAadhaar.name}</span>}
            </div>

            {/* PAN Card */}
            <div className="doc-upload-box">
              <span className="doc-title form-label-required">PAN Card</span>
              <FileText size={24} style={{ color: docPan ? 'var(--color-success)' : 'var(--text-muted)' }} />
              <input type="file" accept=".pdf,image/*" id="docPan" style={{ display: 'none' }} onChange={e => setDocPan(e.target.files[0])} />
              <label htmlFor="docPan" className="doc-upload-btn">
                <Upload size={12} />
                <span>{docPan ? 'Uploaded' : 'Upload File'}</span>
              </label>
              {docPan && <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{docPan.name}</span>}
            </div>

            {/* Resume / CV */}
            <div className="doc-upload-box">
              <span className="doc-title form-label-required">Resume / CV</span>
              <FileText size={24} style={{ color: docResume ? 'var(--color-success)' : 'var(--text-muted)' }} />
              <input type="file" accept=".pdf,.doc,.docx" id="docResume" style={{ display: 'none' }} onChange={e => setDocResume(e.target.files[0])} />
              <label htmlFor="docResume" className="doc-upload-btn">
                <Upload size={12} />
                <span>{docResume ? 'Uploaded' : 'Upload File'}</span>
              </label>
              {docResume && <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{docResume.name}</span>}
            </div>

            {/* Other Documents */}
            <div className="doc-upload-box">
              <span className="doc-title">Other Documents</span>
              <FileText size={24} style={{ color: docOther ? 'var(--color-success)' : 'var(--text-muted)' }} />
              <input type="file" id="docOther" style={{ display: 'none' }} onChange={e => setDocOther(e.target.files[0])} />
              <label htmlFor="docOther" className="doc-upload-btn">
                <Upload size={12} />
                <span>{docOther ? 'Uploaded' : 'Upload File'}</span>
              </label>
              {docOther && <span style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{docOther.name}</span>}
            </div>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>* Fields are required</span>
        </div>

        {/* SECTION 06: ADDITIONAL INFORMATION */}
        <div className="form-section-card">
          <div className="section-header">
            <span className="section-num">06</span>
            <h3 className="section-title">Additional Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Education Qualification</label>
              <input type="text" placeholder="Enter qualification" className="form-input" value={education} onChange={e => setEducation(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Experience (Years)</label>
              <input 
                type="number" 
                min="0" 
                placeholder="Enter experience" 
                className="form-input" 
                value={experience} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= 0) {
                    setExperience(val);
                  }
                }} 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Previous Company</label>
              <input type="text" placeholder="Enter previous company" className="form-input" value={previousCompany} onChange={e => setPreviousCompany(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea rows={4} placeholder="Enter any additional notes..." className="form-input" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px'
        }}>
          <button 
            type="button" 
            onClick={resetForm}
            className="smky-btn3"
          >
            <RefreshCw size={15} className="reset-icon" />
            <span>Reset</span>
          </button>
          
          <button 
            type="submit" 
            className="btn-gradient-glow"
            disabled={submitting || !isFormValid}
          >
            {submitting ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>

      {/* Glassy Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: 'rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(16px) saturate(120%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#ffffff',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            maxWidth: '320px'
          }}>
            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegisterEmployee;
