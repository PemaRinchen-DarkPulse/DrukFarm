import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function MyOrders({ navigation }) {
  const orders = [
    { id: "1", status: "Delivered", orderId: "#1234567890", icon: "check-circle", color: "#22C55E" },
    { id: "2", status: "Shipped", orderId: "#9876543210", icon: "truck", color: "#3B82F6" },
    { id: "3", status: "Pending", orderId: "#1122334455", icon: "clock-outline", color: "#FACC15" },
    { id: "4", status: "Cancelled", orderId: "#5544332211", icon: "close-circle", color: "#EF4444" },
        { id: "5", status: "Out for Delivery", orderId: "#6677889900", icon: "bike", color: "#F97316" }, 
  ];

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.status, { color: item.color }]}>{item.status}</Text>
        <Text style={styles.orderId}>Order {item.orderId}</Text>
      </View>
      <Icon name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Order List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
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
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  status: { fontSize: 15, fontWeight: "700" },
  orderId: { fontSize: 13, color: "#6B7280", marginTop: 2 },
});
