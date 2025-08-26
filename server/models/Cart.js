const mongoose = require('mongoose')

const CartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true }
)

const CartSchema = new mongoose.Schema(
  {
    userCid: {
      type: String,
      required: true,
      index: true,
      validate: { validator: v => /^\d{11}$/.test(v), message: 'CID must be exactly 11 digits' },
      unique: true,
    },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
)

module.exports = mongoose.model('Cart', CartSchema)
