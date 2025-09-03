import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const features = [
  { title: 'Direct Crop Listings', desc: 'Farmers can list produce directly with photos, harvest date, and price.', icon: '🌾' },
  { title: 'Online Ordering', desc: 'Restaurants and consumers place orders online with delivery options.', icon: '🛒' },
  { title: 'Logistics Tracking', desc: 'Realtime tracking of shipments from farm to doorstep.', icon: '📦' },
  { title: 'Secure Payments', desc: 'Integrated secure payments with receipts and refunds.', icon: '🔒' },
  { title: 'SMS Order Support', desc: 'Orders and confirmations via SMS for low-connectivity areas.', icon: '📩' },
];

export default function Features() {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Platform features</Text>
      <Text style={styles.subheading}>
        All tools farmers and buyers need to transact directly and efficiently.
      </Text>

      <FlatList
        data={features}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ecfdf5', // light green bg like your design
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  iconWrapper: {
    backgroundColor: '#d1fae5', // soft green
    height: 56,
    width: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 26,
    color: '#047857', // dark green
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
});
