import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const Payouts = ({ navigation }) => {
  const payoutHistory = [
    {
      id: '20240726-001',
      date: 'July 26, 2024',
      amount: '120.00',
    },
    {
      id: '20240719-002',
      date: 'July 19, 2024',
      amount: '85.50',
    },
    {
      id: '20240712-003',
      date: 'July 12, 2024',
      amount: '150.75',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation?.canGoBack()) navigation.goBack();
            else navigation?.navigate?.('Account Settings');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payouts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payout Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Method</Text>
          
          <View style={styles.payoutMethodCard}>
            <View style={styles.bankInfo}>
              <View style={styles.bankIcon}>
                <MaterialIcons name="account-balance" size={20} color="#666" />
              </View>
              <View style={styles.bankDetails}>
                <Text style={styles.bankName}>Bank of Bhutan</Text>
                <Text style={styles.bankType}>Mobile Banking</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payout History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          
          {payoutHistory.map((payout, index) => (
            <View key={payout.id} style={styles.payoutItem}>
              <View style={styles.payoutLeft}>
                <Text style={styles.payoutDate}>{payout.date}</Text>
                <Text style={styles.payoutId}>ID: {payout.id}</Text>
              </View>
              <Text style={styles.payoutAmount}>Nu. {payout.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Feather name="list" size={24} color="#999" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Feather name="shopping-cart" size={24} color="#999" />
          <Text style={styles.navText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#007AFF" />
          <Text style={[styles.navText, styles.navTextActive]}>Payouts</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  payoutMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankDetails: {
    justifyContent: 'center',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  bankType: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  changeButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  payoutLeft: {
    flex: 1,
  },
  payoutDate: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
  },
  payoutId: {
    fontSize: 12,
    color: '#999',
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  navTextActive: {
    color: '#007AFF',
  },
});

export default Payouts;