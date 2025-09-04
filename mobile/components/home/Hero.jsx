import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import heroImage from '../../assets/heroimage.jpg'; // adjust path
import { useNavigation } from '@react-navigation/native';

export default function Hero() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Background Image with overlay */}
      <ImageBackground source={heroImage} style={styles.image} imageStyle={{ borderRadius: 16 }}>
        <View style={styles.overlay} />

        {/* Text on top of image */}
        <View style={styles.content}>
          <Text style={styles.title}>Fresh from the Highlands</Text>
          <Text style={styles.subtitle}>
            Discover authentic Bhutanese produce.
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
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 240,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)', // dark overlay for readability
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#f3f4f6',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  outlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
