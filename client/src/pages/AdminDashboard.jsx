import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: 'payments'
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // Check if user is admin
    if (!userData || userData.role !== 'admin') {
      navigate('/employee-login');
      return;
    }
    
    setUser(userData);
    fetchEmployees();
    fetchStats();
  }, [navigate]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getEmployees();
      setEmployees(response.data.employees);
    } catch (err) {
      setError('Failed to fetch employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;
    
    // Sanitize input
    let sanitized = value;
    if (name === 'employeeId') {
      sanitized = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    } else if (name === 'email') {
      sanitized = value.replace(/[^a-zA-Z0-9@._-]/g, '');
    } else if (name === 'fullName') {
      sanitized = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'password' || name === 'confirmPassword') {
      sanitized = value.replace(/[^a-zA-Z0-9@$!%*?&#]/g, '');
    }
    
    setFormData({ ...formData, [name]: sanitized });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }

    if (!/^EMP[0-9]{6}$/.test(formData.employeeId)) {
      setError('Employee ID must be format EMP######');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...employeeData } = formData;
      await adminAPI.createEmployee(employeeData);
      
      setSuccess('Employee created successfully!');
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        employeeId: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        department: 'payments'
      });
      
      fetchEmployees();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete ${employeeName}?`)) return;

    try {
      await adminAPI.deleteEmployee(id);
      setSuccess('Employee deleted successfully');
      fetchEmployees();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/employee-login');
  };

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔐 Admin Portal</h1>
          <div className="user-info">
            <span><strong>{user?.fullName}</strong> (Admin)</span>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalEmployees}</h3>
                <p>Total Employees</p>
              </div>
            </div>
            <div className="stat-card verified">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.activeEmployees}</h3>
                <p>Active</p>
              </div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-icon">⏸️</div>
              <div className="stat-info">
                <h3>{stats.inactiveEmployees}</h3>
                <p>Inactive</p>
              </div>
            </div>
            <div className="stat-card amount">
              <div className="stat-icon">🔐</div>
              <div className="stat-info">
                <h3>{stats.adminCount}</h3>
                <p>Administrators</p>
              </div>
            </div>
          </div>
        )}

        <div className="action-bar">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            ➕ Create New Employee
          </button>
        </div>

        <section className="card">
          <h2>👥 Employee Management ({employees.length})</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {loading && !showCreateModal ? (
            <p className="loading-state">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="empty-state">No employees found.</p>
          ) : (
            <div className="employees-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id}>
                      <td>{employee.fullName}</td>
                      <td>{employee.employeeId}</td>
                      <td>{employee.email}</td>
                      <td>
                        <span className={`badge ${employee.role === 'admin' ? 'badge-admin' : 'badge-employee'}`}>
                          {employee.role === 'admin' ? '🔐 Admin' : '👤 Employee'}
                        </span>
                      </td>
                      <td>{employee.department}</td>
                      <td>
                        <span className={`badge ${employee.isActive ? 'badge-verified' : 'badge-rejected'}`}>
                          {employee.isActive ? '✅ Active' : '⏸️ Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(employee._id, employee.fullName)}
                          className="btn-danger btn-sm"
                          disabled={employee._id === user?._id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Employee</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP123456"
                  required
                  pattern="EMP[0-9]{6}"
                  maxLength={9}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select name="department" value={formData.department} onChange={handleChange}>
                    <option value="payments">Payments</option>
                    <option value="verification">Verification</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <small>Min 8 chars, uppercase, lowercase, number & special char</small>
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;