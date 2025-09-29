const mongoose = require('mongoose');

const userDispatchAddressSchema = new mongoose.Schema({
  userCid: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'location',
  },
  dzongkhag: {
    type: String,
    required: true,
  },
  gewog: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for faster queries
userDispatchAddressSchema.index({ userCid: 1 });

const UserDispatchAddress = mongoose.model('UserDispatchAddress', userDispatchAddressSchema);

module.exports = { UserDispatchAddress };
