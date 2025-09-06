import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const OrdersHistory = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingOrders = [
    {
      id: '1',
      productName: 'Apples',
      buyerName: 'Sonam Wangchuk',
      address: 'Thimphu',
      quantity: 2,
      image: 'https://via.placeholder.com/60x60/8B4513/FFFFFF?text=A',
    },
    {
      id: '2',
      productName: 'Potatoes',
      buyerName: 'Sonam Choden',
      address: 'Paro',
      quantity: 1,
      image: 'https://via.placeholder.com/60x60/D2691E/FFFFFF?text=P',
    },
    {
      id: '3',
      productName: 'Chilies',
      buyerName: 'Karma Dorji',
      address: 'Punakha',
      quantity: 3,
      image: 'https://via.placeholder.com/60x60/8B0000/FFFFFF?text=C',
    },
  ];

  const completedOrders = [
    // Add completed orders here
  ];

  const OrderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.productImage}
      />
      <View style={styles.orderDetails}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.buyerInfo}>Buyer: {item.buyerName}</Text>
        <Text style={styles.addressInfo}>Address: {item.address}</Text>
        <Text style={styles.quantityInfo}>{item.quantity} items</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order List */}
      <FlatList
        data={activeTab === 'pending' ? pendingOrders : completedOrders}
        renderItem={({ item }) => <OrderItem item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab} orders</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  listContent: {
    paddingVertical: 8,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  orderDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buyerInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  addressInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  quantityInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
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

export default OrdersHistory;