import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute } from '@react-navigation/native';
import { getCurrentCid } from '../lib/auth';
import { getCart, cartCheckout, buyProduct, unifiedCheckout } from '../lib/api';

export default function Checkout({ navigation }) {
  const route = useRoute();
  // 1. Changed default payment method to 'cod'
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [journalNumber, setJournalNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // each: { id (cart item id), productId, name, price, quantity, unit }
  const [singleBuy, setSingleBuy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Initialize from navigation params
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sb = route?.params?.singleBuy;
        if (sb && route?.params?.product) {
          setSingleBuy(true);
          const p = route.params.product;
          // Add debugging to trace quantity values
          console.log('[Checkout] Single buy product received:', {
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            quantityType: typeof p.quantity,
            parsedQuantity: Number(p.quantity || 1),
          });
          const parsedQuantity = Number(p.quantity || 1);
          // Ensure quantity is valid (fallback to 1 if invalid)
          const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 1 ? parsedQuantity : 1;
          setItems([{ 
            id: p.id, 
            productId: p.id, 
            name: p.name, 
            price: Number(p.price||0), 
            unit: p.unit, 
            quantity: validQuantity 
          }]);
          setLoading(false);
          return;
        }
        // fallback to cart content
        const cid = getCurrentCid();
        if (!cid) { setItems([]); setLoading(false); return; }
        const resp = await getCart({ cid });
        console.log('[Checkout] Cart response:', resp?.cart?.items?.length, 'items');
        const mapped = (resp?.cart?.items || []).map(i => {
          const parsedQuantity = Number(i.quantity || 1);
          const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 1 ? parsedQuantity : 1;
          console.log('[Checkout] Cart item mapping:', {
            itemId: i.itemId,
            productId: i.productId,
            name: i.productName,
            originalQuantity: i.quantity,
            parsedQuantity,
            validQuantity
          });
          return {
            id: String(i.itemId||i.productId), 
            productId: String(i.productId), 
            name: i.productName, 
            price: Number(i.price||0), 
            unit: i.unit, 
            quantity: validQuantity 
          };
        });
        if (active) setItems(mapped);
      } catch (e) { if (active) setError(e?.message || 'Failed to load summary'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false };
  }, [route]);

  const { subtotal, deliveryFee, taxes, total, itemCount } = useMemo(() => {
    const sub = items.reduce((s, it) => s + (it.price * it.quantity), 0);
    const dlv = items.length ? 50 : 0;
    const tx = sub * 0.05;
    return { subtotal: sub, deliveryFee: dlv, taxes: tx, total: sub + dlv + tx, itemCount: items.reduce((s,i)=>s+i.quantity,0) };
  }, [items]);

  const handlePlaceOrder = async () => {
    if (placing) return;
    if (paymentMethod === 'mobile' && !journalNumber.trim()) { alert('Please enter your journal number.'); return; }
    
    console.log('[Checkout] Place order initiated with items:', items.map(it => ({
      id: it.id,
      productId: it.productId,
      quantity: it.quantity,
      quantityType: typeof it.quantity,
      isFinite: Number.isFinite(it.quantity)
    })));

    try {
      setPlacing(true);
      const cid = getCurrentCid();
      if (!cid) { navigation.navigate('Login'); return; }

      if (singleBuy && items[0]) {
        const prod = items[0];
        // Validate quantity before sending
        if (!Number.isFinite(prod.quantity) || prod.quantity < 1) {
          alert('Invalid quantity. Please try again.');
          return;
        }
        
        console.log('[Checkout] Single buy API call:', {
          productId: prod.productId || prod.id,
          quantity: prod.quantity,
          cid
        });
        
        const resp = await buyProduct({ 
          productId: prod.productId || prod.id, 
          quantity: prod.quantity, 
          cid 
        });
        console.log('[Checkout] Single buy response:', resp);
        alert('Order placed successfully!');
        navigation.navigate('Home');
        return;
      }

      // Build products payload from items for unified checkout (use productId)
      const products = items.map(it => {
        // Validate each item's quantity
        if (!Number.isFinite(it.quantity) || it.quantity < 1) {
          throw new Error(`Invalid quantity for product ${it.name}: ${it.quantity}`);
        }
        return {
          productId: it.productId || it.id, 
          quantity: it.quantity 
        };
      });

      console.log('[Checkout] Unified checkout API call:', {
        cid,
        products,
        totalPrice: total
      });

      const resp = await unifiedCheckout({ cid, products, totalPrice: total });
      console.log('[Checkout] Unified checkout response:', resp);
      alert('Orders placed successfully!');
      navigation.navigate('Home');
    } catch (e) {
      console.error('[Checkout] Order placement error:', e);
      const msg = e?.body?.error || e?.message || 'Failed to place order';
      alert(msg);
    } finally { setPlacing(false); }
  };

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
        {loading && <Text style={{ marginBottom: 12, color: '#6B7280' }}>Loading summary...</Text>}
        {!!error && !loading && <Text style={{ marginBottom: 12, color: '#DC2626' }}>{error}</Text>}
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

        {/* Mobile Banking - Disabled */}
        <TouchableOpacity
          disabled={true} // 2. Disabled the touch action
          style={[
            styles.card,
            styles.cardDisabled, // 3. Applied disabled visual style
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon
              name={"radiobox-blank"}
              size={22}
              color="#9CA3AF" // Grayed out icon
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.paymentTitle, styles.textDisabled]}>
                Mobile Banking
              </Text>
              <Text style={[styles.paymentDesc, styles.textDisabled]}>
                Pay with mBoB or M-Pay.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Journal Number Field - This will not show */}
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
            <Text style={styles.label}>Subtotal ({itemCount} {itemCount===1?'item':'items'})</Text>
            <Text style={styles.value}>Nu. {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>Nu. {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Taxes (5%)</Text>
            <Text style={styles.value}>Nu. {taxes.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Nu. {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Place Order Button - MOVED INSIDE SCROLLVIEW */}
        <TouchableOpacity
          style={[styles.placeOrderBtn, placing && { opacity: 0.6 }]}
          disabled={placing || loading || !items.length}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderText}>{placing ? 'Placing...' : 'Place Order'}</Text>
        </TouchableOpacity>
      </ScrollView>
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardSelected: { borderColor: "#DC2626", borderWidth: 2 },
  // 4. Added new styles for the disabled look
  cardDisabled: {
    backgroundColor: "#F3F4F6",
  },
  textDisabled: {
    color: "#9CA3AF",
  },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  address: { fontSize: 13, color: "#374151", marginTop: 2 },
  changeBtn: { color: "#DC2626", fontWeight: "600" },

  paymentTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  paymentDesc: { fontSize: 13, color: "#6B7280" },

  inputBox: { marginBottom: 12 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
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
    // Added a bottom margin for better spacing when scrolling
    marginBottom: 16,
  },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});