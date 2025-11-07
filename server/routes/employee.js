const express = require('express');
const { body } = require('express-validator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const validateInput = require('../middleware/validateInput');

const router = express.Router();

// All routes require employee authentication
router.use(authMiddleware);

// Check if user is employee or admin
const employeeOnly = (req, res, next) => {
  
  if (req.user.role !== 'employee' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Employee only.' });
  }
  next();
};

router.use(employeeOnly);

// @route   GET /api/employee/transactions
// @desc    Get all transactions with filters
// @access  Private (Employee)
router.get('/transactions', async (req, res) => {
  try {
    const { status, startDate, endDate, minAmount, maxAmount } = req.query;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const transactions = await Transaction.find(filter)
      .populate('userId', 'fullName email')
      .populate('verifiedBy', 'fullName employeeId')
      .sort({ createdAt: -1 });

    const decryptedTransactions = transactions.map(t => ({
      ...t.getDecryptedData(),
      customer: t.userId
    }));

    res.json({
      count: transactions.length,
      transactions: decryptedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// @route   PUT /api/employee/verify/:id
// @desc    Verify/approve a transaction
// @access  Private (Employee)
router.put('/verify/:id', [
  body('status').isIn(['verified', 'completed', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long')
], validateInput, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    transaction.status = status;
    transaction.verifiedBy = req.user.id;
    transaction.verifiedAt = new Date();
    if (notes) transaction.notes = notes;

    await transaction.save();

    res.json({
      message: 'Transaction updated successfully',
      transaction: transaction.getDecryptedData()
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// @route   GET /api/employee/stats
// @desc    Get payment statistics
// @access  Private (Employee)
router.get('/stats', async (req, res) => {
  try {
    const [totalTransactions, pendingCount, verifiedCount, completedCount, rejectedCount, totalAmount] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ status: 'verified' }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.countDocuments({ status: 'rejected' }),
      Transaction.aggregate([
        { $match: { status: { $in: ['verified', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalTransactions,
      pending: pendingCount,
      verified: verifiedCount,
      completed: completedCount,
      rejected: rejectedCount,
      totalAmountProcessed: totalAmount[0]?.total || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;