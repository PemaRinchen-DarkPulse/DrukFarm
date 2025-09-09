const mongoose = require('mongoose')

const DropOffLocationSchema = new mongoose.Schema(
  {
    dzongkhag: {
      type: String,
      required: true,
      trim: true,
      index: true,
      validate: {
        validator: function(v) {
          const validDzongkhags = new Set([
            'Bumthang', 'Chhukha', 'Dagana', 'Gasa', 'Haa', 'Lhuentse', 
            'Mongar', 'Paro', 'Pemagatshel', 'Punakha', '  ', 
            'Samtse', 'Sarpang', 'Thimphu', 'Trashigang', 'Trashiyangtse', 
            'Trongsa', 'Tsirang', 'Wangdue Phodrang', 'Zhemgang'
          ])
          return validDzongkhags.has(v)
        },
        message: 'Invalid Dzongkhag'
      }
    },
    towns: [{
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0
        },
        message: 'Town name cannot be empty'
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true, 
    versionKey: false,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
  }
)

// Create a compound index to ensure unique dzongkhag entries
DropOffLocationSchema.index({ dzongkhag: 1 }, { unique: true })

// Virtual for locationId using _id
DropOffLocationSchema.virtual('locationId').get(function () {
  return this._id
})

// Pre-save middleware to remove duplicate towns and ensure proper formatting
DropOffLocationSchema.pre('save', function(next) {
  if (this.towns && Array.isArray(this.towns)) {
    // Remove duplicates and empty strings, trim whitespace
    this.towns = [...new Set(this.towns
      .map(town => town ? town.toString().trim() : '')
      .filter(town => town.length > 0)
    )]
  }
  next()
})

// Pre-update middleware for findOneAndUpdate
DropOffLocationSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate()
  if (update.towns && Array.isArray(update.towns)) {
    update.towns = [...new Set(update.towns
      .map(town => town ? town.toString().trim() : '')
      .filter(town => town.length > 0)
    )]
  }
  next()
})

module.exports = mongoose.model('DropOffLocation', DropOffLocationSchema)
