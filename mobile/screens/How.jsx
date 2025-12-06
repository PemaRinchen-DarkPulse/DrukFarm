import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
} from "react-native";
import { Truck, ShoppingCart, UserCheck, Box } from "lucide-react-native";

const steps = [
  {
    icon: UserCheck,
    title: "Sign up & create profile",
    desc: "Farmers, restaurants and vegetable vendors create accounts and set preferences.",
  },
  {
    icon: Box,
    title: "Create listings",
    desc: "Farmers list produce with photos, availability, and prices.",
  },
  {
    icon: ShoppingCart,
    title: "Browse & order",
    desc: "Buyers browse listings, place orders and communicate with sellers.",
  },
  {
    icon: Truck,
    title: "Delivery & pickup",
    desc: "Arrange pickup or local delivery using our logistics partners.",
  },
];

export default function How() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>How DrukFarm Works</Text>
        <Text style={styles.subtitle}>
          A simple, transparent way to connect local farmers with buyers —
          efficient, fair, and sustainable.
        </Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <View key={idx} style={styles.stepCard}>
              <View style={styles.iconWrapper}>
                <Icon color="#047857" size={24} />
              </View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          );
        })}
      </View>

      {/* Farmers & Buyers Sections */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>For Farmers</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • List your harvest with clear photos and quantities.
            </Text>
            <Text style={styles.listItem}>
              • Set prices and available pickup/delivery times.
            </Text>
            <Text style={styles.listItem}>
              • Accept orders, communicate with buyers, and manage inventory.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            For Buyers (Vegetable Vendors, Restaurants, Hotels)
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Discover fresh, local produce from nearby farms.
            </Text>
            <Text style={styles.listItem}>
              • Order in small or bulk quantities with simple payment options.
            </Text>
            <Text style={styles.listItem}>
              • Rate sellers and track order history for better sourcing.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
    textAlign: "center",
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  stepDesc: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  list: {
    marginLeft: 4,
  },
  listItem: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },
});
