const mongoose = require('mongoose')

function capFirst(val) {
  if (val === undefined || val === null) return val
  const s = String(val)
  const trimmed = s.trim()
  if (!trimmed) return trimmed
  // Capitalize first non-space character, keep rest as-is
  const firstIdx = 0
  return trimmed.charAt(firstIdx).toUpperCase() + trimmed.slice(firstIdx + 1)
}

const CategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true, trim: true, set: capFirst },
    // Brief description for the category (required 15-45 chars)
    description: { type: String, required: true, trim: true, minlength: 15, maxlength: 45, set: capFirst },
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

// Ensure updates also normalize capitalization
CategorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {}
  const $set = update.$set || {}
  const apply = (obj) => {
    if (obj.categoryName !== undefined) obj.categoryName = capFirst(obj.categoryName)
    if (obj.description !== undefined) obj.description = capFirst(obj.description)
  }
  apply(update)
  apply($set)
  if (Object.keys($set).length) update.$set = $set
  this.setUpdate(update)
  next()
})
