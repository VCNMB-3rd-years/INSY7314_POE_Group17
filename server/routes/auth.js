const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const validateInput = require('../middleware/validateInput');
const { passwordRegex, emailRegex, idNumberRegex } = require('../utils/regexPatterns');
const { encryptField } = require('../utils/cryptoField');
const { regenerateSession } = require('../middleware/sessionAuth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new customer
// @access  Public
router.post('/register', [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('idNumber').matches(idNumberRegex).withMessage('Invalid ID number format (must be 13 digits)'),
  body('accountNumber').isLength({ min: 10, max: 20 }).withMessage('Account number must be 10-20 characters'),
  body('email').matches(emailRegex).withMessage('Invalid email format'),
  body('password').matches(passwordRegex).withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
], validateInput, async (req, res) => {
  try {
    console.log('📝 Registration attempt:', {
      fullName: req.body.fullName,
      email: req.body.email,
      accountNumber: req.body.accountNumber
    });

    const { fullName, idNumber, accountNumber, email, password } = req.body;

    const encryptedAccountNumber = encryptField(accountNumber);

    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { accountNumber: encryptedAccountNumber }
      ] 
    });

    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({ error: 'User already exists with this email or account number' });
    }

    const user = await User.create({
      fullName,
      idNumber,
      accountNumber,
      email: email.toLowerCase(),
      password
    });

    console.log('✅ User created successfully:', user._id);

    // CREATE SESSION (replaces JWT)
    req.session.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    req.session.lastActivity = Date.now();
    req.session.createdAt = Date.now();

    console.log('🔐 Session created for user');

    res.status(201).json({
      message: 'Registration successful',
      user: user.getDecryptedData()
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user or employee
// @access  Public
router.post('/login', [
  body('accountNumber').optional().isLength({ min: 5 }).withMessage('Invalid account number'),
  body('employeeId').optional().matches(/^EMP[0-9]{6}$/).withMessage('Invalid employee ID format'),
  body('password').notEmpty().withMessage('Password is required')
], validateInput, async (req, res) => {
  try {
    console.log('🔐 Login attempt:', {
      accountNumber: req.body.accountNumber,
      employeeId: req.body.employeeId,
      hasPassword: !!req.body.password
    });

    const { accountNumber, employeeId, password } = req.body;

    let user;
    let role;

    if (employeeId) {
      console.log('👔 Employee login attempt');
      user = await Employee.findOne({ employeeId, isActive: true }).select('+password');
      role = 'employee';
    } 
    else if (accountNumber) {
      console.log('👤 Customer login attempt');
      const encryptedAccountNumber = encryptField(accountNumber);
      user = await User.findOne({ accountNumber: encryptedAccountNumber, isActive: true }).select('+password');
      role = 'customer';
    } else {
      return res.status(400).json({ error: 'Please provide account number or employee ID' });
    }

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful');

    // SESSION REGENERATION - Prevents session fixation attacks
    await regenerateSession(req);

    // CREATE SESSION (replaces JWT)
    if (role === 'customer') {
      req.session.user = {
        _id: user._id,
        fullName: user.fullName,
        accountNumber: accountNumber, // Store plain for session
        email: user.email,
        role: role
      };
    } else {
      req.session.user = {
        _id: user._id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        role: role,
        department: user.department
      };
    }

    req.session.lastActivity = Date.now();
    req.session.createdAt = Date.now();

    console.log('🔐 Session created and regenerated');

    // Prepare user data
    let userData;
    if (role === 'customer') {
      userData = user.getDecryptedData();
    } else {
      userData = {
        _id: user._id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        department: user.department
      };
    }

    res.json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('sessionId');
      console.log('👋 User logged out, session destroyed');
      res.json({ message: 'Logged out successfully' });
    });
  } else {
    res.json({ message: 'No active session' });
  }
});

// @route   GET /api/auth/session
// @desc    Check session status
// @access  Public
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    const sessionAge = Date.now() - (req.session.createdAt || 0);
    const timeLeft = (30 * 60 * 1000) - sessionAge; // 30 minutes

    res.json({
      authenticated: true,
      user: req.session.user,
      sessionAge: Math.floor(sessionAge / 1000), // in seconds
      timeLeft: Math.floor(timeLeft / 1000) // in seconds
    });
  } else {
    res.json({ authenticated: false });
  }
});

// @route   POST /api/auth/register-employee
// @desc    Register new employee
// @access  Public (should be protected in production)
router.post('/register-employee', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name required'),
  body('employeeId').matches(/^EMP[0-9]{6}$/).withMessage('Employee ID must be format EMP######'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').matches(passwordRegex).withMessage('Strong password required'),
  body('department').isIn(['payments', 'verification', 'admin']).withMessage('Invalid department')
], validateInput, async (req, res) => {
  try {
    const { fullName, employeeId, email, password, department } = req.body;

    const existing = await Employee.findOne({ $or: [{ email: email.toLowerCase() }, { employeeId }] });
    if (existing) {
      return res.status(400).json({ error: 'Employee already exists' });
    }

    const employee = await Employee.create({
      fullName,
      employeeId,
      email: email.toLowerCase(),
      password,
      department
    });

    res.status(201).json({
      message: 'Employee registered successfully',
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        employeeId: employee.employeeId,
        email: employee.email,
        department: employee.department
      }
    });
  } catch (error) {
    console.error('❌ Employee registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

module.exports = router;