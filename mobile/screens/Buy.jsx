import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchProductById, buyProduct } from '../lib/api';
import { getCurrentCid } from '../lib/auth';
import ErrorScreen from '../components/ui/ErrorScreen';

// Price helpers mimic Cart logic for consistency
function displayPriceUnit(price, unit){
  if (unit === 'g') {
    // Convert given price (per 500g?) to per kg if needed. Cart divides by 500 then *1000. We'll reuse that.
    return { price: (price / 500) * 1000, unit: 'kg' };
  }
  return { price, unit };
}

export default function Buy(){
  const route = useRoute();
  const navigation = useNavigation();
  const passedProduct = route?.params?.product || null;
  const productId = route?.params?.productId || route?.params?.pid || passedProduct?.id || passedProduct?._id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(() => passedProduct ? ({
    id: passedProduct.id,
    name: passedProduct.name || passedProduct.title || '',
    price: Number(passedProduct.price || 0),
    unit: passedProduct.unit || '',
    stock: Number(passedProduct.stock || 0),
    image: passedProduct.image || null,
    description: passedProduct.description || passedProduct.desc || '',
  }) : null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Load product details if not fully provided
  useEffect(() => {
    let active = true;
    (async () => {
      if (!productId) { setLoading(false); setError('Missing product id'); return; }
      try {
        const data = await fetchProductById(productId);
        if (!active) return;
        const image = data.productImageBase64 ? `data:image/jpeg;base64,${data.productImageBase64}` : product?.image || null;
        setProduct({
          id: data.productId || productId,
          name: data.productName || '',
          price: Number(data.price || 0),
          unit: data.unit || '',
          stock: Number(data.stockQuantity || 0),
          image,
          description: data.description || '',
          seller: data.sellerName || (data.sellerCid ? `CID ${data.sellerCid}` : ''),
        });
      } catch(e){
        setError(e?.message || 'Failed to load product');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const { displayPrice, displayUnit } = useMemo(() => {
    if (!product) return { displayPrice: 0, displayUnit: '' };
    const { price, unit } = displayPriceUnit(product.price, product.unit);
    return { displayPrice: price, displayUnit: unit };
  }, [product]);

  const subtotal = useMemo(() => (product ? product.price * quantity : 0), [product, quantity]);
  const deliveryFee = 50; // static like Cart
  const taxes = subtotal * 0.05;
  const total = subtotal + deliveryFee + taxes;

  const increment = () => {
    if (!product) return;
    if (quantity < product.stock) setQuantity(q => q + 1);
  };
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : q));

  const handleNext = () => {
    if (!product) return;
    const cid = getCurrentCid();
    if (!cid) { navigation.navigate('Login', { redirectTo: 'Buy', productId }); return; }
    // Navigate to Checkout with a single-product context so Checkout can adapt
    navigation.navigate('Checkout', {
      singleBuy: true,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity,
        stock: product.stock,
        image: product.image,
        subtotal: subtotal,
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={styles.container}>
        <ErrorScreen message={error || 'Product not found'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Now</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Product Card - similar to Cart item */}
        <View style={styles.itemCard}>
          <View style={styles.leftColumn}>
            <Image
              source={product.image ? { uri: product.image } : require('../assets/heroimage.jpg')}
              style={styles.image}
            />
            <View style={styles.qtyBox}>
              <TouchableOpacity style={styles.qtyBtn} onPress={decrement}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={increment}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View>
              <Text style={styles.itemName}>{product.name}</Text>
              <Text style={styles.itemPriceUnit}>Nu. {displayPrice.toFixed(0)}/{displayUnit || product.unit}</Text>
              <Text style={styles.itemStock}>Stock: {product.stock} {product.unit}</Text>
            </View>
          </View>
        </View>

        {/* Summary - adapted from Cart */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal (1 item)</Text>
            <Text style={styles.value}>Nu. {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>Nu. {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Taxes</Text>
            <Text style={styles.value}>Nu. {taxes.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Nu. {total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 16, paddingLeft: 16, paddingRight: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2, minHeight: 150, marginLeft: 4 },
  leftColumn: { justifyContent: 'space-between', alignItems: 'center' },
  rightColumn: { flex: 1, marginLeft: 20, justifyContent: 'space-between' },
  image: { width: 90, height: 90, borderRadius: 10, marginBottom: 10 },
  itemName: { fontSize: 17, fontWeight: '700', color: '#111' },
  itemPriceUnit: { fontSize: 15, fontWeight: 'bold', color: '#6B7280', marginTop: 2 },
  itemStock: { fontSize: 14, fontWeight: '500', color: 'green', marginTop: 2 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  qtyBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtnText: { fontSize: 16, fontWeight: '600', color: '#111' },
  qtyText: { fontSize: 14, fontWeight: '600', marginHorizontal: 10 },
  summaryBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14, color: '#374151' },
  value: { fontSize: 14, fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  nextBtn: { backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
