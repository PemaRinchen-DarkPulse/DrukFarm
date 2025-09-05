const mongoose = require('mongoose')

const WishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const WishlistSchema = new mongoose.Schema(
  {
    userCid: {
      type: String,
      required: true,
      index: true,
      unique: true,
      validate: { validator: v => /^\d{11}$/.test(v), message: 'CID must be exactly 11 digits' },
    },
    items: { type: [WishlistItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
)

module.exports = mongoose.model('Wishlist', WishlistSchema)
