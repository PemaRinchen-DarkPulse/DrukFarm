import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EmptyCart() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Empty Cart Icon */}
      <MaterialCommunityIcons name="cart-outline" size={64} color="#D1D5DB" />

      {/* Title */}
      <Text style={styles.title}>Your cart is empty</Text>

      {/* Description */}
      <Text style={styles.subtitle}>
        Add your first product to start shopping
      </Text>

      {/* Browse Products Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Products")}
      >
        <MaterialCommunityIcons name="plus" size={16} color="#fff" />
        <Text style={styles.buttonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});
