import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SmartTools() {
  const navigation = useNavigation();

  const tools = [
    {
      id: 1,
      icon: 'weather-partly-cloudy',
      iconColor: '#3b82f6',
      iconBg: '#dbeafe',
      title: 'Weather Forecast',
      description: '7-day predictions and severe weather alerts.',
      buttonText: 'View Forecast',
      buttonColor: '#3b82f6',
      imageUri: 'https://images.unsplash.com/photo-1601134467661-3d775b999c8b?w=400&h=600&fit=crop',
      screen: 'Weather Prediction'
    },
    {
      id: 2,
      icon: 'sprout',
      iconColor: '#10b981',
      iconBg: '#d1fae5',
      title: 'Crop Advisor',
      description: 'AI analysis to suggest the most profitable crops.',
      buttonText: 'Start Analysis',
      buttonColor: '#10b981',
      imageUri: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=600&fit=crop',
      screen: 'Crop Recommendation'
    },
    {
      id: 3,
      icon: 'camera',
      iconColor: '#f97316',
      iconBg: '#ffedd5',
      title: 'Disease Doctor',
      description: 'Scan leaf to detect issues instantly.',
      buttonText: 'Scan Now',
      buttonColor: '#22c55e',
      imageUri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=600&fit=crop',
      screen: 'Crop Disease Detection',
      isNew: true
    }
  ];

  const handleNavigate = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Tools</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tools.length} Available</Text>
        </View>
      </View>

      <View style={styles.toolsContainer}>
        {tools.map((tool) => (
          <View key={tool.id} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.leftContent}>
                <Text style={styles.cardTitle}>{tool.title}</Text>
                <Text style={styles.cardDescription}>{tool.description}</Text>
                
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: tool.buttonColor }]}
                  onPress={() => handleNavigate(tool.screen)}
                  activeOpacity={0.8}
                >
                  {tool.id === 3 && (
                    <Icon name="camera" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.buttonText}>{tool.buttonText}</Text>
                  <Icon name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.rightContent}>
                <Image
                  source={{ uri: tool.imageUri }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  toolsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  leftContent: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  rightContent: {
    width: 100,
    justifyContent: 'center',
  },
  cardImage: {
    width: 100,
    height: 140,
    borderRadius: 12,
  },
});
