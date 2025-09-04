import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";

function Stat({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function About({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* About Section */}
      <View style={styles.card}>
        <Text style={styles.title}>About DrukFarm</Text>
        <Text style={styles.paragraph}>
          DrukFarm connects Bhutanese farmers directly to local buyers and
          marketplaces. We make it easier to sell fresh produce, get fair
          prices, and build sustainable farm businesses through simple digital
          tools and community support.
        </Text>

        <View style={styles.statsRow}>
          <Stat label="Farmers supported" value="1,200+" />
          <Stat label="Produce categories" value="24" />
          <Stat label="Local partners" value="35" />
        </View>
      </View>

      {/* Mission & Vision */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            To empower smallholder farmers in Bhutan with simple, reliable
            digital tools and market access so they can increase incomes, reduce
            waste, and strengthen local food systems.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Our Vision</Text>
          <Text style={styles.paragraph}>
            A thriving, resilient Bhutanese agricultural sector where farmers
            receive fair prices and communities have access to fresh,
            locally-grown food year-round.
          </Text>
        </View>
      </View>

      {/* Values */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Our Values</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>
            • Community-first: we prioritize farmer and consumer needs.
          </Text>
          <Text style={styles.listItem}>
            • Transparency: fair pricing and clear processes.
          </Text>
          <Text style={styles.listItem}>
            • Sustainability: supporting practices that protect land and water.
          </Text>
          <Text style={styles.listItem}>
            • Simplicity: tools that are easy to use and maintain.
          </Text>
        </View>
      </View>

      {/* Team */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Meet the Team</Text>
        <View style={styles.teamMember}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() =>
              Linking.openURL("https://pemarinchen.vercel.app")
            }
          >
            <Text style={styles.avatarText}>PR</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>
              Pema Rinchen{" "}
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL("https://pemarinchen.vercel.app")
                }
              >
                Portfolio
              </Text>
            </Text>
            <Text style={styles.memberRole}>
              Founder · Developer · Operator
            </Text>
            <Text style={styles.memberDesc}>
              I build and run DrukFarm — from the product to partnerships — to
              help Bhutanese farmers reach local markets.
            </Text>
          </View>
        </View>
      </View>

      {/* Contact */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Get Involved / Contact</Text>
        <Text style={styles.paragraph}>
          Want to partner, buy produce, or learn how to list your farm? Reach
          out — we’re happy to help.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate("Contact")}
          >
            <Text style={styles.primaryButtonText}>Contact Us</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.outlineButtonText}>Register Your Farm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Last updated: August 2025</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0,122,255,0.08)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  row: {
    flexDirection: "column",
    gap: 12,
  },
  list: {
    marginTop: 8,
  },
  listItem: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  teamMember: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  memberName: {
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: "#007AFF",
    fontSize: 13,
  },
  memberRole: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  memberDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  outlineButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  footer: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
});
