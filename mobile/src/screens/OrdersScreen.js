import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OrdersScreen(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <Text>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
});
