import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function EmptyCart() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Empty Cart Icon */}
      <Icon name="cart-off" size={70} color="#D1D5DB" style={styles.icon} />

      {/* Title */}
      <Text style={styles.title}>Your cart is empty</Text>

      {/* Description */}
      <Text style={styles.subtitle}>
        Looks like you haven't added anything to your cart yet. Let's find
        something fresh for you!
      </Text>

      {/* Browse Products Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Products")}
      >
        <Text style={styles.buttonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    // ❌ removed backgroundColor so it blends with the page
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 21,
  },
  button: {
    backgroundColor: "#065F46",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
