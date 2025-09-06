const mongoose = require('mongoose')

function capFirst(val) {
  if (val === undefined || val === null) return val
  const s = String(val)
  const trimmed = s.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true, set: capFirst },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: {
      type: String,
      required: true,
      minlength: 70,
      maxlength: 180,
      trim: true,
      set: capFirst,
    },
    price: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, trim: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    productImage: { type: String, required: true },
    createdBy: { type: String, required: true, trim: true }, // CID of user
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Expose productId instead of _id
ProductSchema.virtual('productId').get(function () {
  return this._id
})

module.exports = mongoose.model('Product', ProductSchema)

// Ensure updates also normalize capitalization
ProductSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {}
  const $set = update.$set || {}
  const apply = (obj) => {
    if (obj.productName !== undefined) obj.productName = capFirst(obj.productName)
    if (obj.description !== undefined) obj.description = capFirst(obj.description)
  }
  apply(update)
  apply($set)
  if (Object.keys($set).length) update.$set = $set
  this.setUpdate(update)
  next()
})
