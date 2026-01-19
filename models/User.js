const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  pass: { type: String, required: true, select: false },
  profile_picture: String,
  bio: String,
  game_list: [{ type: Number }],
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  lastVerificationEmailSent: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);