import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomDock(){
  const nav = useNavigation();
  const { user, cartCount } = useApp();
  const route = useRoute();
  const isActive = (name) => (route.name === name);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(12, insets.bottom) }]}>
      <View style={[styles.row, { gridTemplateColumns: user ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)'}]}>
        <View style={styles.cell}>
          <TouchableOpacity style={styles.btn} onPress={()=> nav.navigate('Root', { screen: 'Cart' })}>
            <Ionicons name="cart-outline" size={24} color={isActive('Cart') ? '#111827' : '#334155'} />
            <Text style={styles.caption}>Cart</Text>
            {cartCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        {user ? (
          <View style={styles.cell}>
            <TouchableOpacity style={styles.btn} onPress={()=> nav.navigate('Root', { screen: 'Orders' })}>
              <Ionicons name="cube-outline" size={24} color={isActive('Orders') ? '#111827' : '#334155'} />
              <Text style={styles.caption}>Orders</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.cell}>
          <TouchableOpacity style={styles.btn} onPress={()=> nav.navigate('Root', { screen: 'Scan' })}>
            <Ionicons name="qr-code-outline" size={24} color={isActive('Scan') ? '#111827' : '#334155'} />
            <Text style={styles.caption}>Scan</Text>
          </TouchableOpacity>
        </View>

        {user ? (
          <View style={styles.cell}>
            <TouchableOpacity style={styles.btn} onPress={()=> nav.navigate('Root', { screen: 'Profile' })}>
              <Ionicons name="person-circle-outline" size={24} color={isActive('Profile') ? '#111827' : '#334155'} />
              <Text style={styles.caption}>Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cell}>
            <TouchableOpacity style={styles.btn} onPress={()=> nav.navigate('Login')}>
              <Ionicons name="person-circle-outline" size={24} color={'#334155'} />
              <Text style={styles.caption}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {user ? (
          <View style={styles.cell}>
            <TouchableOpacity style={styles.btn} onPress={()=> nav.navigate('Login')}>
              <Ionicons name="log-out-outline" size={24} color={'#334155'} />
              <Text style={styles.caption}>Sign out</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  row: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { alignItems: 'center', justifyContent: 'center' },
  caption: { fontSize: 11, color: '#334155', marginTop: 4 },
  badge: { position: 'absolute', top: -6, right: -12, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11 },
});
