const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['Customer', 'Admin'],
    default: 'Customer'
  },
  refreshTokens: [{
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' },
    userAgent: String,
    ip: String
  }],
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

userSchema.index({ refreshTokens: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.addRefreshToken = async function(token, userAgent, ip) {
  this.refreshTokens.push({ token, userAgent, ip });
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  await this.save();
};

userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  await this.save();
};

userSchema.methods.clearRefreshTokens = async function() {
  this.refreshTokens = [];
  await this.save();
};

userSchema.methods.hasValidRefreshToken = function(token) {
  return this.refreshTokens.some(rt => rt.token === token);
};

module.exports = mongoose.model('User', userSchema);