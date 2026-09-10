import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showGlassToast } from '../components/GlassToast';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye,
  X,
  Sparkles,
  Download
} from 'lucide-react';

const Employees = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [designation, setDesignation] = useState('Developer');
  const [experience, setExperience] = useState('3');
  const [salary, setSalary] = useState('75000');
  const [modalError, setModalError] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [documentsFile, setDocumentsFile] = useState([]);
  const [address, setAddress] = useState('');
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarPositionX, setAvatarPositionX] = useState(50);
  const [avatarPositionY, setAvatarPositionY] = useState(50);
  const [isAvatarConfirmed, setIsAvatarConfirmed] = useState(false);
  const [isAdjustingAvatar, setIsAdjustingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Skills multi-select tagging state
  const [skillsList, setSkillsList] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  // Fallback high-fidelity seed data if API database is blank
  const seedEmployees = [
    { _id: 'emp1', fullname: 'Rohit Kumar', employeeId: 'EMP001', designation: 'Senior Developer', departmentName: 'Engineering', role: 'Employee', salary: 85000, status: 'Active' },
    { _id: 'emp2', fullname: 'Priya Singh', employeeId: 'EMP002', designation: 'Marketing Manager', departmentName: 'Marketing', role: 'Manager', salary: 75000, status: 'Active' },
    { _id: 'emp3', fullname: 'Amit Verma', employeeId: 'EMP003', designation: 'Sales Executive', role: 'Employee', departmentName: 'Sales', salary: 45000, status: 'Active' },
    { _id: 'emp4', fullname: 'Neha Sharma', employeeId: 'EMP004', designation: 'HR Specialist', departmentName: 'HR', role: 'HR', salary: 60000, status: 'Active' },
    { _id: 'emp5', fullname: 'Vikas Mehta', employeeId: 'EMP005', designation: 'Accountant', role: 'Accountant', departmentName: 'Finance', salary: 55000, status: 'Inactive' },
    { _id: 'emp6', fullname: 'Sneha Patel', employeeId: 'EMP006', designation: 'UI/UX Designer', departmentName: 'Design', role: 'Employee', salary: 50000, status: 'Active' },
    { _id: 'emp7', fullname: 'Arjun Nair', employeeId: 'EMP007', designation: 'DevOps Engineer', departmentName: 'Engineering', role: 'Employee', salary: 80000, status: 'Active' },
  ];

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      // Backend paginates or returns list
      const rawData = response.data?.data?.employees || response.data?.data || [];
      const data = Array.isArray(rawData) ? rawData : [];
      if (data.length > 0) {
        setEmployees(data);
      } else {
        setEmployees(seedEmployees);
      }
    } catch (error) {
      console.error('Failed to fetch employees from backend, loading mock data:', error);
      setEmployees(seedEmployees);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setModalError('');

    try {
      // Size limits & layout validations
      if (avatar) {
        const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
        if (avatar.size > MAX_AVATAR_SIZE) {
          throw new Error('Profile picture size exceeds the maximum limit of 2MB.');
        }
        if (!isAvatarConfirmed) {
          throw new Error('Please adjust and click "Confirm Layout" on your profile picture before submitting.');
        }
      }

      if (documentsFile && documentsFile.length > 0) {
        const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
        for (const file of documentsFile) {
          if (file.size > MAX_DOC_SIZE) {
            throw new Error(`Document "${file.name}" is too large. Maximum allowed size is 5MB.`);
          }
        }
      }

      // 1. Register Auth User first using FormData
      const authFormData = new FormData();
      authFormData.append('fullname', fullname);
      authFormData.append('username', username);
      authFormData.append('email', email);
      authFormData.append('password', password);
      authFormData.append('role', role);
      authFormData.append('address', address);
      authFormData.append('avatarScale', avatarScale);
      authFormData.append('avatarPositionX', avatarPositionX);
      authFormData.append('avatarPositionY', avatarPositionY);
      if (avatar) {
        authFormData.append('avatar', avatar);
      }
      if (documentsFile && documentsFile.length > 0) {
        for (let i = 0; i < documentsFile.length; i++) {
          authFormData.append('documents', documentsFile[i]);
        }
      }

      const registerRes = await api.post('/auth/register', authFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const createdUser = registerRes.data?.data?.user || registerRes.data?.data;
      
      if (!createdUser?._id) {
        throw new Error('Could not register account user');
      }

      // 2. Create corresponding Employee profile
      // Pass the uploaded avatar, documents and address returned by the backend
      const empRes = await api.post('/employees', {
        user: createdUser._id,
        designation,
        experience: Number(experience),
        salaryBand: 'B2', // dummy band
        salary: Number(salary),
        skills: skillsList,
        status: 'Active',
        avatar: createdUser.avatar || '',
        documents: createdUser.documents || [],
        address: createdUser.address || '',
        avatarScale: createdUser.avatarScale || 1,
        avatarPositionX: createdUser.avatarPositionX || 50,
        avatarPositionY: createdUser.avatarPositionY || 50,
      });

      // Fetch fresh list
      fetchEmployees();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      // Simulate locally if backend returns error
      const localNewEmp = {
        _id: 'emp_local_' + Math.random(),
        fullname,
        employeeId: 'EMP00' + (employees.length + 1),
        designation,
        departmentName: role === 'HR' ? 'HR' : 'Engineering',
        role,
        salary: Number(salary),
        skills: skillsList,
        status: 'Active',
        avatar: avatar ? URL.createObjectURL(avatar) : '',
        address,
      };
      setEmployees(prev => [localNewEmp, ...prev]);
      setIsModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFullname('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Employee');
    setDesignation('Developer');
    setExperience('3');
    setSalary('75000');
    setAvatar(null);
    setDocumentsFile([]);
    setAddress('');
    setAvatarScale(1);
    setAvatarPositionX(50);
    setAvatarPositionY(50);
    setIsAvatarConfirmed(false);
    setIsAdjustingAvatar(false);
    setSkillsList([]);
    setSkillInput('');
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

  const removeDocumentFile = (index) => {
    setDocumentsFile(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Stop navigation to profile page
    const empToDelete = employees.find(emp => emp._id === id);
    const empName = empToDelete?.fullname || 'Employee';
    if (!window.confirm(`Are you sure you want to terminate ${empName}?`)) return;

    try {
      await api.delete(`/employees/${id}`);
      showGlassToast.success('Employee Terminated', `${empName}'s record was successfully terminated.`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      // Delete locally
      setEmployees(prev => prev.filter(emp => emp._id !== id));
      showGlassToast.info('Local Record Updated', `${empName} removed in offline mode.`);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      (emp.fullname || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(search.toLowerCase());

    const matchesDept = !deptFilter || (emp.departmentName || '').toLowerCase() === deptFilter.toLowerCase();
    const matchesRole = !roleFilter || (emp.role || '').toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = !statusFilter || (emp.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  return (
    <div className="content-pane">
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Employee Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Manage staff profiles, departmental assignments, roles, and records.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasRole(['Super Admin', 'Admin', 'HR']) && (
            <button className="btn btn-primary" onClick={() => navigate('/employees/register')}>
              <Plus size={16} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search employee, ID, designation..." 
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px' }}
          />
        </div>

        {/* Dept filter */}
        <select 
          className="form-input" 
          value={deptFilter} 
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ width: '160px', height: '38px' }}
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Design">Design</option>
        </select>

        {/* Role filter */}
        <select 
          className="form-input" 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ width: '160px', height: '38px' }}
        >
          <option value="">All Roles</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="HR">HR</option>
          <option value="Accountant">Accountant</option>
          <option value="Employee">Employee</option>
        </select>

        {/* Status filter */}
        <select 
          className="form-input" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '130px', height: '38px' }}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Employees Table Grid */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation / Role</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading employee database...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No employees matching the filter criteria found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr 
                    key={emp._id} 
                    onClick={() => navigate(`/employees/${emp._id}`)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    className="table-row-hover"
                  >
                    <td style={{ fontWeight: 600 }}>{emp.fullname || emp.user?.fullname}</td>
                    <td>{emp.employeeId || 'N/A'}</td>
                    <td>{emp.departmentName || emp.department?.name || 'Engineering'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 550 }}>{emp.designation}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{emp.role || emp.user?.role}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{(emp.salary || 65000).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${
                        emp.status === 'Active' ? 'badge-success' : 
                        emp.status === 'Inactive' ? 'badge-danger' : 
                        emp.status === 'On Leave' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '6px' }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp._id}`); }}
                        >
                          <Eye size={14} />
                        </button>
                        {hasRole(['Super Admin', 'Admin', 'HR']) && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', borderRadius: '6px', color: 'var(--color-danger)' }}
                            onClick={(e) => handleDelete(emp._id, e)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} className="text-warning" style={{ color: 'var(--color-warning)' }} />
                Add New Staff Profile
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {modalError && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '13px' }}>
                    {modalError}
                  </div>
                )}
                
                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" required className="form-input" placeholder="Rohit Kumar" value={fullname} onChange={e => setFullname(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" required className="form-input" placeholder="rohit_kumar" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" required className="form-input" placeholder="rohit@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" required className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Role</label>
                    <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                      <option>Employee</option>
                      <option>Manager</option>
                      <option>HR</option>
                      <option>Accountant</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input type="text" required className="form-input" placeholder="Senior Developer" value={designation} onChange={e => setDesignation(e.target.value)} />
                  </div>
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Experience (Years)</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="form-input" 
                      placeholder="5" 
                      value={experience} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || parseInt(val) >= 0) {
                          setExperience(val);
                        }
                      }} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Monthly Salary (INR)</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="form-input" 
                      placeholder="75000" 
                      value={salary} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || parseInt(val) >= 0) {
                          setSalary(val);
                        }
                      }} 
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Profile Image (Avatar)</label>
                    {avatar && isAvatarConfirmed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', padding: '10px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '1.5px solid var(--color-success)',
                          flexShrink: 0
                        }}>
                          <img 
                            src={URL.createObjectURL(avatar)} 
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>✓ Layout Confirmed</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Zoom: {avatarScale}x • Offset: {avatarPositionX}%, {avatarPositionY}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                            onClick={() => setIsAdjustingAvatar(true)}
                          >
                            Adjust
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '11px', height: '28px', color: 'var(--color-danger)' }}
                            onClick={() => {
                              setAvatar(null);
                              setIsAvatarConfirmed(false);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="form-input" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setAvatar(e.target.files[0]);
                            setAvatarScale(1);
                            setAvatarPositionX(50);
                            setAvatarPositionY(50);
                            setIsAvatarConfirmed(false);
                            setIsAdjustingAvatar(true);
                          }
                        }} 
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label>Required Files (Documents)</label>
                    <input 
                      type="file" 
                      multiple 
                      ref={fileInputRef}
                      style={{ display: 'none' }} 
                      onChange={e => setDocumentsFile(prev => [...prev, ...Array.from(e.target.files)])} 
                    />
                    {documentsFile.length === 0 ? (
                      <button 
                        type="button" 
                        className="btn btn-secondary w-full"
                        style={{ height: '40px' }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        Choose Documents
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn btn-secondary w-full"
                        style={{ height: '40px', borderStyle: 'dashed', borderColor: 'var(--color-primary-light)' }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        + Add More Documents
                      </button>
                    )}
                    {documentsFile.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {documentsFile.map((file, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 12px',
                            backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--input-border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            color: 'var(--text-main)'
                          }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                              {file.name}
                            </span>
                            <button 
                              type="button"
                              onClick={() => removeDocumentFile(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-danger)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Residential Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="123 Street Name, New Delhi, India" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                  />
                </div>

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <label>Professional Skills (Select Multiple)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type skill (e.g. React, MERN, HR Management) and press Enter" 
                      value={skillInput} 
                      onChange={e => setSkillInput(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = skillInput.trim();
                          if (val && !skillsList.includes(val)) {
                            setSkillsList([...skillsList, val]);
                          }
                          setSkillInput('');
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        const val = skillInput.trim();
                        if (val && !skillsList.includes(val)) {
                          setSkillsList([...skillsList, val]);
                        }
                        setSkillInput('');
                      }}
                      style={{ padding: '0 16px', height: '40px' }}
                    >
                      Add
                    </button>
                  </div>
                  
                  {skillsList.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {skillsList.map((skill, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          backgroundColor: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--color-primary-light)',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          <span>{skill}</span>
                          <button 
                            type="button"
                            onClick={() => setSkillsList(skillsList.filter((_, i) => i !== idx))}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--color-primary-light)',
                              padding: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              marginLeft: '2px'
                             }}
                           >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Image Adjustment Overlay Form */}
      {isAdjustingAvatar && avatar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Adjust Profile Picture</h3>
              <button 
                type="button" 
                onClick={() => {
                  setIsAdjustingAvatar(false);
                  if (!isAvatarConfirmed) setAvatar(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Click and drag the image inside the frame to adjust its position. Use the slider below to zoom in or out.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div 
                onMouseDown={handleMouseDown}
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid var(--color-primary)',
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'move',
                  position: 'relative',
                  backgroundColor: '#000'
                }}
                title="Drag to position"
              >
                <img 
                  src={URL.createObjectURL(avatar)} 
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 500 }}>
                <span>Zoom Level</span>
                <span>{avatarScale}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                value={avatarScale} 
                onChange={e => setAvatarScale(Number(e.target.value))}
                style={{ accentColor: 'var(--color-primary)', cursor: 'pointer', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button 
                type="button" 
                className="btn btn-secondary flex-1"
                style={{ height: '36px' }}
                onClick={() => {
                  setIsAdjustingAvatar(false);
                  setAvatar(null);
                  setIsAvatarConfirmed(false);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary flex-1"
                style={{ height: '36px', backgroundColor: 'var(--color-primary)' }}
                onClick={() => {
                  setIsAvatarConfirmed(true);
                  setIsAdjustingAvatar(false);
                }}
              >
                Confirm Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
