const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const router = express.Router();

// Auth middleware
function authCid(req, res, next) {
  try {
    let cid = null;
    const auth = req.headers['authorization'] || '';
    if (/^CID\s+\d{11}$/i.test(auth)) cid = auth.split(/\s+/)[1];
    if (!cid && req.headers['x-cid'] && /^\d{11}$/.test(String(req.headers['x-cid']))) {
      cid = String(req.headers['x-cid']);
    }
    if (!cid && req.body && req.body.cid && /^\d{11}$/.test(String(req.body.cid))) {
      cid = String(req.body.cid);
    }
    if (!cid) return res.status(401).json({ error: 'Unauthorized' });
    req.user = { cid };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// POST /api/reviews - Create a new review
router.post('/', authCid, async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment } = req.body;
    const userCid = req.user.cid;

    // Validate required fields
    if (!productId || !orderId || !rating || !title || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate title length
    if (title.trim().length < 5) {
      return res.status(400).json({ error: 'Title must be at least 5 characters' });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ error: 'Title cannot exceed 100 characters' });
    }

    // Validate comment length
    if (comment.trim().length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters' });
    }
    if (comment.trim().length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters' });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userCid !== userCid) {
      return res.status(403).json({ error: 'You can only review your own orders' });
    }

    // Verify order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'You can only review delivered orders' });
    }

    // Verify product in order matches productId
    if (order.product.productId.toString() !== productId) {
      return res.status(400).json({ error: 'Product does not match order' });
    }

    // Get user name
    const user = await User.findOne({ cid: userCid }).select('name');
    const userName = user?.name || 'Anonymous';

    // Check if review already exists
    const existingReview = await Review.findOne({ productId, userCid });
    if (existingReview) {
      return res.status(400).json({ 
        error: 'You have already reviewed this product',
        reviewId: existingReview._id
      });
    }

    // Create review
    const review = new Review({
      productId,
      orderId,
      userCid,
      userName,
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim()
    });

    await review.save();

    res.status(201).json({
      message: 'Review created successfully',
      review: {
        reviewId: review._id,
        productId: review.productId,
        orderId: review.orderId,
        userCid: review.userCid,
        userName: review.userName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// GET /api/reviews/product/:productId - Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user profile images for reviewers
    const userCids = [...new Set(reviews.map(r => r.userCid))];
    const users = await User.find({ cid: { $in: userCids } }).select('cid profileImageData profileImageMime');
    const userProfileMap = new Map();
    users.forEach(u => {
      if (u.profileImageData) {
        try {
          userProfileMap.set(u.cid, {
            profileImageBase64: u.profileImageData.toString('base64'),
            profileImageMime: u.profileImageMime || 'image/png'
          });
        } catch(_) {}
      }
    });

    // Calculate rating breakdown
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingBreakdown[review.rating]++;
    });

    const totalReviews = reviews.length;
    const ratingPercentages = {};
    Object.keys(ratingBreakdown).forEach(rating => {
      ratingPercentages[rating] = totalReviews > 0 
        ? Math.round((ratingBreakdown[rating] / totalReviews) * 100)
        : 0;
    });

    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    res.json({
      reviews: reviews.map(r => {
        const userProfile = userProfileMap.get(r.userCid);
        return {
          reviewId: r._id,
          userName: r.userName,
          userProfileImageBase64: userProfile?.profileImageBase64,
          userProfileImageMime: userProfile?.profileImageMime,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isEdited: r.isEdited,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
      }),
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown,
        ratingPercentages
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/my - Get all reviews by current user
router.get('/my', authCid, async (req, res) => {
  try {
    const userCid = req.user.cid;

    const reviews = await Review.find({ userCid })
      .sort({ createdAt: -1 })
      .lean();

    // Populate product info
    const reviewsWithProducts = await Promise.all(
      reviews.map(async (review) => {
        const product = await Product.findById(review.productId).select('productName');
        return {
          reviewId: review._id,
          productId: review.productId,
          productName: product?.productName || 'Unknown Product',
          orderId: review.orderId,
          rating: review.rating,
          comment: review.comment,
          isEdited: review.isEdited,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        };
      })
    );

    res.json({ reviews: reviewsWithProducts });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/order/:orderId - Check if user has reviewed this order
router.get('/order/:orderId', authCid, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userCid = req.user.cid;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const review = await Review.findOne({ orderId, userCid }).lean();

    if (!review) {
      return res.json({ hasReview: false, review: null });
    }

    res.json({
      hasReview: true,
      review: {
        reviewId: review._id,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        isEdited: review.isEdited,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error('Error checking order review:', error);
    res.status(500).json({ error: 'Failed to check review' });
  }
});

// PUT /api/reviews/:reviewId - Update a review
router.put('/:reviewId', authCid, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userCid = req.user.cid;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate title if provided
    if (title) {
      if (title.trim().length < 5) {
        return res.status(400).json({ error: 'Title must be at least 5 characters' });
      }
      if (title.trim().length > 100) {
        return res.status(400).json({ error: 'Title cannot exceed 100 characters' });
      }
    }

    // Validate comment if provided
    if (comment) {
      if (comment.trim().length < 10) {
        return res.status(400).json({ error: 'Comment must be at least 10 characters' });
      }
      if (comment.trim().length > 500) {
        return res.status(400).json({ error: 'Comment cannot exceed 500 characters' });
      }
    }

    // Find review and verify ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userCid !== userCid) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Update fields
    if (rating) review.rating = Number(rating);
    if (title) review.title = title.trim();
    if (comment) review.comment = comment.trim();
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    res.json({
      message: 'Review updated successfully',
      review: {
        reviewId: review._id,
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isEdited: review.isEdited,
        editedAt: review.editedAt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:reviewId - Delete a review
router.delete('/:reviewId', authCid, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userCid = req.user.cid;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    // Find review and verify ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userCid !== userCid) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
