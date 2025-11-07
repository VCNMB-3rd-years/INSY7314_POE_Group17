const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const validateInput = require('../middleware/validateInput');
const { passwordRegex, emailRegex, idNumberRegex } = require('../utils/regexPatterns');
const { encryptField } = require('../utils/cryptoField');

const router = express.Router();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// ⚠️ BOOTSTRAP ROUTE - REMOVE AFTER CREATING FIRST ADMIN!
// @route   POST /api/auth/bootstrap-admin
// @desc    Create first admin account (ONE-TIME USE ONLY)
// @access  Public (REMOVE THIS ROUTE AFTER FIRST ADMIN IS CREATED!)
router.post('/bootstrap-admin', async (req, res) => {
  try {
    console.log('🔧 Bootstrap admin attempt...');
    
    // Check if any admin exists
    const existingAdmin = await Employee.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists');
      return res.status(400).json({ 
        error: 'Admin already exists! This endpoint should be removed.',
        existingAdmin: {
          email: existingAdmin.email,
          employeeId: existingAdmin.employeeId,
          fullName: existingAdmin.fullName
        }
      });
    }

    // Create first admin
    const admin = await Employee.create({
      fullName: 'System Administrator',
      employeeId: 'EMP000001',
      email: 'admin@company.com',
      password: 'Admin@123456',
      role: 'admin',
      department: 'admin',
      isActive: true
    });

    console.log('✅ Bootstrap admin created:', admin.employeeId);
    
    res.json({ 
      success: true,
      message: '✅ First admin created successfully!',
      admin: {
        _id: admin._id,
        email: admin.email,
        employeeId: admin.employeeId,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department
      },
      credentials: {
        employeeId: admin.employeeId,
        password: 'Admin@123456'
      },
      loginInstructions: 'Use employeeId (not accountNumber) to login',
      warning: '⚠️ CRITICAL: Remove this endpoint immediately and change the password!'
    });
  } catch (error) {
    console.error('❌ Bootstrap error:', error);
    res.status(500).json({ 
      error: 'Failed to create admin',
      details: error.message 
    });
  }
});

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

    // Encrypt account number to check for existing user
    const encryptedAccountNumber = encryptField(accountNumber);
    console.log('🔐 Encrypted account number for lookup');

    // Check if user exists
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

    console.log('✅ Creating new user...');

    // Create user
    const user = await User.create({
      fullName,
      idNumber,
      accountNumber,
      email: email.toLowerCase(),
      password
    });

    console.log('✅ User created successfully:', user._id);

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'Registration successful',
      token,
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
  body('employeeId').optional().isString().withMessage('Invalid employee ID format'),
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

    // Check if employee login
    if (employeeId) {
      console.log('👔 Employee login attempt');
      user = await Employee.findOne({ employeeId, isActive: true }).select('+password');
      
      if (!user) {
        console.log('❌ Employee not found in database');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } 
    // Customer login
    else if (accountNumber) {
      console.log('👤 Customer login attempt');
      // Encrypt the account number to search in database
      const encryptedAccountNumber = encryptField(accountNumber);
      console.log('🔐 Searching for user with encrypted account number');
      
      user = await User.findOne({ accountNumber: encryptedAccountNumber, isActive: true }).select('+password');
      console.log('👤 User found:', user ? 'YES' : 'NO');
      
      if (!user) {
        console.log('❌ User not found in database');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      console.log('❌ No credentials provided');
      return res.status(400).json({ error: 'Please provide account number or employee ID' });
    }

    console.log('✅ User found, checking password...');

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isMatch ? 'YES' : 'NO');
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for role:', user.role);

    // Generate token with the ACTUAL role from the database
    const token = generateToken(user._id, user.role);

    // Prepare user data
    let userData;
    if (user.role === 'customer') {
      userData = user.getDecryptedData();
    } else {
      // For employees and admins
      userData = {
        _id: user._id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,  // This will be 'employee' or 'admin'
        department: user.department
      };
    }

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// @route   POST /api/auth/register-employee
// @desc    Register new employee (for demo purposes - should be protected in production)
// @access  Public
router.post('/register-employee', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name required'),
  body('employeeId').matches(/^EMP[0-9]{6}$/).withMessage('Employee ID must be format EMP######'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').matches(passwordRegex).withMessage('Strong password required'),
  body('department').isIn(['payments', 'verification', 'admin']).withMessage('Invalid department')
], validateInput, async (req, res) => {
  try {
    console.log('👔 Employee registration attempt:', req.body.employeeId);

    const { fullName, employeeId, email, password, department } = req.body;

    const existing = await Employee.findOne({ $or: [{ email: email.toLowerCase() }, { employeeId }] });
    if (existing) {
      console.log('❌ Employee already exists');
      return res.status(400).json({ error: 'Employee already exists with this email or employee ID' });
    }

    const employee = await Employee.create({
      fullName,
      employeeId,
      email: email.toLowerCase(),
      password,
      department
    });

    console.log('✅ Employee created:', employee._id);

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