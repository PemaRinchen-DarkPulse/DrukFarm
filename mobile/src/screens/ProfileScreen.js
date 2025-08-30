import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen(){
  const nav = useNavigation();
  const logout = async () => {
    try { await AsyncStorage.multiRemove(['currentUser','cid','CID','token','accessToken']); } catch {}
    nav.navigate('Login');
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.btn} onPress={logout}><Text style={styles.btnText}>Sign out</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  btn: { marginTop: 12, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
