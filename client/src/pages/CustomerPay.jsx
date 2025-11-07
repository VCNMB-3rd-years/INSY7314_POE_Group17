import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import TransactionRow from '../components/TransactionRow';

const CustomerPay = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    provider: 'SWIFT',
    recipientAccount: '',
    swiftCode: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await customerAPI.getTransactions();
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.provider === 'SWIFT' && !formData.swiftCode) {
      setError('SWIFT code is required for SWIFT transactions');
      setLoading(false);
      return;
    }

    try {
      // Only include swiftCode if provider is SWIFT
      const paymentData = {
        amount: formData.amount,
        currency: formData.currency,
        provider: formData.provider,
        recipientAccount: formData.recipientAccount
      };

      // Only add swiftCode if provider is SWIFT and swiftCode exists
      if (formData.provider === 'SWIFT' && formData.swiftCode) {
        paymentData.swiftCode = formData.swiftCode;
      }

      await customerAPI.createPayment(paymentData);
      setSuccess('Payment submitted successfully!');
      
      setFormData({
        amount: '',
        currency: 'USD',
        provider: 'SWIFT',
        recipientAccount: '',
        swiftCode: ''
      });

      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await customerAPI.deleteTransaction(id);
      setSuccess('Transaction deleted successfully');
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏦 Customer Payment Portal</h1>
          <div className="user-info">
            <span>Welcome, <strong>{user?.fullName}</strong></span>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="card">
          <h2>💸 Make a Payment</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="1000"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Currency *</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="provider">Payment Provider *</label>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  required
                >
                  <option value="SWIFT">SWIFT</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Western Union">Western Union</option>
                  <option value="MoneyGram">MoneyGram</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recipientAccount">Recipient Account *</label>
                <input
                  type="text"
                  id="recipientAccount"
                  name="recipientAccount"
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                  minLength={5}
                />
              </div>
            </div>

            {formData.provider === 'SWIFT' && (
              <div className="form-group">
                <label htmlFor="swiftCode">SWIFT Code *</label>
                <input
                  type="text"
                  id="swiftCode"
                  name="swiftCode"
                  value={formData.swiftCode}
                  onChange={handleChange}
                  placeholder="ABCDUS33XXX"
                  pattern="[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?"
                  maxLength={11}
                  required={formData.provider === 'SWIFT'}
                />
                <small>Format: 6 letters (bank) + 2 letters (country) + 2 digits + optional 3 chars</small>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Submit Payment'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>📋 Your Transactions</h2>
          {transactions.length === 0 ? (
            <p className="empty-state">No transactions yet. Make your first payment above!</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                  onDelete={handleDelete}
                  userRole="customer"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerPay;