import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or react-native-vector-icons

export default function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Last updated */}
        <Text style={styles.updatedText}>Last updated: October 26, 2023</Text>

        {/* Intro */}
        <Text style={styles.intro}>
          At DrukFarm, we are committed to protecting your privacy and ensuring
          the security of your personal information. This Privacy Policy
          outlines how we collect, use, and safeguard your data when you use our
          app.
        </Text>

        {/* Section 1 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={22} color="#22c55e" />
            <Text style={styles.cardTitle}>Information We Collect</Text>
          </View>
          <Text style={styles.cardText}>
            We collect information you provide directly, such as your name,
            contact details, and payment information. We also gather data
            automatically, including your device information and app usage
            patterns.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={22} color="#22c55e" />
            <Text style={styles.cardTitle}>How We Use Your Information</Text>
          </View>
          <Text style={styles.cardText}>
            Your information is used to facilitate transactions, improve our
            services, and communicate with you. We may also use your data for
            marketing purposes, with your consent.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={22} color="#22c55e" />
            <Text style={styles.cardTitle}>Data Security</Text>
          </View>
          <Text style={styles.cardText}>
            We employ industry-standard security measures to protect your data
            from unauthorized access, alteration, or disclosure. However, no
            method of transmission over the internet is completely secure.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-done-circle" size={22} color="#22c55e" />
            <Text style={styles.cardTitle}>Your Rights</Text>
          </View>
          <Text style={styles.cardText}>
            You have the right to access, correct, or delete your personal
            information. You can also opt-out of marketing communications at any
            time. Contact us at{" "}
            <Text style={styles.link}>privacy@drukfarm.bt</Text> for assistance.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="refresh-circle" size={22} color="#22c55e" />
            <Text style={styles.cardTitle}>Updates to This Policy</Text>
          </View>
          <Text style={styles.cardText}>
            We may update this Privacy Policy periodically. We will notify you
            of any significant changes by posting the new policy on our app and
            updating the effective date.
          </Text>
        </View>

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
  scrollView: {
    padding: 20,
  },
  updatedText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
    color: "#000",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
  },
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});
