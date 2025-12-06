import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Image,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

function Stat({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function About({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>About Druk Farm</Text>
        <Text style={styles.heroParagraph}>
          Druk Farm connects Bhutanese farmers directly to local buyers and
          marketplaces. We make it easier to sell fresh produce, get fair
          prices, and build sustainable farm businesses through simple digital
          tools and community support.
        </Text>

        <View style={styles.statsRow}>
          <Stat label="Farmers supported" value="1,200+" />
          <Stat label="Produce categories" value="24" />
          <Stat label="Local partners" value="35" />
        </View>
      </View>

      {/* Mission & Vision */}
      <View style={styles.row}>
        <View style={styles.featureCard}>
          <Text style={styles.subtitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            To empower smallholder farmers in Bhutan with simple, reliable
            digital tools and market access so they can increase incomes, reduce
            waste, and strengthen local food systems.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.subtitle}>Our Vision</Text>
          <Text style={styles.paragraph}>
            A thriving, resilient Bhutanese agricultural sector where farmers
            receive fair prices and communities have access to fresh,
            locally-grown food year-round.
          </Text>
        </View>
      </View>

      {/* Values */}
      <View style={styles.valuesCard}>
        <Text style={styles.subtitle}>Our Values</Text>
        <View style={styles.list}>
          <View style={styles.valueItem}>
            <View style={styles.valueText}>
              <Text style={styles.valueTitle}>Community-first</Text>
              <Text style={styles.valueDesc}>We prioritize farmer and vegetable vendor needs</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueText}>
              <Text style={styles.valueTitle}>Transparency</Text>
              <Text style={styles.valueDesc}>Fair pricing and clear processes</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueText}>
              <Text style={styles.valueTitle}>Sustainability</Text>
              <Text style={styles.valueDesc}>Supporting practices that protect land and water</Text>
            </View>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueText}>
              <Text style={styles.valueTitle}>Simplicity</Text>
              <Text style={styles.valueDesc}>Tools that are easy to use and maintain</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Team */}
      <View style={styles.teamSection}>
        <Text style={styles.subtitle}>Meet the Team</Text>
        
        <View style={styles.teamGrid}>
          {/* Team Member 1 */}
          <View style={styles.teamMemberCard}>
            <View style={styles.avatar}>
              <Image 
                source={require('../assets/pema.jpg')} 
                style={styles.avatarImage}
              />
            </View>
            <Text style={styles.memberName}>Pema Rinchen</Text>
            <Text style={styles.memberRole}>Co-Founder & CEO</Text>
            
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL("https://facebook.com")}
              >
                <Icon name="facebook" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL("https://instagram.com")}
              >
                <Icon name="instagram" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL("https://wa.me/")}
              >
                <Icon name="whatsapp" size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Team Member 2 */}
          <View style={styles.teamMemberCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>CP</Text>
            </View>
            <Text style={styles.memberName}>Chablop Passang Tshinring</Text>
            <Text style={styles.memberRole}>Co-Founder & Advisor</Text>
            
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL("https://facebook.com")}
              >
                <Icon name="facebook" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL("https://instagram.com")}
              >
                <Icon name="instagram" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL("https://wa.me/")}
              >
                <Icon name="whatsapp" size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Last updated: August 2025</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  // Hero Card
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroParagraph: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Feature Cards
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  card: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 16,
  },
  valuesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teamSection: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'column',
    gap: 12,
  },
  list: {
    gap: 12,
  },
  valueItem: {
    marginBottom: 12,
  },
  valueText: {
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  valueDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  teamGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  teamMemberCard: {
    flex: 1,
    maxWidth: '49%',
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    marginBottom: 3,
    width: 75,
    height: 75,
    borderRadius: 75,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarImage: {
    width: 75,
    height: 75,
    resizeMode: 'cover',
  },
  memberName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 3,
  },
  memberRole: {
    fontSize: 11,
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  socialIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCard: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaParagraph: {
    fontSize: 15,
    color: '#ecfdf5',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#fff',
  },
  primaryButtonText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
});
