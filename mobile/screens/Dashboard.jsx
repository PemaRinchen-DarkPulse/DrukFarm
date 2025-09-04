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

export default function Dashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState("Products");

  const products = [
    {
      id: "1",
      category: "Vegetables",
      name: "Organic Spinach",
      description: "Freshly harvested, 500g",
      price: 150,
      stock: true,
      image:
        "https://www.pngall.com/wp-content/uploads/2016/05/Spinach-PNG.png",
    },
    {
      id: "2",
      category: "Fruits",
      name: "Red Apples",
      description: "Locally grown, 1kg",
      price: 120,
      stock: true,
      image: "https://www.pngall.com/wp-content/uploads/2016/04/Apple-PNG.png",
    },
    {
      id: "3",
      category: "Dairy",
      name: "Yak Cheese",
      description: "Traditional, 200g",
      price: 250,
      stock: false,
      image: "https://www.pngall.com/wp-content/uploads/2016/05/Cheese-PNG.png",
    },
  ];

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.row}>
          <Text style={styles.price}>Nu.{item.price}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: item.stock ? "#DCFCE7" : "#FEE2E2" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: item.stock ? "#16A34A" : "#DC2626" },
              ]}
            >
              {item.stock ? "In Stock" : "Out of Stock"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Products":
        return (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Products</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        );

      case "Orders":
        return (
          <View style={styles.placeholder}>
            <Icon name="cart-outline" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>No orders yet.</Text>
          </View>
        );

      case "Stats":
        return (
          <View style={styles.placeholder}>
            <Icon name="chart-line" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>Your sales stats will show here.</Text>
          </View>
        );

      case "Settings":
        return (
          <View style={styles.placeholder}>
            <Icon name="cog-outline" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>Manage your settings here.</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Dashboard</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
  {["Stats", "Products", "Orders", "Settings"].map((tab) => (
    <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
      <Text
        style={[
          styles.tab,
          activeTab === tab && styles.activeTab,
        ]}
      >
        {tab}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Dynamic Content */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 12,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tab: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    paddingBottom: 4,
  },
  activeTab: {
    color: "#DC2626",
    borderBottomWidth: 2,
    borderBottomColor: "#DC2626",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  card: {
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
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  category: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  desc: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
});
