import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Navbar() {
  const navigation = useNavigation();

  const navigateToCart = () => {
    navigation.navigate('Cart'); // replace with your cart screen name
  };

  const navigateHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        {/* Logo */}
        <TouchableOpacity 
          style={styles.logoSection} 
          onPress={navigateHome}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FD</Text>
          </View>
        </TouchableOpacity>

        {/* Cart Icon */}
        <TouchableOpacity 
          style={styles.cartIcon} 
          onPress={navigateToCart}
        >
          <ShoppingCart size={24} color="#374151" />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
  },
  logoSection: {
    width: 40,
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
  cartIcon: {
    width: 40,
    alignItems: 'flex-end',
  },
});