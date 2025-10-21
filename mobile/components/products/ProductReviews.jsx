import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getProductReviews } from '../../lib/api';

// Star Rating Component
const StarRating = ({ rating, size = 16 }) => {
  const filledStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - filledStars - (halfStar ? 1 : 0);

  return (
    <View style={styles.starContainer}>
      {[...Array(filledStars)].map((_, i) => (
        <FontAwesome key={`full_${i}`} name="star" size={size} color="#FFC107" />
      ))}
      {halfStar && <FontAwesome name="star-half-full" size={size} color="#FFC107" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FontAwesome key={`empty_${i}`} name="star-o" size={size} color="#FFC107" />
      ))}
    </View>
  );
};

// Rating Bar Component
const RatingBar = ({ label, percentage }) => (
  <View style={styles.ratingBarRow}>
    <Text style={styles.ratingBarLabel}>{label}</Text>
    <View style={styles.ratingBarContainer}>
      <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
    </View>
    <Text style={styles.ratingBarPercentage}>{percentage}%</Text>
  </View>
);

// Individual Review Item
const ReviewItem = ({ review }) => {
  const profileImageUri = review.userProfileImageBase64 && review.userProfileImageMime
    ? `data:${review.userProfileImageMime};base64,${review.userProfileImageBase64}`
    : null;

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          {profileImageUri ? (
            <Image
              source={{ uri: profileImageUri }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <FontAwesome name="user" size={20} color="#6B7280" />
            </View>
          )}
          <View>
            <Text style={styles.reviewerName}>{review.userName || 'Anonymous'}</Text>
            <Text style={styles.reviewTime}>
              {new Date(review.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
              {review.isEdited && ' (edited)'}
            </Text>
          </View>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>
      {review.title && (
        <Text style={styles.reviewTitle}>{review.title}</Text>
      )}
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
};

// Main Product Reviews Component
const ProductReviews = ({ productId, initialRating = 0, initialReviewCount = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: initialReviewCount,
    averageRating: initialRating,
    ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getProductReviews(productId);
      
      setReviews(data.reviews || []);
      setStats(data.stats || {
        totalReviews: 0,
        averageRating: 0,
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Keep initial values on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#059669" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  if (stats.totalReviews === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
        </View>
        <View style={styles.noReviews}>
          <FontAwesome name="star-o" size={48} color="#D1D5DB" />
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          <Text style={styles.noReviewsSubtext}>Be the first to review this product</Text>
        </View>
      </View>
    );
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
      </View>

      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <View style={styles.ratingLeft}>
          <Text style={styles.averageRating}>{stats.averageRating.toFixed(1)}</Text>
          <StarRating rating={stats.averageRating} size={20} />
          <Text style={styles.totalReviews}>Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.ratingRight}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <RatingBar
              key={rating}
              label={`${rating}★`}
              percentage={stats.ratingPercentages[rating] || 0}
            />
          ))}
        </View>
      </View>

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {displayedReviews.map((review) => (
          <ReviewItem key={review.reviewId} review={review} />
        ))}
      </View>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllReviews(!showAllReviews)}
        >
          <Text style={styles.showMoreText}>
            {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
          </Text>
          <FontAwesome 
            name={showAllReviews ? 'chevron-up' : 'chevron-down'} 
            size={14} 
            color="#059669" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
  },
  header: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  ratingSummary: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  ratingLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  ratingRight: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: '#374151',
    width: 30,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 4,
  },
  ratingBarPercentage: {
    fontSize: 12,
    color: '#6B7280',
    width: 40,
    textAlign: 'right',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginLeft: 52,
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginLeft: 52,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginRight: 6,
  },
});

export default ProductReviews;
