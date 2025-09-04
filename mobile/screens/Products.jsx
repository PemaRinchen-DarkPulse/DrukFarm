import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fetchProducts } from "../lib/api";

export default function Products({ navigation }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const data = await fetchProducts();
        if (!Array.isArray(data)) return;
        const mapped = data.map((p) => ({
          id: String(p.productId || p._id || ''),
          name: p.productName || '',
          farmer: p.sellerName || (p.sellerCid ? `CID ${p.sellerCid}` : 'Farmer'),
          price: `Nu ${Number(p.price ?? 0)}${p.unit ? `/${p.unit}` : ''}`,
          rating: Number(p.rating ?? 0),
          stock: Number(p.stockQuantity ?? 0),
          unit: p.unit || '',
          image: p.productImageBase64
            ? `data:image/jpeg;base64,${p.productImageBase64}`
            : (p.image || 'https://via.placeholder.com/600x400.png?text=Product'),
        }));
        if (isActive) setProducts(mapped);
      } catch (e) {
        console.warn('Failed to load products:', e?.message || e);
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const renderProduct = ({ item }) => {
    if (item?.empty) {
      // Invisible placeholder to keep 2-column grid aligned when count is odd
      return <View style={[styles.card, { opacity: 0 }]} pointerEvents="none" />
    }
    return (
    <View style={styles.card}>
      {/* Product Image */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.image} />

        {/* Stock Badge */}
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>
            {item.stock} {item.unit}
          </Text>
        </View>

        {/* Wishlist Heart */}
        <TouchableOpacity style={styles.heartBtn}>
          <Icon name="heart-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.farmer}>{item.farmer}</Text>
        <Text style={styles.price}>{item.price}</Text>

        <View style={styles.row}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color="#FBBF24" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn}>
            <Icon name="cart-plus" size={16} color="#fff" />
            <Text style={styles.cartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  }

  return (
    <View style={styles.container}>
      {/* Header with Filter on same row */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fresh Produce</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Icon name="tune" size={16} color="#111827" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products.length % 2 === 1 ? [...products, { id: `__empty-${products.length}`, empty: true }] : products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 4,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
    overflow: "hidden",
  },

  imageWrapper: {
    width: "100%",
    height: 120,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  stockBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  stockText: { fontSize: 11, fontWeight: "600", color: "#111827" },

  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },

  info: { padding: 10, gap: 2 },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
  farmer: { fontSize: 12, color: "#6B7280" },
  price: { fontSize: 13, fontWeight: "700", color: "#DC2626", marginTop: 4 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    justifyContent: "space-between",
  },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  rating: { fontSize: 12, color: "#111827", marginLeft: 2 },

  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  cartText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});