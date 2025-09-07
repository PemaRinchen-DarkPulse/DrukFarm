import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api, { getWishlist, removeFromWishlist, addToCart } from "../lib/api";
import { resolveProductImage } from '../lib/image';
import { getCurrentCid } from "../lib/auth";
import EmptyWishlist from "./EmptyWishlist";

export default function Wishlist({ navigation }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cid = getCurrentCid();
      if (!cid) {
        navigation.navigate("Login");
        return;
      }
      setLoading(true);
      try {
        const resp = await getWishlist({ cid });
        const items = (resp.items || []).map((i) => {
          const image = resolveProductImage(i);
          return {
            id: String(i.productId || i.itemId),
            productId: String(i.productId),
            name: i.productName || 'Product',
            price: `Nu ${Number(i.price ?? 0)}${i.unit ? `/${i.unit}` : ''}`,
            unit: i.unit || 'kg',
            stock: Number(i.stockQuantity ?? 0),
            image,
          }
        })
        setWishlist(items)
      } catch (e) {
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigation]);

  const removeItem = async (productId) => {
    const cid = getCurrentCid();
    if (!cid) {
      navigation.navigate("Login");
      return;
    }
    try {
      await removeFromWishlist({ productId, cid });
      setWishlist((prev) => prev.filter((it) => it.productId !== productId));
    } catch (e) {}
  };

  const handleAddToCart = async (productId) => {
    const cid = getCurrentCid();
    if (!cid) {
      navigation.navigate("Login");
      return;
    }
    try {
      await addToCart({ productId, quantity: 1, cid });
    } catch (e) {}
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Image */}
      <Image source={{ uri: item.image }} style={styles.image} />

      {/* Middle container for info and add button */}
      <View style={styles.contentContainer}>
        {/* Info Text */}
        <View>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.stock}>
            Stock: {item.stock} {item.unit === "bunch" ? item.unit : "Kg"}
          </Text>
        </View>

        {/* Add button (small and at the bottom) */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddToCart(item.productId)}
        >
          <Icon name="cart-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Delete button on the far right */}
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => removeItem(item.productId)}
      >
        <Icon name="delete-outline" size={22} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      {loading ? (
        <Text>Loading...</Text>
      ) : wishlist.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <FlatList
          data={wishlist}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
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
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    minHeight: 150,
    marginHorizontal: 4, // Added horizontal margin
  },
  image: {
    width: 110,
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111" },
  farmer: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  price: { fontSize: 15, fontWeight: "bold", color: "#059669", marginTop: 8 },
  deleteAction: {
    paddingTop: 0,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  addText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  stock: {
    fontSize: 12,
    fontWeight: "500",
    color: "green",
    marginTop: 6,
  },
});