import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CTASection(){
  return (
    <LinearGradient colors={["#10b981", "#059669", "#047857"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.title}>Ready to grow with DruKFarm?</Text>
        <Text style={styles.sub}>Sign up as a buyer or farmer and start connecting today.</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnLight}><Text style={styles.btnLightText}>Sign up — it's free</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost}><Text style={styles.btnGhostText}>Download App</Text></TouchableOpacity>
        </View>
      </View>
      {/* decorative divider omitted on mobile */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, borderRadius: 0, paddingVertical: 20, marginHorizontal: -16 },
  inner: { marginHorizontal: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 6 },
  row: { marginTop: 12, flexDirection: 'column', gap: 8 },
  btnLight: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnLightText: { color: '#047857', fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnGhostText: { color: '#fff', fontWeight: '600' },
});
