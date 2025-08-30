import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const categories = [
  { id: 'veg', title: 'Vegetables', desc: 'Fresh leafy greens and root vegetables', count: '120+' },
  { id: 'fruits', title: 'Fruits', desc: 'Seasonal fruits and berries', count: '80+' },
  { id: 'grains', title: 'Grains & Rice', desc: 'Traditional rice varieties and cereals', count: '45+' },
];

export default function Categories(){
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Shop by Category</Text>
      <Text style={styles.sub}>Explore our wide range of fresh, locally sourced agricultural products</Text>

      <View style={styles.grid}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.card}>
            <Text style={styles.cardIcon}>🥕</Text>
            <Text style={styles.cardTitle}>{cat.title}</Text>
            <Text style={styles.cardDesc}>{cat.desc}</Text>
            <Text style={styles.cardBadge}>{cat.count} products</Text>
          </View>
        ))}
      </View>

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <Text style={styles.link}>Browse All Categories →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#065f46' },
  sub: { marginTop: 4, textAlign: 'center', color: '#065f46', opacity: 0.8 },
  grid: { marginTop: 12, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ecfdf5', padding: 16, alignItems: 'center' },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ecfdf5', textAlign: 'center', lineHeight: 48, marginBottom: 8, fontSize: 22 },
  cardTitle: { fontWeight: '700', color: '#065f46', marginBottom: 4 },
  cardDesc: { textAlign: 'center', color: '#64748b', marginBottom: 8 },
  cardBadge: { fontSize: 12, color: '#065f46', backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  link: { color: '#064e3b', fontWeight: '600' },
});
