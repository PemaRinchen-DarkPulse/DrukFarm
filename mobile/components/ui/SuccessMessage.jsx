import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCircle } from "lucide-react-native"; // modern success icon
import { useNavigation } from "@react-navigation/native";

export default function SuccessMessage({
  title = "Payout Details Saved!",
  message = "Your payout information has been updated successfully.",
  onDone,
}) {
  const navigation = useNavigation();

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Success Icon */}
        <View style={styles.iconBox}>
          <CheckCircle size={48} color="#10B981" strokeWidth={2.5} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Subtitle */}
        <Text style={styles.message}>{message}</Text>

        {/* Done Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={onDone || (() => navigation.goBack())}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)", // dimmed backdrop
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  iconBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 100,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
