import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState('customer');
  const [formData, setFormData] = useState({
    accountNumber: '',
    employeeId: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 Login form submitted!');
    console.log('Login type:', loginType);
    console.log('Form data:', formData);
    
    setError('');
    setLoading(true);

    try {
      const loginData = {
        password: formData.password,
        ...(loginType === 'customer' 
          ? { accountNumber: formData.accountNumber }
          : { employeeId: formData.employeeId }
        )
      };

      console.log('📤 Sending login data:', loginData);

      const response = await authAPI.login(loginData);
      
      console.log('✅ Login successful:', response.data);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate based on role
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else if (response.data.user.role === 'employee') {
        navigate('/employee');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🏦 International Payments</h1>
        <p className="subtitle">Secure Payment Portal</p>

        {/* Login Type Selector */}
        <div className="login-type-selector">
          <button
            type="button"
            className={`type-btn ${loginType === 'customer' ? 'active' : ''}`}
            onClick={() => {
              setLoginType('customer');
              setFormData({ accountNumber: '', employeeId: '', password: '' });
              setError('');
            }}
          >
            👤 Customer
          </button>
          <button
            type="button"
            className={`type-btn ${loginType === 'employee' ? 'active' : ''}`}
            onClick={() => {
              setLoginType('employee');
              setFormData({ accountNumber: '', employeeId: '', password: '' });
              setError('');
            }}
          >
            💼 Employee
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {loginType === 'customer' ? (
            <div className="form-group">
              <label htmlFor="accountNumber">Account Number</label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Enter your account number"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP000001"
                required
              />
              <small>Format: EMP followed by digits (e.g., EMP000001)</small>
            </div>
          )}

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
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {loginType === 'customer' && (
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;