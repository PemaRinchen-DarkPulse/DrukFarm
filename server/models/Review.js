const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    userCid: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: v => /^\d{11}$/.test(v),
        message: 'CID must be exactly 11 digits'
      }
    },
    userName: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound index to ensure one review per user per product
ReviewSchema.index({ productId: 1, userCid: 1 }, { unique: true });

// Virtual for reviewId
ReviewSchema.virtual('reviewId').get(function() {
  return this._id;
});

// Method to update product rating and review count
ReviewSchema.statics.updateProductStats = async function(productId) {
  const reviews = await this.find({ productId });
  
  if (reviews.length === 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: 0,
      reviews: 0
    });
    return { rating: 0, reviews: 0 };
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await mongoose.model('Product').findByIdAndUpdate(productId, {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviews: reviews.length
  });
  
  return { rating: averageRating, reviews: reviews.length };
};

// Post-save hook to update product stats
ReviewSchema.post('save', async function() {
  await this.constructor.updateProductStats(this.productId);
});

// Post-remove hook to update product stats
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.updateProductStats(doc.productId);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
