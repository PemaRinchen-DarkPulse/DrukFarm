import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function CropRecommendation() {
  const navigation = useNavigation();
  const [selectedCrop, setSelectedCrop] = useState(null);

  const analysisContext = {
    season: 'Spring 2024',
    soilType: 'Loamy, Nitrogen-Rich',
    region: 'Bhutan'
  };

  const topRecommendation = {
    id: 1,
    name: 'Sweet Corn',
    scientificName: 'Zea mays var. saccharata',
    match: 98,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
    description: 'High demand expected in Q3 due to regional shortages. Optimal for your nitrogen-rich soil profile.',
    yield: {
      value: 4.5,
      unit: 't/ac',
      trend: '+12% Avg'
    },
    waterReq: {
      level: 'Moderate',
      details: '~22 inches/season'
    },
    riskLevel: {
      level: 'Low',
      status: 'Pest resistant'
    }
  };

  const otherCrops = [
    {
      id: 2,
      name: 'Soybeans',
      description: 'Good nitrogen fixer. Market price stable. Requires less irrigation...',
      match: 85,
      image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=100&h=100&fit=crop',
      waterReq: 'High',
      riskLevel: 'Low'
    },
    {
      id: 3,
      name: 'Winter Wheat',
      description: 'Hardy against cold. Moderate yield expected. Soil prep needed.',
      match: 72,
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&h=100&fit=crop',
      waterReq: 'Med',
      riskLevel: 'Med'
    }
  ];

  const handleStartPlanting = () => {
    // Navigate to planting plan or show more details
    console.log('Start planting plan for:', topRecommendation.name);
  };

  const handleViewCropDetails = (crop) => {
    setSelectedCrop(crop);
    console.log('View details for:', crop.name);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Advisor</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Analysis Context */}
      <View style={styles.contextSection}>
        <View style={styles.contextHeader}>
          <Text style={styles.contextTitle}>ANALYSIS CONTEXT</Text>
        </View>
        
        <View style={styles.contextGrid}>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Season</Text>
            <Text style={styles.contextValue}>{analysisContext.season}</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Soil Type</Text>
            <Text style={styles.contextValue}>{analysisContext.soilType}</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Region</Text>
            <Text style={styles.contextValue}>{analysisContext.region}</Text>
          </View>
        </View>
      </View>

      {/* Top Recommendation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Recommendation</Text>
        
        <View style={styles.topCard}>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{topRecommendation.match}% MATCH</Text>
          </View>
          
          <Image
            source={{ uri: topRecommendation.image }}
            style={styles.topCardImage}
            resizeMode="cover"
          />
          
          <View style={styles.topCardContent}>
            <View style={styles.topCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topCardTitle}>{topRecommendation.name}</Text>
                <Text style={styles.topCardSubtitle}>{topRecommendation.scientificName}</Text>
              </View>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Icon name="bookmark-outline" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.topCardDescription}>{topRecommendation.description}</Text>
            
            <TouchableOpacity
              style={styles.plantingButton}
              onPress={handleStartPlanting}
              activeOpacity={0.8}
            >
              <Text style={styles.plantingButtonText}>Start Planting Plan</Text>
              <Icon name="arrow-right" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Icon name="chart-line" size={18} color="#10b981" />
              <Text style={styles.metricLabel}>YIELD</Text>
            </View>
            <Text style={styles.metricValue}>{topRecommendation.yield.value} <Text style={styles.metricUnit}>{topRecommendation.yield.unit}</Text></Text>
            <View style={styles.trendBadge}>
              <Icon name="trending-up" size={12} color="#10b981" />
              <Text style={styles.trendText}>{topRecommendation.yield.trend}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Icon name="water" size={18} color="#3b82f6" />
              <Text style={styles.metricLabel}>WATER REQ</Text>
            </View>
            <Text style={styles.metricValue}>{topRecommendation.waterReq.level}</Text>
            <Text style={styles.metricDetails}>{topRecommendation.waterReq.details}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Icon name="shield-alert" size={18} color="#f97316" />
              <Text style={styles.metricLabel}>RISK</Text>
            </View>
            <Text style={styles.metricValue}>{topRecommendation.riskLevel.level}</Text>
            <View style={styles.riskBadge}>
              <Icon name="alert-circle" size={12} color="#dc2626" />
              <Text style={styles.riskText}>{topRecommendation.riskLevel.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Other Viable Crops */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Other Viable Crops</Text>
        
        {otherCrops.map((crop) => (
          <TouchableOpacity
            key={crop.id}
            style={styles.cropCard}
            onPress={() => handleViewCropDetails(crop)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: crop.image }}
              style={styles.cropImage}
              resizeMode="cover"
            />
            
            <View style={styles.cropInfo}>
              <View style={styles.cropHeader}>
                <Text style={styles.cropName}>{crop.name}</Text>
                <Text style={styles.cropMatch}>{crop.match}%</Text>
              </View>
              <Text style={styles.cropDescription} numberOfLines={2}>
                {crop.description}
              </Text>
              <View style={styles.cropTags}>
                <View style={styles.tag}>
                  <Icon name="water" size={12} color="#6b7280" />
                  <Text style={styles.tagText}>{crop.waterReq}</Text>
                </View>
                <View style={styles.tag}>
                  <Icon name="shield-check" size={12} color="#6b7280" />
                  <Text style={styles.tagText}>{crop.riskLevel}</Text>
                </View>
              </View>
            </View>
            
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
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
  contextSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 16,
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
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  contextGrid: {
    gap: 12,
  },
  contextItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  topCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  topCardImage: {
    width: '100%',
    height: 180,
  },
  topCardContent: {
    padding: 16,
  },
  topCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  topCardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  bookmarkButton: {
    padding: 4,
  },
  topCardDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  plantingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  plantingButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
  },
  metricDetails: {
    fontSize: 11,
    color: '#6b7280',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  riskText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  cropCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  cropImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cropMatch: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  cropDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  cropTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
});
