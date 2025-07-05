const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: String,
  givenName: String,
  email: { type: String, required: true },
  photo: String,
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
