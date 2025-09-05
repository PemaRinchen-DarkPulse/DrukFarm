import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';

// --- Static Data ---
const product = {
  name: 'Organic Tomatoes',
  description: 'Freshly harvested organic tomatoes from the fields of Paro, Bhutan. These tomatoes are known for their rich flavor and nutritional value.',
  price: 'Nu. 150/kg',
  available: '50 kg',
  image: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?q=80&w=2070&auto=format&fit=crop', // A placeholder image
};

const farmer = {
  name: 'Tenzin Wangchuk',
  location: 'Farmer from Paro',
  avatar: 'https://images.unsplash.com/photo-1560365163-3e8d64e762ef?q=80&w=1964&auto=format&fit=crop', // A placeholder image
};

const reviews = [
  {
    id: 1,
    name: 'Sonam Dema',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop', // Placeholder
    time: '2 weeks ago',
    rating: 5,
    comment: 'The tomatoes were incredibly fresh and flavorful. I used them in a salad, and they were the star of the dish!',
  },
  {
    id: 2,
    name: 'Jigme Dorji',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop', // Placeholder
    time: '1 month ago',
    rating: 4,
    comment: 'Good quality tomatoes, though a bit smaller than expected. Still, very tasty.',
  },
];

const ratingBreakdown = {
  '5': 40,
  '4': 30,
  '3': 15,
  '2': 10,
  '1': 5,
};

// --- Helper Components ---
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

const RatingBar = ({ label, percentage }) => (
  <View style={styles.ratingBarRow}>
    <Text style={styles.ratingBarLabel}>{label}</Text>
    <View style={styles.ratingBarContainer}>
      <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
    </View>
    <Text style={styles.ratingBarPercentage}>{percentage}%</Text>
  </View>
);


// --- Main Screen Component ---
const ProductDetailScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Changed: Removed the paddingBottom from contentContainerStyle */}
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.productImage} />

        <View style={styles.container}>
          {/* Product Info */}
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Farmer Info */}
          <TouchableOpacity style={styles.farmerCard}>
            <Image source={{ uri: farmer.avatar }} style={styles.avatar} />
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>{farmer.name}</Text>
              <Text style={styles.farmerLocation}>{farmer.location}</Text>
            </View>
            <AntDesign name="right" size={16} color="#888" />
          </TouchableOpacity>

          {/* Price & Quantity */}
          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>{product.price}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.detailLabel}>Available Quantity</Text>
              <Text style={styles.detailValue}>{product.available}</Text>
            </View>
          </View>
          
          {/* ==== Buttons Moved Here ==== */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.button, styles.addToCartButton]}>
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buyNowButton]}>
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Reviews & Ratings */}
          <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
          <View style={styles.ratingsSummary}>
            <View style={styles.ratingsSummaryLeft}>
                <Text style={styles.averageRating}>4.5</Text>
                <StarRating rating={4.5} size={20} />
                <Text style={styles.reviewCount}>25 reviews</Text>
            </View>
            <View style={styles.ratingsSummaryRight}>
                {Object.entries(ratingBreakdown).reverse().map(([label, percentage]) => (
                    <RatingBar key={label} label={label} percentage={percentage} />
                ))}
            </View>
          </View>

          {/* Individual Reviews */}
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewTime}>{review.time}</Text>
                </View>
              </View>
              <StarRating rating={review.rating} />
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ==== Fixed Footer Removed ==== */}
    </SafeAreaView>
  );
};


// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  productImage: { width: '100%', height: 300 },
  container: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#222' },
  description: { fontSize: 16, color: '#666', marginTop: 8, lineHeight: 22 },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  farmerInfo: { flex: 1, marginLeft: 12 },
  farmerName: { fontSize: 16, fontWeight: 'bold' },
  farmerLocation: { fontSize: 14, color: '#777' },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  
  // Changed: New style for the button container in the scroll view
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: { backgroundColor: '#f0f0f0', marginRight: 8 },
  buyNowButton: { backgroundColor: '#e53935', marginLeft: 8 },
  addToCartText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  buyNowText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  ratingsSummary: { flexDirection: 'row', marginTop: 16 },
  ratingsSummaryLeft: { alignItems: 'center', justifyContent: 'center', marginRight: 24 },
  averageRating: { fontSize: 48, fontWeight: 'bold', color: '#222' },
  starContainer: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  reviewCount: { fontSize: 14, color: '#888' },
  ratingsSummaryRight: { flex: 1 },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBarLabel: { fontSize: 12, color: '#666', width: 15 },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 4,
  },
  ratingBarPercentage: { fontSize: 12, color: '#666', width: 30 },
  reviewCard: {
    marginTop: 24,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 16,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewHeaderText: { marginLeft: 10 },
  reviewName: { fontWeight: 'bold', fontSize: 15 },
  reviewTime: { fontSize: 12, color: '#999' },
  reviewComment: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#333' },
  // Changed: The fixed footer style is no longer needed
});

export default ProductDetailScreen;