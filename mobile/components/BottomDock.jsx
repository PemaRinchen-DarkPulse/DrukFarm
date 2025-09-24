// BottomDock.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser, onAuthChange } from '../lib/auth';

export default function BottomDock() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const off = onAuthChange(setUser);
    return off;
  }, []);

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[
        styles.safeArea,
        insets.bottom ? { paddingBottom: insets.bottom, marginBottom: -insets.bottom } : null,
      ]}
    >
      <View style={[styles.bottomNav, { paddingBottom: 8 }]}>

        {/* Left side */}
        <View style={styles.sideGroup}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialCommunityIcons name="home-outline" size={28} color="#1B4332" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialCommunityIcons name="cart-outline" size={28} color="#1B4332" />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>
        </View>

        {/* Center Scanner */}
        <TouchableOpacity 
          style={styles.centerButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={36} color="#fff" />
        </TouchableOpacity>

        {/* Right side */}
        <View style={styles.sideGroup}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('My Orders')}
          >
            <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#1B4332" />
            <Text style={styles.navText}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate(user ? 'Account Settings' : 'Login')}
          >
            <Feather name="user" size={28} color="#1B4332" /> 
            <Text style={styles.navText}>{user ? 'Profile' : 'Login'}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  sideGroup: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#1B4332',
    marginTop: 4,
    fontWeight: '500',
  },
  centerButton: {
    backgroundColor: '#1B4332',
    borderRadius: 40,
    padding: 16,
    marginBottom: 20, // lifts it up like a floating button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
