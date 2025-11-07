const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encryptField, decryptField } = require('../utils/cryptoField');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  idNumber: {
    type: String,
    required: [true, 'ID number is required'],
    unique: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['customer'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/// Encrypt sensitive fields before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it was modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);  
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Encrypt sensitive fields on first save
  if (this.isNew) {
    this.idNumber = encryptField(this.idNumber);
    this.accountNumber = encryptField(this.accountNumber);
  }

  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to decrypt fields for display
userSchema.methods.getDecryptedData = function() {
  return {
    _id: this._id,
    fullName: this.fullName,
    idNumber: decryptField(this.idNumber),
    accountNumber: decryptField(this.accountNumber),
    email: this.email,
    role: this.role,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);