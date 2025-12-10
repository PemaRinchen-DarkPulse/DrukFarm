import React from "react";
import { View, Text, StyleSheet } from "react-native";

const testimonials = [
  {
    quote: "DruKFarm doubled my orders last season. Fair prices and fast payments.",
    author: "Tashi",
    role: "Farmer",
  },
  {
    quote: "I get fresher produce and I can order exactly what I need — no middleman.",
    author: "Sonam",
    role: "Restaurant",
  },
  {
    quote: "The app is easy to use and the delivery is surprisingly fast.",
    author: "Pema",
    role: "Vegetable Vendor",
  },
];

export default function Testimonials() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What Our Community Says</Text>
        <Text style={styles.subtitle}>
          Hear from farmers, restaurants, and vegetable vendors who trust DrukFarm
        </Text>
      </View>
      
      {testimonials.map((t, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.quote}>"{t.quote}"</Text>
          <Text style={styles.author}>— {t.author} ({t.role})</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // light gray background like web
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },
  quote: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#1f2937", // neutral dark gray
    marginBottom: 12,
    textAlign: "center",
  },
  author: {
    fontSize: 14,
    fontWeight: "500",
    color: "#065f46", // greenish (like web design)
    textAlign: "center",
  },
});
