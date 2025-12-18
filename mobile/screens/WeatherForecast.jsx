import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function WeatherForecast() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const requestLocationAccess = async () => {
    setLoading(true);
    
    // Simulate location request
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Location access granted! Weather data would be loaded here.');
    }, 2000);
  };

  const handleManualLocation = () => {
    // Navigate to manual location entry or show input
    Alert.alert('Manual Location', 'Manual location entry feature coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weather Forecast</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Map Image with Locating Overlay */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Icon name="map-marker" size={48} color="#9ca3af" />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
        </View>
        {loading && (
          <View style={styles.locatingOverlay}>
            <View style={styles.locatingBadge}>
              <ActivityIndicator size="small" color="#10b981" style={{ marginRight: 8 }} />
              <Text style={styles.locatingText}>LOCATING</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Finding your farm...</Text>
        <Text style={styles.description}>
          We need your location to provide accurate soil moisture and rainfall predictions for your crops.
        </Text>

        {/* Enable Location Button */}
        <TouchableOpacity
          style={styles.enableButton}
          onPress={requestLocationAccess}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Icon name="crosshairs-gps" size={20} color="#000000" style={{ marginRight: 8 }} />
          <Text style={styles.enableButtonText}>
            {loading ? 'Getting Location...' : 'Enable Location Access'}
          </Text>
        </TouchableOpacity>

        {/* Manual Entry Button */}
        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleManualLocation}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.manualButtonText}>Enter Location Manually</Text>
        </TouchableOpacity>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Icon name="lock" size={16} color="#10b981" style={{ marginRight: 8 }} />
          <Text style={styles.privacyText}>
            Your location data is private and only used for forecasts.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  locatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  manualButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#10b981',
    flex: 1,
    lineHeight: 16,
  },
});
