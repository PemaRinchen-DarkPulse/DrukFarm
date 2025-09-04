import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // or use react-native-vector-icons

export default function TermsOfService({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          Welcome to DrukFarm, a platform connecting Bhutanese farmers with consumers.
          By using our app, you agree to these terms. Please read them carefully.
        </Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using DrukFarm, you agree to be bound by these Terms of Service
          and all applicable laws and regulations. If you do not agree with any of these
          terms, you are prohibited from using or accessing this app.
        </Text>

        <Text style={styles.sectionTitle}>2. User Accounts</Text>
        <Text style={styles.paragraph}>
          To use certain features of DrukFarm, you may need to create an account. You are
          responsible for maintaining the confidentiality of your account information and
          are fully responsible for all activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>3. Products and Sales</Text>
        <Text style={styles.paragraph}>
          DrukFarm facilitates the sale of agricultural products directly from farmers to
          consumers. We do not guarantee the quality, safety, or legality of the products
          listed on our platform. Farmers are solely responsible for the accuracy of their
          product descriptions and the fulfillment of orders.
        </Text>

        <Text style={styles.sectionTitle}>4. Payments and Fees</Text>
        <Text style={styles.paragraph}>
          Payments for products are processed through our secure payment gateway. DrukFarm
          may charge fees for transactions, as outlined in our fee schedule. You agree to
          pay all applicable fees and taxes associated with your purchases.
        </Text>

        <Text style={styles.sectionTitle}>5. Dispute Resolution</Text>
        <Text style={styles.paragraph}>
          In the event of a dispute between a buyer and a seller, DrukFarm will provide a
          platform for communication and mediation. However, we are not responsible for
          resolving disputes or providing refunds.
        </Text>

        <Text style={styles.sectionTitle}>6. Privacy Policy</Text>
        <Text style={styles.paragraph}>
          Your privacy is important to us. Please review our Privacy Policy to understand
          how we collect, use, and protect your personal information.
        </Text>

        <Text style={styles.sectionTitle}>7. Modifications to Terms</Text>
        <Text style={styles.paragraph}>
          DrukFarm reserves the right to modify these Terms of Service at any time. We will
          notify users of any significant changes. Your continued use of the app after such
          modifications constitutes your acceptance of the revised terms.
        </Text>

        <Text style={styles.sectionTitle}>8. Termination</Text>
        <Text style={styles.paragraph}>
          DrukFarm may terminate your access to the app at any time, with or without cause.
          You may also terminate your account at any time.
        </Text>

        <Text style={styles.sectionTitle}>9. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms of Service shall be governed by and construed in accordance with the
          laws of Bhutan.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms of Service, please contact us at{" "}
          <Text style={styles.link}>support@drukfarm.bt</Text>.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    color: '#000',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
    color: '#000',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
