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
import EmptyCart from "../components/EmptyCart";
import { getCurrentCid } from "../lib/auth";
import { getCart, updateCartItem, removeCartItem } from "../lib/api";
import { resolveProductImage } from '../lib/image';

export default function Cart({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map API cart shape to existing UI item shape without changing layout
  const mapApiCartToUiItems = (apiCart) => {
    const items = Array.isArray(apiCart?.items) ? apiCart.items : [];
    return items.map(i => {
      const image = resolveProductImage(i);
      return {
        id: String(i.itemId || i.productId || Math.random()),
        itemId: String(i.itemId || ''),
        name: i.productName || '',
        price: Number(i.price || 0),
        unit: i.unit || 'kg',
        stock: Number(i.stockQuantity || 0),
        quantity: Number(i.quantity || 1),
        image,
      }
    })
  }

  const loadCart = async () => {
    try {
      setLoading(true);
      const cid = getCurrentCid();
      // If no CID, treat as empty cart without breaking layout
      if (!cid) {
        setCartItems([]);
        return;
      }
      const resp = await getCart({ cid });
      const next = mapApiCartToUiItems(resp?.cart);
      setCartItems(next);
    } catch (e) {
      // On failure, keep layout intact and show empty
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadCart();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const incrementQty = async (id) => {
    const current = cartItems.find((i) => i.id === id);
    if (!current) return;
    const cid = getCurrentCid();
    // Update backend first to avoid desync
    try {
      const resp = await updateCartItem({
        itemId: current.itemId || id,
        quantity: current.quantity + 1,
        cid,
      });
      const next = mapApiCartToUiItems(resp?.cart);
      setCartItems(next);
    } catch (e) {
      // no-op: preserve layout and existing values
    }
  };

  const decrementQty = async (id) => {
    const current = cartItems.find((i) => i.id === id);
    if (!current) return;
    if (current.quantity <= 1) return;
    const cid = getCurrentCid();
    try {
      const resp = await updateCartItem({
        itemId: current.itemId || id,
        quantity: current.quantity - 1,
        cid,
      });
      const next = mapApiCartToUiItems(resp?.cart);
      setCartItems(next);
    } catch (e) {
      // no-op
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 50;
  const taxes = subtotal * 0.05;
  const total = subtotal + deliveryFee + taxes;

  const renderItem = ({ item }) => {
    // Logic to display price consistently (e.g., price per kg)
    let displayPrice = item.price;
    let displayUnit = item.unit;

    if (item.unit === "g") {
      displayPrice = (item.price / 500) * 1000; // Calculate price per 1000g (1kg)
      displayUnit = "kg";
    }

    return (
      <View style={styles.itemCard}>
        {/* Left Column for Image and Quantity Controls */}
        <View style={styles.leftColumn}>
          <Image
            source={
              item.image
                ? { uri: item.image }
                : require("../assets/heroimage.jpg")
            }
            style={styles.image}
          />
          <View style={styles.qtyBox}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => decrementQty(item.id)}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => incrementQty(item.id)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Column for Details and Delete Button */}
        <View style={styles.rightColumn}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPriceUnit}>
              Nu. {displayPrice.toFixed(0)}/{displayUnit}
            </Text>
            <Text style={styles.itemStock}>
              Stock: {item.stock}{" "}
              {displayUnit === "bunch" ? item.unit : "Kg"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={async () => {
              const cid = getCurrentCid();
              try {
                const resp = await removeCartItem({
                  itemId: item.itemId || item.id,
                  cid,
                });
                const next = mapApiCartToUiItems(resp?.cart);
                setCartItems(next);
              } catch (e) {
                // no-op
              }
            }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>Order Summary</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal ({cartItems.length} items)</Text>
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

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => navigation.navigate("Checkout")}
      >
        <Text style={styles.nextBtnText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Icon name="delete-outline" size={22} color="#111" />
      </View>

      {/* Cart Items + Summary */}
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          cartItems.length
            ? { paddingBottom: 40, paddingRight: 8 }
            : { flexGrow: 1, justifyContent: "center", alignItems: "center" }
        }
        ListFooterComponent={cartItems.length ? renderFooter : null}
        ListEmptyComponent={!loading ? <EmptyCart /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  itemCard: {
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
    marginLeft: 4, // Added a small left margin
  },
  leftColumn: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightColumn: {
    flex: 1,
    marginLeft: 20, // Increased space from 16 to 20
    justifyContent: "space-between",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemName: { fontSize: 17, fontWeight: "700", color: "#111" },
  itemPriceUnit: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#6B7280",
    marginTop: 2,
  },
  itemStock: {
    fontSize: 14,
    fontWeight: "500",
    color: "green",
    marginTop: 2,
  },

  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qtyBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtnText: { fontSize: 16, fontWeight: "600", color: "#111" },
  qtyText: { fontSize: 14, fontWeight: "600", marginHorizontal: 10 },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  deleteText: { fontSize: 13, color: "#DC2626", fontWeight: "600" },

  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 14, color: "#374151" },
  value: { fontSize: 14, fontWeight: "600", color: "#111" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#DC2626" },

  nextBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});