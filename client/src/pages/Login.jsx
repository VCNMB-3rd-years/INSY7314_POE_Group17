import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa6";
import { FaUserLock } from "react-icons/fa6";

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
    console.log('Login form submitted!');
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

      console.log('Sending login data:', loginData);

      const response = await authAPI.login(loginData);
      
      console.log('Login successful:', response.data);
      
      // Store ONLY user data (NO TOKEN - using sessions/cookies now)
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('🔀 Navigating to:', response.data.user.role === 'employee' ? '/employee' : '/customer');

      // Navigate based on role
      if (response.data.user.role === 'employee') {
        navigate('/employee', { replace: true });
      } else {
        navigate('/customer', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1><FaMoneyBillTransfer /></h1>
        <h1>Secure and Easy International Payments</h1>
        <p className="subtitle">Securely send and manage your international payments.</p>

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
            <FaRegUser /> Customer
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
            <FaUserLock /> Employee
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
                placeholder="EMP######"
                required
                pattern="EMP[0-9]{6}"
              />
              <small>Format: EMP followed by 6 digits</small>
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