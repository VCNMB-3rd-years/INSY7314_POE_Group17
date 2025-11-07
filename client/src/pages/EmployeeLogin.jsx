import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    password: ''
  });

  const handleChange = (e) => {
    const value = e.target.value;
    const name = e.target.name;
    
    // Sanitize input - whitelist alphanumeric and special chars
    let sanitized = value;
    if (name === 'employeeId') {
      sanitized = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    } else if (name === 'password') {
      sanitized = value.replace(/[^a-zA-Z0-9@$!%*?&#]/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: sanitized
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 Employee login attempt');
    
    setError('');
    setLoading(true);

    // Validate employee ID format
    if (!/^EMP[0-9]{6}$/.test(formData.employeeId)) {
      setError('Invalid employee ID format. Must be EMP followed by 6 digits.');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login({
        employeeId: formData.employeeId,
        password: formData.password
      });
      
      console.log('✅ Login successful:', response.data);
      
      // Check if user is employee or admin
      if (response.data.user.role !== 'employee' && response.data.user.role !== 'admin') {
        setError('Invalid credentials for employee portal.');
        setLoading(false);
        return;
      }
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate based on role
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>💼 Employee Portal</h1>
        <p className="subtitle">Employee & Admin Access</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              type="text"
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="EMP######"
              required
              pattern="EMP[0-9]{6}"
              maxLength={9}
              autoComplete="username"
            />
            <small>Format: EMP followed by 6 digits</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength={8}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="security-notice">
            ⚠️ This portal is for authorized employees and administrators only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;