import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Hero from '../components/home/Hero'; // make sure path is correct
import ShopByCategory from '../components/home/ShopByCategory';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Testimonials from '../components/home/Testimonials';

export default function HomePage() {
  // Use FlatList with a ListHeaderComponent to avoid nesting lists inside ScrollView
  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      keyExtractor={() => 'key'}
      ListHeaderComponent={(
        <View>
          <Hero />
          <ShopByCategory />
          <FeaturedProducts />
          <Testimonials />
        </View>
      )}
      style={styles.container}
    contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // matches web bg-background
  },
  contentContainer: {
  // Add extra bottom space so the bottom dock doesn't cover tappable items
  paddingBottom: 140,
  },
});
