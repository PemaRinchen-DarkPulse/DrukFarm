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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { fetchCategories } from '../lib/api';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x300.png?text=Category';

const Category = ({ navigation }) => {
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (!Array.isArray(cats)) return;
        const mapped = cats.map((c, idx) => ({
          id: String(c.categoryId || c._id || idx),
          name: c.categoryName || c.name || '',
          image: c.imageBase64
            ? `data:image/jpeg;base64,${c.imageBase64}`
            : (c.image || PLACEHOLDER_IMG),
        }))

        if (isActive) setCategories(mapped);
      } catch (e) {
        console.warn('Failed to load categories:', e?.message || e);
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const renderCategoryItem = ({ item }) => {
    if (item?.empty) {
      return <View style={[styles.categoryCard, { opacity: 0 }]} pointerEvents="none" />
    }
    return (
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
        <View style={styles.textWrap}>
          <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Grid */}
      <FlatList
        data={categories.length % 2 === 1 ? [...categories, { id: `__empty-${categories.length}`, empty: true }] : categories}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: '45%', // Approximately 2 cards per row with spacing
    aspectRatio: 1, // Make cards square
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 8, // Space between cards
  },
  imageContainer: {
    width: 88,
    height: 88,
    borderRadius: 50, // Makes the image circular
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#e0e0e0', // Placeholder background
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textWrap: {
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'center',
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