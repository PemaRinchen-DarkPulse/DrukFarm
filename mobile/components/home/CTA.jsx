import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CTA() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Ready to grow with DruKFarm?</Text>
        <Text style={styles.subText}>
          Sign up as a buyer or farmer and start connecting today.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.primary]}>
            <Text style={styles.primaryText}>Sign up — it's free</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.outline]}>
            <Text style={styles.outlineText}>Download App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50', // solid green instead of gradient
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  buttons: {
    marginTop: 16,
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#fff',
  },
  primaryText: {
    color: '#065F46',
    fontWeight: '600',
  },
  outline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: '#fff',
    fontWeight: '500',
  },
});
