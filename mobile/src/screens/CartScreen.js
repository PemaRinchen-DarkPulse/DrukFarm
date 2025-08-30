import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CartScreen(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart</Text>
      <Text>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
});
