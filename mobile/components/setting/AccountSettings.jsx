import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function AccountSettings({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Profile */}
        <View style={styles.profile}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/4140/4140037.png",
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>Sonam Wangmo</Text>
          <Text style={styles.email}>sonam.wangmo@email.com</Text>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Personal Information</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Address Book</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Payouts</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* My Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY ACTIVITY</Text>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Order History</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowText}>Wishlist</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')}>
            <Text style={styles.rowText}>About Us</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.rowText}>Contact</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Help Center')}>
            <Text style={styles.rowText}>Help Center</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Terms of Service')}>
            <Text style={styles.rowText}>Terms of Service</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Privacy Policy')}>
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Farmer Guide')}>
            <Text style={styles.rowText}>Farmer Guide</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },

  profile: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  email: { fontSize: 14, color: "#6B7280", marginTop: 2 },

  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowText: { fontSize: 14, fontWeight: "500", color: "#111827" },
});
