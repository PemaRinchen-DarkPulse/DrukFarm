const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true, trim: true },
    // Brief description for the category (required 15-45 chars)
    description: { type: String, required: true, trim: true, minlength: 15, maxlength: 45 },
    // Base64 encoded image (no data URL prefix); keep moderate size in route validation
    imageBase64: { type: String, required: true },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Expose categoryId instead of _id
CategorySchema.virtual('categoryId').get(function () {
  return this._id
})

// Unique constraint is already set on the path definition above

module.exports = mongoose.model('Category', CategorySchema)
