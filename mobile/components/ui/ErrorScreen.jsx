import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle } from "lucide-react-native"; // modern warning icon
import { useNavigation } from "@react-navigation/native";

export default function ErrorScreen({ message = "We encountered an unexpected issue. Please try again or return to the home screen." }) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <AlertCircle size={48} color="#111" strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Oops! Something went wrong</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  iconBox: {
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 100,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
});
