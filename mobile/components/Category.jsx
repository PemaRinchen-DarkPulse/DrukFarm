import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons'; // Assuming you use @expo/vector-icons for the back arrow

// Sample data for categories (you would fetch this from an API)
const categories = [
  { id: '1', name: 'Vegetables', image: 'https://images.unsplash.com/photo-1590779033324-74c0e6677f54?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: '2', name: 'Fruits', image: 'https://images.unsplash.com/photo-1582979261314-b15392686884?q=80&w=1968&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: '3', name: 'Dairy', image: 'https://images.unsplash.com/photo-1563227806-fd7e11d7c71d?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: '4', name: 'Poultry', image: 'https://images.unsplash.com/photo-1603590505707-1b079717e1a3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: '5', name: 'Spices', image: 'https://images.unsplash.com/photo-1556910323-b6d8a39a9c2a?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: '6', name: 'Handicrafts', image: 'https://images.unsplash.com/photo-1598466107383-a9ae3cf4458f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
];

const Category = ({ navigation }) => {
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.85}
      onPress={() => {
        // Navigate to Products screen filtered by category name
        if (navigation && typeof navigation.navigate === 'function') {
          navigation.navigate('Products', { category: item.name });
        }
      }}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.categoryImage} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Grid */}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4, // Make the touch target slightly larger
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24, // Same width as the back button for centering the title
  },
  flatListContainer: {
    paddingHorizontal: 8, // Padding for the grid itself
    paddingTop: 16,
  },
  row: {
    justifyContent: 'space-around', // Distribute items evenly with space
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '45%', // Approximately 2 cards per row with spacing
    aspectRatio: 1, // Make cards square
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3, // For Android shadow
    paddingVertical: 15,
    marginHorizontal: 8, // Space between cards
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50, // Makes the image circular
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#e0e0e0', // Placeholder background
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default Category;