import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <View style={styles.logo}><Text style={styles.logoText}>FD</Text></View>
        <Text style={styles.brand}>DruKFarm</Text>
      </View>
      <Text style={styles.about}>Connecting Bhutanese farmers directly with urban consumers, restaurants, and hotels. Fresh, local, sustainable.</Text>

      <View style={styles.linksRow}>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Quick Links</Text>
          <Text style={styles.link}>Browse Products</Text>
          <Text style={styles.link}>Sell Your Crops</Text>
          <Text style={styles.link}>About Us</Text>
          <Text style={styles.link}>Contact</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Support</Text>
          <Text style={styles.link}>Help Center</Text>
          <Text style={styles.link}>Terms of Service</Text>
          <Text style={styles.link}>Privacy Policy</Text>
          <Text style={styles.link}>Farmer's Guide</Text>
        </View>
      </View>

      <View style={styles.copyRow}>
        <Text style={styles.copy}>© {year} DruKFarm. All rights reserved. Made with ♥ in Bhutan.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#047857', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28, marginTop: 24, marginHorizontal: -16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '800' },
  brand: { color: '#e7fff6', fontSize: 18, fontWeight: '700' },
  about: { color: 'rgba(231,255,246,0.9)', marginTop: 8 },
  linksRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  col: { flex: 1 },
  colTitle: { color: '#e7fff6', fontWeight: '700', marginBottom: 8 },
  link: { color: 'rgba(231,255,246,0.9)', marginBottom: 6 },
  copyRow: { alignItems: 'center', marginTop: 16 },
  copy: { color: 'rgba(231,255,246,0.9)' },
});
