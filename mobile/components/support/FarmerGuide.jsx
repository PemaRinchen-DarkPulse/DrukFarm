import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or react-native-vector-icons

export default function FarmerGuide({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Guide</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          placeholder="Search for topics"
          placeholderTextColor="#999"
          style={styles.searchInput}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section 1 */}
        <Text style={styles.sectionHeader}>Listing Your Products</Text>
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="list" size={20} color="#000" />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Product Listing Guidelines</Text>
              <Text style={styles.cardSubtitle}>
                Learn how to create compelling product listings
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="pricetag" size={20} color="#000" />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Best Practices for Selling</Text>
              <Text style={styles.cardSubtitle}>
                Tips for attracting buyers and maximizing sales
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Section 2 */}
        <Text style={styles.sectionHeader}>Managing Orders</Text>
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="cube" size={20} color="#000" />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Order Fulfillment Process</Text>
              <Text style={styles.cardSubtitle}>
                Step-by-step instructions for fulfilling orders
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="cash" size={20} color="#000" />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Payout Procedures</Text>
              <Text style={styles.cardSubtitle}>
                How and when you receive payments
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Section 3 */}
        <Text style={styles.sectionHeader}>Help & Support</Text>
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="help-circle" size={20} color="#000" />
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Farmer FAQs</Text>
              <Text style={styles.cardSubtitle}>
                Answers to common questions from farmers
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    color: "#000",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    margin: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    color: "#000",
  },
  scrollView: {
    paddingHorizontal: 15,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    color: "#444",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardTextBox: {
    marginLeft: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});