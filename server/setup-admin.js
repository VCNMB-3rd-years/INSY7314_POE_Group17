require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const createFirstAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📊 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create first admin
    const admin = await Employee.create({
      fullName: 'System Administrator',
      employeeId: 'EMP000001',
      email: 'admin@company.com',
      password: 'Admin@123456', // Change this!
      role: 'admin',
      department: 'admin'
    });

    console.log('✅ First admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🆔 Employee ID:', admin.employeeId);
    console.log('🔑 Password: Admin@123456');
    console.log('\n⚠️ CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createFirstAdmin();