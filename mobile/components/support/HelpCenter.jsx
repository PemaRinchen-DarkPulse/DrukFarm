import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function HelpCenter({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="magnify" size={20} color="#9ca3af" />
        <TextInput
          placeholder="Search for help"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>

      {/* Popular Topics */}
      <Text style={styles.sectionTitle}>Popular topics</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.topicCard}>
          <Icon name="truck-delivery-outline" size={28} color="#10B981" />
          <Text style={styles.topicText}>Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topicCard}>
          <Icon name="cube-outline" size={28} color="#10B981" />
          <Text style={styles.topicText}>Returns</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topicCard}>
          <Icon name="credit-card-outline" size={28} color="#10B981" />
          <Text style={styles.topicText}>Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topicCard}>
          <Icon name="help-circle-outline" size={28} color="#10B981" />
          <Text style={styles.topicText}>Other</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Us */}
      <Text style={styles.sectionTitle}>Contact us</Text>
      <TouchableOpacity style={styles.contactCard}>
        <View style={styles.contactLeft}>
          <Icon name="email-outline" size={26} color="#10B981" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactSubtitle}>
              Response time: 1-2 business days
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={22} color="#6B7280" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactCard}>
        <View style={styles.contactLeft}>
          <Icon name="phone-outline" size={26} color="#10B981" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.contactTitle}>Phone</Text>
            <Text style={styles.contactSubtitle}>
              Response time: 1-2 business days
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={22} color="#6B7280" />
      </TouchableOpacity>
    </ScrollView>
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

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", marginLeft: 8 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  topicCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  topicText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactLeft: { flexDirection: "row", alignItems: "center" },
  contactTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  contactSubtitle: { fontSize: 12, color: "#6B7280" },
});