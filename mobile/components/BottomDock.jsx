// BottomDock.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function BottomDock() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[
        styles.safeArea,
        insets.bottom ? { paddingBottom: insets.bottom, marginBottom: -insets.bottom } : null,
      ]}
    >
      <View style={[styles.bottomNav, { paddingBottom: 8 }]}>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="home-outline" size={28} color="#1B4332" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="cart-outline" size={28} color="#1B4332" />
          <Text style={styles.navText}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Icon name="qrcode-scan" size={28} color="#1B4332" />
          <Text style={styles.navText}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Orders')}
        >
          <Icon name="clipboard-list-outline" size={28} color="#1B4332" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Login')}
        >
          <Icon name="account-outline" size={28} color="#1B4332" />
          <Text style={styles.navText}>Login</Text>
        </TouchableOpacity>

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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
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
});
