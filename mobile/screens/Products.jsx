import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function Products({ navigation }) {
  const [products] = useState([
    {
      id: "1",
      name: "Organic Apples",
      farmer: "Farmer Tenzin",
      price: "Nu 250/kg",
      rating: 4.8,
      image:
        "https://www.pngall.com/wp-content/uploads/2016/04/Apple-PNG.png",
    },
    {
      id: "2",
      name: "Fresh Spinach",
      farmer: "Farmer Sonam",
      price: "Nu 120/bundle",
      rating: 4.9,
      image:
        "https://www.pngall.com/wp-content/uploads/2016/05/Spinach-PNG.png",
    },
    {
      id: "3",
      name: "Local Honey",
      farmer: "Farmer Pema",
      price: "Nu 500/bottle",
      rating: 5.0,
      image:
        "https://www.pngall.com/wp-content/uploads/2016/05/Honey-PNG.png",
    },
    {
      id: "4",
      name: "Free-Range Eggs",
      farmer: "Farmer Dorji",
      price: "Nu 200/dozen",
      rating: 4.7,
      image:
        "https://www.pngall.com/wp-content/uploads/2016/03/Eggs-PNG-Image.png",
    },
  ]);

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      {/* Product Image */}
      <Image source={{ uri: item.image }} style={styles.image} />
      {/* Wishlist Heart */}
      <TouchableOpacity style={styles.heartBtn}>
        <Icon name="heart-outline" size={20} color="#DC2626" />
      </TouchableOpacity>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.farmer}>{item.farmer}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <View style={styles.row}>
          <Icon name="star" size={14} color="#FBBF24" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
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
        <Text style={styles.headerTitle}>Fresh Produce</Text>
        <TouchableOpacity>
          <Icon name="magnify" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterBtn}>
          <Icon name="tune" size={16} color="#111827" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Category</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Price Range</Text>
        </TouchableOpacity>
      </View>

      {/* Results Info */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>Showing {products.length} results</Text>
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={styles.sortText}>Sort by: Newest</Text>
          <Icon name="chevron-down" size={16} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
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

  filters: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
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
  filterText: { fontSize: 13, fontWeight: "500", color: "#111827", marginLeft: 4 },

  resultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  resultsText: { fontSize: 13, color: "#6B7280" },
  sortBtn: { flexDirection: "row", alignItems: "center" },
  sortText: { fontSize: 13, fontWeight: "500", color: "#111827", marginRight: 4 },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
    position: "relative",
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    elevation: 2,
  },
  info: { gap: 2 },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
  farmer: { fontSize: 12, color: "#6B7280" },
  price: { fontSize: 13, fontWeight: "700", color: "#DC2626", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  rating: { fontSize: 12, color: "#111827", marginLeft: 2 },
});