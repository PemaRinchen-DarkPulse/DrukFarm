import React, { useEffect, useMemo, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchProductById, addToCart, buyProduct } from '../../lib/api';
import { getCurrentCid } from '../../lib/auth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorScreen from '../ui/ErrorScreen';
import ProductReviews from './ProductReviews';

// Helper: best-effort MIME guess for base64 images
const guessMimeFromBase64 = (b64) => {
  if (!b64 || typeof b64 !== 'string') return null;
  const s = b64.slice(0, 12);
  if (s.startsWith('/9j/')) return 'image/jpeg';
  if (s.startsWith('iVBORw0KG')) return 'image/png';
  if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) return 'image/gif';
  if (s.startsWith('UklGR') || s.startsWith('RIFF')) return 'image/webp';
  return 'image/jpeg';
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


// --- Main Screen Component ---
const ProductDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const initialFromList = route?.params?.product || null;
  const productId = initialFromList?.id || route?.params?.productId || route?.params?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uiProduct, setUiProduct] = useState(() => {
    if (!initialFromList) return null;
    return {
      name: initialFromList.name || '',
      description: '',
      price: initialFromList.price || '',
      available: `${initialFromList.stock ?? ''} ${initialFromList.unit ?? ''}`.trim(),
      image: initialFromList.image || null,
    };
  });
  const [farmer, setFarmer] = useState(() => ({
    name: initialFromList?.farmer || 'Farmer',
    location: initialFromList?.locationLabel || '',
    avatar: 'https://images.unsplash.com/photo-1560365163-3e8d64e762ef?q=80&w=1964&auto=format&fit=crop',
  }));

  useEffect(() => {
    let active = true;
    (async () => {
      if (!productId) { setLoading(false); return; }
      try {
        const data = await fetchProductById(productId);
        if (!active || !data) return;
        const mime = data.productImageBase64 ? guessMimeFromBase64(data.productImageBase64) : null;
        const mapped = {
          name: data.productName || initialFromList?.name || '',
          description: data.description || '',
          price: `Nu. ${Number(data.price ?? 0)}${data.unit ? `/${data.unit}` : ''}`,
          available: `${Number(data.stockQuantity ?? 0)} ${data.unit || ''}`.trim(),
          image: data.productImageBase64 && mime ? `data:${mime};base64,${data.productImageBase64}` : (initialFromList?.image || null),
          rating: Number(data.rating ?? initialFromList?.rating ?? 0),
          reviews: Number(data.reviews ?? 0),
        };
        setUiProduct(mapped);
        
        // Set farmer info with profile picture
        const sellerAvatar = data.sellerProfileImageBase64 && data.sellerProfileImageMime
          ? `data:${data.sellerProfileImageMime};base64,${data.sellerProfileImageBase64}`
          : 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png';
        
        setFarmer({
          name: data.sellerName || (data.sellerCid ? `CID ${data.sellerCid}` : 'Farmer'),
          location: data.sellerLocationLabel || '',
          avatar: sellerAvatar,
        });
      } catch (e) {
        setError(e?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }
  if (error || !uiProduct) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorScreen message={error || 'Product not found'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Changed: Removed the paddingBottom from contentContainerStyle */}
      <ScrollView>
        {uiProduct.image ? (
          <Image source={{ uri: uiProduct.image }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, { backgroundColor: '#f3f4f6' }]} />
        )}

        <View style={styles.container}>
          {/* Product Info */}
          <Text style={styles.title}>{uiProduct.name}</Text>
          <Text style={styles.description}>{uiProduct.description}</Text>

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
              <Text style={styles.detailValue}>{uiProduct.price}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.detailLabel}>Available Quantity</Text>
              <Text style={styles.detailValue}>{uiProduct.available}</Text>
            </View>
          </View>
          
          {/* ==== Buttons Moved Here ==== */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.addToCartButton]}
              onPress={async () => {
                const cid = getCurrentCid();
                if (!cid) { navigation.navigate('Login'); return; }
                try { await addToCart({ productId, quantity: 1, cid }); } catch(e) { /* swallow */ }
              }}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buyNowButton]}
              onPress={() => {
                navigation.navigate('Buy', { productId, product: uiProduct });
              }}
            >
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Reviews Section - Using new component */}
          <ProductReviews 
            productId={productId} 
            initialRating={uiProduct?.rating || 0}
            initialReviewCount={uiProduct?.reviews || 0}
          />
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
  starContainer: { flexDirection: 'row', gap: 2, marginVertical: 4 },
});

export default ProductDetailScreen;