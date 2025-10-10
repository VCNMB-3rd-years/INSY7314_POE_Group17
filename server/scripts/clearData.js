require('dotenv').config();
const mongoose = require('mongoose');

const clearData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Clear all collections
    console.log('🗑️  Clearing all data...\n');
    
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);
    
    const transactionsResult = await db.collection('transactions').deleteMany({});
    console.log(`✅ Deleted ${transactionsResult.deletedCount} transactions`);
    
    const sessionsResult = await db.collection('sessions').deleteMany({});
    console.log(`✅ Deleted ${sessionsResult.deletedCount} sessions`);
    
    const employeesResult = await db.collection('employees').deleteMany({});
    console.log(`✅ Deleted ${employeesResult.deletedCount} employees`);

    console.log('\n🎉 DATABASE CLEARED!\n');
    console.log('📝 Next steps:');
    console.log('   1. Register a new customer');
    console.log('   2. Register a new employee');
    console.log('   3. Create fresh transactions\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearData();