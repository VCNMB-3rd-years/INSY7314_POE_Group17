import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../api';
import TransactionRow from '../components/TransactionRow';

const EmployeePortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchTransactions();
    fetchStats();
  }, []);

  const fetchTransactions = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await employeeAPI.getTransactions(filterParams);
      setTransactions(response.data.transactions);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await employeeAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    const activeFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        activeFilters[key] = filters[key];
      }
    });
    fetchTransactions(activeFilters);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
    fetchTransactions();
  };

  const handleVerify = async (id, status, notes = '') => {
    try {
      await employeeAPI.verifyTransaction(id, { status, notes });
      setSuccess(`Transaction ${status} successfully`);
      fetchTransactions();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard employee-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>💼 Employee Portal</h1>
          <div className="user-info">
            <span>
              <strong>{user?.fullName}</strong> ({user?.employeeId})
            </span>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats.totalTransactions}</h3>
                <p>Total Transactions</p>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card verified">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.verified}</h3>
                <p>Verified</p>
              </div>
            </div>
            <div className="stat-card completed">
              <div className="stat-icon">✔️</div>
              <div className="stat-info">
                <h3>{stats.completed}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats.rejected}</h3>
                <p>Rejected</p>
              </div>
            </div>
            <div className="stat-card amount">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>${stats.totalAmountProcessed.toLocaleString()}</h3>
                <p>Total Processed</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="card filters-card">
          <h2>🔍 Filter Transactions</h2>
          <div className="filters-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minAmount">Min Amount</label>
                <input
                  type="number"
                  id="minAmount"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxAmount">Max Amount</label>
                <input
                  type="number"
                  id="maxAmount"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  placeholder="10000"
                  min="0"
                />
              </div>

              <div className="filter-actions">
                <button onClick={applyFilters} className="btn-primary">
                  Apply Filters
                </button>
                <button onClick={clearFilters} className="btn-secondary">
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Transactions List */}
        <section className="card">
          <h2>📋 All Transactions ({transactions.length})</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {loading ? (
            <p className="loading-state">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="empty-state">No transactions found</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                  onVerify={handleVerify}
                  userRole="employee"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EmployeePortal;