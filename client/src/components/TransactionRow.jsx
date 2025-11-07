import { useState } from 'react';

const TransactionRow = ({ transaction, onDelete, onVerify, userRole }) => {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('verified');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', icon: '', text: 'Pending' },
      verified: { class: 'badge-verified', icon: '', text: 'Verified' },
      completed: { class: 'badge-completed', icon: '', text: 'Completed' },
      rejected: { class: 'badge-rejected', icon: '', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const handleVerifySubmit = () => {
    onVerify(transaction._id, verifyStatus, notes);
    setShowVerifyModal(false);
    setNotes('');
  };

  return (
    <>
      <div className="transaction-row">
        <div className="transaction-main">
          <div className="transaction-header">
            <span className="transaction-id">#{transaction._id.slice(-8)}</span>
            {getStatusBadge(transaction.status)}
          </div>
          
          <div className="transaction-details">
            <div className="detail-item">
              <strong>Amount:</strong> {transaction.currency} {transaction.amount.toLocaleString()}
            </div>
            <div className="detail-item">
              <strong>Provider:</strong> {transaction.provider}
            </div>
            <div className="detail-item">
              <strong>Recipient:</strong> {transaction.recipientAccount}
            </div>
            {transaction.swiftCode && (
              <div className="detail-item">
                <strong>SWIFT:</strong> {transaction.swiftCode}
              </div>
            )}
            {userRole === 'employee' && transaction.customer && (
              <div className="detail-item">
                <strong>Customer:</strong> {transaction.customer.fullName} ({transaction.customer.email})
              </div>
            )}
            <div className="detail-item">
              <strong>Date:</strong> {formatDate(transaction.createdAt)}
            </div>
            {transaction.verifiedBy && (
              <div className="detail-item">
                <strong>Verified By:</strong> {transaction.verifiedBy.fullName} ({transaction.verifiedBy.employeeId})
              </div>
            )}
            {transaction.notes && (
              <div className="detail-item notes">
                <strong>Notes:</strong> {transaction.notes}
              </div>
            )}
          </div>
        </div>

        <div className="transaction-actions">
          {userRole === 'customer' && transaction.status === 'pending' && (
            <button 
              onClick={() => onDelete(transaction._id)}
              className="btn-danger btn-sm"
            >
              Delete
            </button>
          )}

          {userRole === 'employee' && transaction.status === 'pending' && (
            <button 
              onClick={() => setShowVerifyModal(true)}
              className="btn-primary btn-sm"
            >
              Process
            </button>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Process Transaction</h3>
            <p className="modal-subtitle">Transaction ID: #{transaction._id.slice(-8)}</p>

            <div className="form-group">
              <label>Action</label>
              <select 
                value={verifyStatus} 
                onChange={(e) => setVerifyStatus(e.target.value)}
                className="form-select"
              >
                <option value="verified"> Verify</option>
                <option value="completed"> Complete</option>
                <option value="rejected"> Reject</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
                rows="3"
                maxLength="500"
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleVerifySubmit} className="btn-primary">
                Confirm
              </button>
              <button onClick={() => setShowVerifyModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionRow;

//References:
//GeeksforGeeks. (2023). ReactJS – How to Create a Modal Component in ReactJS. [online] Available at: https://www.geeksforgeeks.org/reactjs-how-to-create-a-modal-component-in-reactjs/ [Accessed 1 Nov. 2025]
//DigitalOcean. (2022). How to Create a Modal in React. [online] Available at: https://www.digitalocean.com/community/tutorials/react-modal-component [Accessed 2 Nov. 2025]