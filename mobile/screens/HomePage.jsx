import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Hero from '../components/home/Hero'; // make sure path is correct
import ShopByCategory from '../components/home/ShopByCategory';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Testimonials from '../components/home/Testimonials';
import CTA from '../components/home/CTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero Section */}
      <Hero />
      <ShopByCategory />
      <FeaturedProducts />
      <Testimonials />
      <CTA />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // matches web bg-background
  },
  contentContainer: {
  paddingBottom: 0,
  },
});
