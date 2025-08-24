const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: {
      type: String,
      required: true,
      minlength: 70,
      maxlength: 180,
      trim: true,
    },
    price: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, trim: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    productImageBase64: { type: String, required: true },
    createdBy: { type: String, required: true, trim: true }, // CID of user
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Expose productId instead of _id
ProductSchema.virtual('productId').get(function () {
  return this._id
})

module.exports = mongoose.model('Product', ProductSchema)
