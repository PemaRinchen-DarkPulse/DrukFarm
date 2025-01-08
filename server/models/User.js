const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phone_number: { type: String, unique: true, sparse: true },
    otp: { type: String },
    is_verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);