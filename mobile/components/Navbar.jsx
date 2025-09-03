import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation();

  const navigateAndClose = (screenName) => {
    setMenuOpen(false);
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Logo Section */}
          <TouchableOpacity 
            style={styles.logoSection} 
            onPress={() => navigateAndClose('Home')}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>FD</Text>
              </View>
              <Text style={styles.appName}>DruKFarm</Text>
            </View>
          </TouchableOpacity>

          {/* Hamburger Menu */}
          <TouchableOpacity 
            style={styles.menuToggle} 
            onPress={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} color="#374151" /> : <Menu size={24} color="#374151" />}
          </TouchableOpacity>
        </View>

        {/* Mobile Menu */}
        {menuOpen && (
          <View style={styles.mobileMenu}>
            <ScrollView style={styles.menuScroll}>
              {['Home', 'Products', 'HowItWorks', 'About', 'Contact'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.menuItem}
                  onPress={() => navigateAndClose(item)}
                >
                  <Text style={styles.menuItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 3,
  },
  header: {
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
  },
  logoSection: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  menuToggle: {
    padding: 8,
  },
  mobileMenu: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 300,
  },
  menuScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
});
