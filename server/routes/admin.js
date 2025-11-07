const express = require('express');
const { body } = require('express-validator');
const Employee = require('../models/Employee');
const authMiddleware = require('../middleware/auth');
const validateInput = require('../middleware/validateInput');
const { passwordRegex, employeeIdRegex } = require('../utils/regexPatterns');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Check if user is admin
const adminOnly = async (req, res, next) => {
  try {
    console.log('🔒 Admin check for user:', req.user);
    
    // Check if user role from token is admin (fastest check)
    if (req.user.role === 'admin') {
      console.log('✅ Admin access granted via token role');
      return next();
    }
    
    // Fallback: Fetch from database to double-check
    const employee = await Employee.findById(req.user.id);
    console.log('👤 Employee found in DB:', employee ? employee.role : 'not found');
    
    if (!employee) {
      console.log('❌ Employee not found in database');
      return res.status(403).json({ error: 'Employee not found' });
    }
    
    // Check if employee has admin role
    if (employee.role !== 'admin') {
      console.log('❌ Employee is not admin role, actual role:', employee.role);
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    console.log('✅ Admin access granted via database check');
    next();
  } catch (err) {
    console.error('❌ Admin check error:', err);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

router.use(adminOnly);

// @route   GET /api/admin/employees
// @desc    Get all employees (admin only)
// @access  Private (Admin)
router.get('/employees', async (req, res) => {
  try {
    console.log('📋 Fetching all employees');
    const employees = await Employee.find().select('-password');
    
    console.log(`✅ Found ${employees.length} employees`);
    
    res.json({
      count: employees.length,
      employees: employees.map(emp => ({
        _id: emp._id,
        fullName: emp.fullName,
        employeeId: emp.employeeId,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        isActive: emp.isActive,
        createdAt: emp.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// @route   POST /api/admin/employee
// @desc    Create new employee account (admin only)
// @access  Private (Admin)
router.post('/employee', [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('employeeId').matches(employeeIdRegex).withMessage('Employee ID must be format EMP######'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').matches(passwordRegex).withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('role').isIn(['employee', 'admin']).withMessage('Role must be employee or admin'),
  body('department').isIn(['payments', 'verification', 'admin']).withMessage('Invalid department')
], validateInput, async (req, res) => {
  try {
    console.log('👔 Admin creating employee:', req.body.employeeId);

    const { fullName, employeeId, email, password, role, department } = req.body;

    // Check if employee exists
    const existing = await Employee.findOne({ 
      $or: [{ email: email.toLowerCase() }, { employeeId }] 
    });
    
    if (existing) {
      console.log('❌ Employee already exists');
      return res.status(400).json({ error: 'Employee already exists with this email or employee ID' });
    }

    // Create employee
    const employee = await Employee.create({
      fullName,
      employeeId,
      email: email.toLowerCase(),
      password,
      role,
      department
    });

    console.log('✅ Employee created by admin:', employee._id);

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
        department: employee.department
      }
    });
  } catch (error) {
    console.error('❌ Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee', details: error.message });
  }
});

// @route   DELETE /api/admin/employee/:id
// @desc    Delete employee account (admin only)
// @access  Private (Admin)
router.delete('/employee/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Prevent deleting yourself
    if (employee._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await Employee.findByIdAndDelete(req.params.id);

    console.log('✅ Employee deleted by admin:', req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('❌ Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const [totalEmployees, activeEmployees, adminCount] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ isActive: true }),
      Employee.countDocuments({ role: 'admin' })
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      adminCount,
      regularEmployees: totalEmployees - adminCount
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;