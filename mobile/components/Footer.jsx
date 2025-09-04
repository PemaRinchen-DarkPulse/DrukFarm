import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Mail, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Footer() {
  const navigation = useNavigation();

  return (
    <View style={styles.footer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand / About */}
        <View style={styles.section}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>FD</Text>
            </View>
            <Text style={styles.brand}>DruKFarm</Text>
          </View>
          <Text style={styles.heading}>About</Text>
          <Text style={styles.body}>
            Connecting Bhutanese farmers directly with urban consumers,
            restaurants, and hotels. Fresh, local, sustainable.
          </Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.heading}>Quick Links</Text>

          <TouchableOpacity onPress={() => navigation.navigate("Products")}>
            <Text style={styles.link}>Browse Products</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.link}>Sell Your Crops</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("About")}>
            <Text style={styles.link}>About Us</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.link}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("How It Works")}>
            <Text style={styles.link}>How It Works</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.heading}>Support</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.link}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.link}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.link}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.link}>Farmer's Guide</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.heading}>Contact Us</Text>
          <View style={styles.row}>
            <MapPin size={16} color="#fff" />
            <Text style={styles.body}>Thimphu, Bhutan</Text>
          </View>
          <View style={styles.row}>
            <Mail size={16} color="#fff" />
            <Text style={styles.body}>contact@drukfarm.bt</Text>
          </View>
          <View style={styles.row}>
            <Phone size={16} color="#fff" />
            <Text style={styles.body}>+975 1234 5678</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom note */}
        <Text style={styles.note}>
          © {new Date().getFullYear()} DruKFarm. All rights reserved. Made with ❤ in Bhutan.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#065F46',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  container: { flexGrow: 1 },
  section: { marginBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoBox: {
    height: 40, width: 40, borderRadius: 8, backgroundColor: '#047857',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: 'bold', color: '#fff' },
  brand: { marginLeft: 8, fontSize: 18, fontWeight: '600', color: '#fff' },
  heading: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 6 },
  body: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  link: {
    fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 6,
    textDecorationLine: 'underline',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  note: { fontSize: 12, textAlign: 'center', color: 'rgba(255,255,255,0.9)' },
});
