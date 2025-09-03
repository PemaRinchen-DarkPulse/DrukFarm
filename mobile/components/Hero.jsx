import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import heroImage from '../assets/heroimage.jpg'; // adjust path
import { useNavigation } from '@react-navigation/native';

export default function Hero() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Image Section on Top */}
        <View style={styles.imageContainer}>
          <Image source={heroImage} style={styles.image} resizeMode="cover" />
        </View>

        {/* Text Section */}
        <Text style={styles.title}>
          Connecting Farmers to Markets in Bhutan
        </Text>
        <Text style={styles.subtitle}>
          DruKFarm connects Bhutanese farmers directly with urban consumers, restaurants, and hotels — fair prices, fresh produce, and traceable logistics.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.primaryButtonText}>Shop Now</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.outlineButton} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.outlineButtonText}>Join as Farmer</Text>
          </TouchableOpacity>
        </View>

        {/* Info Badge */}
        <View style={styles.infoBadge}>
          <Text style={styles.infoIcon}>🌱</Text>
          <Text style={styles.infoText}>
            Fresh from the valley — average delivery 24–48 hours
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb', // light background
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 38,
    marginBottom: 12,
    marginTop: 12, // add margin after the image
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  outlineButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243,244,246,0.8)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#111827',
    flexShrink: 1,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 12, // 👈 small margin at the very top
    marginBottom: 16, // space before text
  },
  image: {
    width: '100%',
    height: 240,
  },
});