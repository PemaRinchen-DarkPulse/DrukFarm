import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function Checkout({ navigation }) {
  const [paymentMethod, setPaymentMethod] = useState("mobile"); // default mobile
  const [journalNumber, setJournalNumber] = useState("");

  const subtotal = 970;
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Shipping Address */}
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Pema Choden</Text>
            <Text style={styles.address}>Changzamtog, Thimphu</Text>
            <Text style={styles.address}>Bhutan, 11001</Text>
            <Text style={styles.address}>+975 17XXXXXX</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.changeBtn}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>

        {/* Mobile Banking */}
        <TouchableOpacity
          style={[
            styles.card,
            paymentMethod === "mobile" && styles.cardSelected,
          ]}
          onPress={() => setPaymentMethod("mobile")}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon
              name={
                paymentMethod === "mobile" ? "radiobox-marked" : "radiobox-blank"
              }
              size={22}
              color="#DC2626"
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentTitle}>Mobile Banking</Text>
              <Text style={styles.paymentDesc}>
                Pay with mBoB or M-Pay.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Journal Number Field */}
        {paymentMethod === "mobile" && (
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Enter Journal Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12345678"
              value={journalNumber}
              onChangeText={setJournalNumber}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Cash on Delivery */}
        <TouchableOpacity
          style={[
            styles.card,
            paymentMethod === "cod" && styles.cardSelected,
          ]}
          onPress={() => setPaymentMethod("cod")}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon
              name={
                paymentMethod === "cod" ? "radiobox-marked" : "radiobox-blank"
              }
              size={22}
              color="#DC2626"
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.paymentDesc}>
                Pay with cash upon delivery.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal (3 items)</Text>
            <Text style={styles.value}>Nu. {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>Nu. {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Nu. {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <TouchableOpacity
        style={styles.placeOrderBtn}
        onPress={() => {
          if (paymentMethod === "mobile" && !journalNumber) {
            alert("Please enter your journal number.");
            return;
          }
          alert("Order placed successfully!");
        }}
      >
        <Text style={styles.placeOrderText}>Place Order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#111" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardSelected: { borderColor: "#DC2626", borderWidth: 2 },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  address: { fontSize: 13, color: "#374151", marginTop: 2 },
  changeBtn: { color: "#DC2626", fontWeight: "600" },

  paymentTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  paymentDesc: { fontSize: 13, color: "#6B7280" },

  inputBox: { marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 14, color: "#374151" },
  value: { fontSize: 14, fontWeight: "600", color: "#111" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#DC2626" },

  placeOrderBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
