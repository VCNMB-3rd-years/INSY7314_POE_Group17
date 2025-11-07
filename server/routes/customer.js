const express = require('express');
const { body } = require('express-validator');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const validateInput = require('../middleware/validateInput');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/customer/transactions
// @desc    Get logged-in customer's transactions
// @access  Private (Customer)
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('verifiedBy', 'fullName employeeId');

    const decryptedTransactions = transactions.map(t => t.getDecryptedData());

    res.json({
      count: transactions.length,
      transactions: decryptedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// @route   POST /api/customer/pay
// @desc    Create new payment transaction
// @access  Private (Customer)
router.post('/pay', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'ZAR', 'JPY']).withMessage('Invalid currency'),
  body('provider').isIn(['SWIFT', 'PayPal', 'Western Union', 'MoneyGram']).withMessage('Invalid payment provider'),
  body('recipientAccount').isLength({ min: 5 }).withMessage('Recipient account required'),
  body('swiftCode').optional().matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/).withMessage('Invalid SWIFT code format')
], validateInput, async (req, res) => {
  try {
    const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

    // Validate SWIFT code if provider is SWIFT
    if (provider === 'SWIFT' && !swiftCode) {
      return res.status(400).json({ error: 'SWIFT code required for SWIFT transactions' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      amount,
      currency,
      provider,
      recipientAccount,
      swiftCode: swiftCode || undefined
    });

    res.status(201).json({
      message: 'Payment submitted successfully',
      transaction: transaction.getDecryptedData()
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment submission failed', details: error.message });
  }
});

// @route   PUT /api/customer/transaction/:id
// @desc    Update pending transaction
// @access  Private (Customer)
router.put('/transaction/:id', [
  body('amount').optional().isFloat({ min: 1 }),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'ZAR', 'JPY']),
  body('recipientAccount').optional().isLength({ min: 5 })
], validateInput, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found or cannot be modified' });
    }

    // Update allowed fields
    const allowedUpdates = ['amount', 'currency', 'recipientAccount', 'swiftCode'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        transaction[field] = req.body[field];
      }
    });

    await transaction.save();

    res.json({
      message: 'Transaction updated successfully',
      transaction: transaction.getDecryptedData()
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// @route   DELETE /api/customer/transaction/:id
// @desc    Delete pending transaction
// @access  Private (Customer)
router.delete('/transaction/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found or cannot be deleted' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;