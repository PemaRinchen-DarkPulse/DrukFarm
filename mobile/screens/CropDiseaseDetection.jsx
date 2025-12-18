import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function CropDiseaseDetection() {
  const navigation = useNavigation();
  const [recentScans, setRecentScans] = useState([
    {
      id: 1,
      name: 'Corn Leaf Blight',
      date: 'Today, 10:30 AM',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200&h=200&fit=crop',
      status: 'RISK',
      statusColor: '#dc2626'
    },
    {
      id: 2,
      name: 'Tomato Plant',
      date: 'Yesterday',
      image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=200&h=200&fit=crop',
      status: 'HEALTHY',
      statusColor: '#22c55e'
    }
  ]);

  const handleTakePhoto = () => {
    Alert.alert('Camera', 'Opening camera to take photo...');
  };

  const handleSelectGallery = () => {
    Alert.alert('Gallery', 'Opening gallery to select photo...');
  };

  const handleViewAll = () => {
    console.log('View all scans');
  };

  const handleScanPress = (scan) => {
    console.log('View scan details:', scan.name);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check Crop Health</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Detect Crop Diseases</Text>
        <Text style={styles.heroDescription}>
          Take a clear photo of an affected leaf to get an instant diagnosis and treatment plan from our AI.
        </Text>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <View style={styles.tipCard}>
          <Icon name="white-balance-sunny" size={24} color="#22c55e" />
          <Text style={styles.tipText}>Good Lighting</Text>
        </View>
        <View style={styles.tipCard}>
          <Icon name="crop-free" size={24} color="#22c55e" />
          <Text style={styles.tipText}>Close Up</Text>
        </View>
        <View style={styles.tipCard}>
          <Icon name="hand-okay" size={24} color="#22c55e" />
          <Text style={styles.tipText}>Steady Hand</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.takePhotoButton}
          onPress={handleTakePhoto}
          activeOpacity={0.8}
        >
          <Icon name="camera" size={24} color="#000000" />
          <Text style={styles.takePhotoText}>Take a Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleSelectGallery}
          activeOpacity={0.7}
        >
          <Icon name="image" size={20} color="#111827" />
          <Text style={styles.galleryText}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Scans */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scansGrid}>
          {recentScans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={styles.scanCard}
              onPress={() => handleScanPress(scan)}
              activeOpacity={0.7}
            >
              <View style={styles.scanImageContainer}>
                <Image
                  source={{ uri: scan.image }}
                  style={styles.scanImage}
                  resizeMode="cover"
                />
                <View style={[styles.statusBadge, { backgroundColor: scan.statusColor }]}>
                  <Text style={styles.statusText}>{scan.status}</Text>
                </View>
              </View>
              <Text style={styles.scanName}>{scan.name}</Text>
              <Text style={styles.scanDate}>{scan.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          AI diagnosis is an estimation. Consult an expert for critical decisions.
        </Text>
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
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  tipsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  tipCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  takePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  galleryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  scansGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scanCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scanImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  scanName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    padding: 12,
    paddingBottom: 4,
  },
  scanDate: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  disclaimer: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
