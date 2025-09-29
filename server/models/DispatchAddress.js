const mongoose = require('mongoose');

const GewogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  villages: [{
    type: String,
  }],
});

const dispatchAddressSchema = new mongoose.Schema({
  dzongkhag: {
    type: String,
    required: true,
    unique: true,
  },
  gewogs: [GewogSchema],
}, { timestamps: true });

const DispatchAddress = mongoose.model('DispatchAddress', dispatchAddressSchema);

module.exports = { DispatchAddress };
