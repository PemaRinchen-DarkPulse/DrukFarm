import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native"; // modern heart icon
import { useNavigation } from "@react-navigation/native";

export default function EmptyWishlist() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <Heart size={48} color="#10B981" strokeWidth={2.5} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Your Wishlist is Empty</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Looks like you haven't added anything yet.{"\n"}
        Let's change that!
      </Text>

      {/* Explore Products Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Products")}
      >
        <Text style={styles.buttonText}>Explore Products</Text>
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
    backgroundColor: "#fff",
  },
  iconBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 100,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#10B981", // bright green CTA
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
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
