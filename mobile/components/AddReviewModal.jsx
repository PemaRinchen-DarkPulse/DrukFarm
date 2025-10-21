import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createReview, updateReview, getOrderReview } from '../lib/api';
import { getCurrentCid } from '../lib/auth';

const AddReviewModal = ({ visible, onClose, order, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check if review already exists when modal opens
  useEffect(() => {
    if (visible && order) {
      checkExistingReview();
    } else {
      // Reset when modal closes
      setRating(0);
      setTitle('');
      setComment('');
      setExistingReview(null);
      setIsEditing(false);
    }
  }, [visible, order]);

  const checkExistingReview = async () => {
    try {
      const cid = getCurrentCid();
      if (!cid || !order?.orderId) return;

      const response = await getOrderReview({ orderId: order.orderId, cid });
      
      if (response.hasReview && response.review) {
        setExistingReview(response.review);
        setRating(response.review.rating);
        setTitle(response.review.title || '');
        setComment(response.review.comment);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (title.trim().length < 5) {
      Alert.alert('Title Too Short', 'Please write at least 5 characters for the title.');
      return;
    }

    if (title.trim().length > 100) {
      Alert.alert('Title Too Long', 'Title cannot exceed 100 characters.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters in your comment.');
      return;
    }

    if (comment.trim().length > 500) {
      Alert.alert('Comment Too Long', 'Comment cannot exceed 500 characters.');
      return;
    }

    try {
      setLoading(true);
      const cid = getCurrentCid();
      
      if (!cid) {
        Alert.alert('Error', 'Please log in to submit a review.');
        return;
      }

      if (isEditing && existingReview) {
        // Update existing review
        await updateReview({
          reviewId: existingReview.reviewId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          cid
        });

        Alert.alert('Success', 'Your review has been updated successfully!');
      } else {
        // Create new review
        await createReview({
          productId: order.product.productId,
          orderId: order.orderId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          cid
        });

        Alert.alert('Success', 'Thank you for your review!');
      }

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      
      // Callback to refresh parent
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Icon
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFC107' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit Review' : 'Add Review'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Order #{order.orderId?.slice(-8) || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating *</Text>
              {renderStars()}
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </Text>
              )}
            </View>

            {/* Title Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Review Title * <Text style={styles.charCount}>({title.length}/100)</Text>
              </Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Summarize your experience in one line..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!loading}
              />
              <Text style={styles.helperText}>
                Minimum 5 characters required
              </Text>
            </View>

            {/* Comment Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Your Review * <Text style={styles.charCount}>({comment.length}/500)</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience with this product..."
                placeholderTextColor="#9CA3AF"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
                editable={!loading}
              />
              <Text style={styles.helperText}>
                Minimum 10 characters required
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || rating === 0 || title.trim().length < 5 || comment.trim().length < 10) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || rating === 0 || title.trim().length < 5 || comment.trim().length < 10}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Review' : 'Submit Review'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  charCount: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
    backgroundColor: '#F9FAFB',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddReviewModal;
