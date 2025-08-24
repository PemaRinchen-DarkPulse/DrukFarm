const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Expose categoryId instead of _id
CategorySchema.virtual('categoryId').get(function () {
  return this._id
})

// Unique constraint is already set on the path definition above

module.exports = mongoose.model('Category', CategorySchema)
