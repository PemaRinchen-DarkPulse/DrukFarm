import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function Cart({ navigation }) {
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "Organic Red Rice",
      desc: "1kg",
      price: 180,
      quantity: 2,
      image: "https://img.freepik.com/free-photo/red-rice-bowl_1150-18279.jpg",
    },
    {
      id: "2",
      name: "Fresh Shiitake Mushrooms",
      desc: "500g",
      price: 250,
      quantity: 1,
      image: "https://img.freepik.com/free-photo/fresh-shiitake-mushrooms_1203-4356.jpg",
    },
    {
      id: "3",
      name: "Asparagus",
      desc: "1 bunch",
      price: 120,
      quantity: 3,
      image: "https://img.freepik.com/free-photo/fresh-asparagus_1339-1121.jpg",
    },
  ]);

  const incrementQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 50;
  const taxes = subtotal * 0.05;
  const total = subtotal + deliveryFee + taxes;

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDesc}>{item.desc}</Text>
        <Text style={styles.itemPrice}>Nu. {item.price}</Text>
      </View>

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
  );

  const renderFooter = () => (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>Order Summary</Text>
      <View style={styles.row}>
        <Text style={styles.label}>
          Subtotal ({cartItems.length} items)
        </Text>
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
        contentContainerStyle={{ paddingBottom: 40, paddingRight: 8 }} // 👈 Added right padding
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
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
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  image: { width: 60, height: 60, borderRadius: 8 },
  itemName: { fontSize: 14, fontWeight: "700", color: "#111" },
  itemDesc: { fontSize: 12, color: "#6B7280" },
  itemPrice: { fontSize: 13, fontWeight: "600", color: "#DC2626", marginTop: 4 },

  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtn: { padding: 6 },
  qtyBtnText: { fontSize: 16, fontWeight: "600", color: "#111" },
  qtyText: { fontSize: 14, fontWeight: "600", marginHorizontal: 6 },

  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#111" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
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
