import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Hero from '../components/Hero'; // make sure path is correct
import Features from '../components/Features';
import ShopByCategory from '../components/ShopByCategory';
import FeaturedProducts from '../components/FeaturedProducts';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero Section */}
      <Hero />
      <Features />
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
