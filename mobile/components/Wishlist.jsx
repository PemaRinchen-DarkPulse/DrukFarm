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

export default function Wishlist({ navigation }) {
  const [wishlist, setWishlist] = useState([
    {
      id: "1",
      name: "Organic Red Rice",
      farmer: "From Tashi's Farm",
      price: "Nu. 150/kg",
      image: "https://www.pngall.com/wp-content/uploads/2016/04/Rice-PNG.png",
    },
    {
      id: "2",
      name: "Fresh Apples",
      farmer: "From Dema's Orchard",
      price: "Nu. 120/kg",
      image: "https://www.pngall.com/wp-content/uploads/2016/04/Apple-PNG.png",
    },
    {
      id: "3",
      name: "Organic Spinach",
      farmer: "From Pema's Garden",
      price: "Nu. 80/bunch",
      image: "https://www.pngall.com/wp-content/uploads/2016/05/Spinach-PNG.png",
    },
  ]);

  const removeItem = (id) => {
    setWishlist(wishlist.filter((item) => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Image */}
      <Image source={{ uri: item.image }} style={styles.image} />

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.farmer}>{item.farmer}</Text>
        <Text style={styles.price}>{item.price}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.addBtn}>
          <Icon name="cart-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeItem(item.id)}>
          <Icon name="delete-outline" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>
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
      <FlatList
        data={wishlist}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
  farmer: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  price: { fontSize: 13, fontWeight: "700", color: "#059669", marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  addText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 },
});