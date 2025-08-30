import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomDock from '../components/BottomDock';
import Categories from '../components/Categories';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';
import { Ionicons } from '@expo/vector-icons';
import { fetchProducts, addToCart, buyProduct, getCart } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const { setCartCount } = useApp();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchProducts();
        const top = [...list].slice(0, 3).map(p => ({
          id: p.productId,
          title: p.productName,
          desc: p.description,
          price: p.price,
          unit: p.unit,
          stock: p.stockQuantity,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
          imageBase64: p.productImageBase64 || null,
          locationLabel: p.sellerLocationLabel || '',
        }));
        if (mounted) setItems(top);
      } catch (e) {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['bottom']}>
      {/* Fixed header to match sticky navbar on client */}
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}><Text style={styles.logoText}>FD</Text></View>
            <View>
              <Text style={styles.brand}>DruKFarm</Text>
              <Text style={styles.tagline}>Farm to Table — Bhutan</Text>
            </View>
          </View>
          <TouchableOpacity onPress={()=> { /* TODO: open menu */ }}>
            <Ionicons name="menu-outline" size={28} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

  <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 64 + Math.max(12, insets.bottom) }]}>
        {/* Hero section with gradient background matching client */}
        <LinearGradient colors={["#ecfdf5", "#ffffff"]} start={{x:0,y:0}} end={{x:0,y:1}} style={styles.heroGrad}>
          <View style={styles.heroInner}>
            <View style={{ marginTop: 12 }}>
              <View style={styles.heroImageCard}>
                {/* If you add mobile/assets/heroimage.jpg, swap the source below */}
                <Image source={require('../../assets/splash-icon.png')} style={styles.heroImage} resizeMode="cover" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Connecting Farmers to Markets in Bhutan</Text>
              <Text style={styles.p}>DruKFarm connects Bhutanese farmers directly with urban consumers, restaurants, and hotels — fair prices, fresh produce, and traceable logistics.</Text>
              <View style={styles.ctaRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={()=> nav.navigate('Products')}>
                  <Text style={styles.btnPrimaryText}>Shop Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnOutline} onPress={()=> nav.navigate('Login')}>
                  <Text style={styles.btnOutlineText}>Join as Farmer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.badge}>
                <Ionicons name="leaf-outline" size={20} color="#047857" />
                <Text style={styles.badgeText}>Fresh from the valley — average delivery 24–48 hours</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Platform features section */}
        <View style={styles.featuresWrap}>
          <Text style={styles.featuresTitle}>Platform features</Text>
          <Text style={styles.featuresSub}>All tools farmers and buyers need to transact directly and efficiently.</Text>

          <View style={styles.featCard}>
            <View style={styles.featIconWrap}>
              <View style={styles.featIconBg}>
                <Ionicons name="leaf" size={20} color="#047857" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featTitle}>Direct Crop Listings</Text>
              <Text style={styles.featDesc}>Farmers can list produce directly with photos, harvest date, and price.</Text>
            </View>
          </View>
        </View>

  <Categories />

  <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <Text style={styles.sectionSub}>Discover fresh, high-quality produce from our trusted local farmers</Text>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.cardsGrid}>
              {items.map(p => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardImageWrap}>
                    <Image
                      style={styles.cardImage}
                      source={p.imageBase64 ? { uri: `data:image/jpeg;base64,${p.imageBase64}` } : require('../../assets/icon.png')}
                    />
                    <View style={styles.favBadge}><Text>♡</Text></View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{p.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={3}>{p.desc}</Text>
                    <View style={styles.rowSm}>
                      <Ionicons name="location-outline" size={14} color="#047857" />
                      <Text style={styles.locationText}>{p.locationLabel || 'Your farm'}</Text>
                    </View>
                    <Text style={styles.rating}>★ {p.rating} <Text style={styles.muted}>({p.reviews} reviews)</Text></Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>Nu. {p.price} <Text style={styles.unit}>/{p.unit}</Text></Text>
                      <Text style={styles.stock}>Stock: {p.stock ?? 0} {p.unit || ''}</Text>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.btnOutlineSm} onPress={async ()=> {
                        try {
                          await addToCart({ productId: p.id, quantity: 1 });
                          const cart = await getCart();
                          const count = Array.isArray(cart?.cart?.items) ? cart.cart.items.reduce((s,i)=> s + Number(i.quantity||0), 0) : 0;
                          setCartCount(count);
                        } catch {}
                      }}>
                        <Ionicons name="cart-outline" size={16} color="#334155" />
                        <Text style={styles.btnOutlineSmText}>Add to Cart</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnPrimarySm} onPress={async ()=> {
                        try {
                          await buyProduct({ productId: p.id, quantity: 1 });
                          nav.navigate('Root', { screen: 'Orders' });
                        } catch {
                          nav.navigate('Login');
                        }
                      }}>
                        <Ionicons name="card-outline" size={16} color="#fff" />
                        <Text style={styles.btnPrimarySmText}>Buy Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.btnPrimary, { alignSelf: 'center', marginTop: 16 }]} onPress={()=> nav.navigate('Products')}>
            <Text style={styles.btnPrimaryText}>View All Products →</Text>
          </TouchableOpacity>
  </View>

  <CTASection />
  <Footer />
      </ScrollView>
      <BottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerWrap: { backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderColor: '#eef2f7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '700' },
  brand: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  tagline: { fontSize: 12, color: '#64748b' },
  heroGrad: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 0 },
  heroInner: { paddingHorizontal: 16 },
  h1: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  p: { marginTop: 8, color: '#334155' },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnPrimary: { backgroundColor: '#047857', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnOutline: { borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  btnOutlineText: { color: '#0f172a', fontWeight: '600' },
  badge: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.6)' },
  badgeText: { color: '#1f2937', fontSize: 12 },
  heroImageCard: { borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden', elevation: 6, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  heroImage: { width: '100%', height: 200 },

  /* Features section */
  featuresWrap: { marginTop: 16, alignItems: 'center' },
  featuresTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  featuresSub: { marginTop: 6, color: '#475569', textAlign: 'center', maxWidth: 340 },
  featCard: { marginTop: 16, width: '100%', backgroundColor: '#ecfdf5', borderRadius: 16, borderWidth: 1, borderColor: '#d1fae5', padding: 16, flexDirection: 'row', gap: 12 },
  featIconWrap: { justifyContent: 'flex-start' },
  featIconBg: { backgroundColor: '#d1fae5', borderRadius: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  featDesc: { marginTop: 6, color: '#475569' },

  section: { marginTop: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#065f46' },
  sectionSub: { marginTop: 4, color: '#065f46', opacity: 0.8 },
  cardsGrid: { marginTop: 12, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#dcfce7' },
  cardImageWrap: { height: 160, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  favBadge: { position: 'absolute', top: 8, right: 8, padding: 6, borderRadius: 999, backgroundColor: '#fff' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#064e3b' },
  cardDesc: { marginTop: 6, color: '#475569' },
  rowSm: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: '#0f172a' },
  rating: { marginTop: 6, color: '#d97706', fontWeight: '600' },
  muted: { color: '#94a3b8' },
  priceRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  price: { fontSize: 20, fontWeight: '800', color: '#065f46' },
  unit: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  stock: { color: '#475569' },
  actions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  btnOutlineSm: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 10, borderRadius: 8 },
  btnOutlineSmText: { color: '#334155', fontWeight: '600' },
  btnPrimarySm: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#065f46', paddingVertical: 10, borderRadius: 8 },
  btnPrimarySmText: { color: '#fff', fontWeight: '700' },
});
