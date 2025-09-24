import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from '../lib/auth';
import { fetchTransporterOrders, fetchShippedOrders, updateOrderStatus } from '../lib/api';

export default function TransporterDashboard({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Available");
  const [orders, setOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading orders for user:', { cid: user?.cid, id: user?.id, name: user?.name });
      
      const shippedResponse = await fetchShippedOrders({ cid: user?.cid });
      console.log('Shipped orders response:', shippedResponse);
      console.log('Shipped orders count:', shippedResponse?.orders?.length || 0);
      
      const allOrdersResponse = await fetchTransporterOrders({ 
        cid: user?.cid, 
        transporterId: user?.id || user?.cid 
      });
      
      if (shippedResponse?.orders) {
        console.log('Direct shipped orders from API:', shippedResponse.orders.length);
        console.log('Sample shipped orders:', shippedResponse.orders.slice(0, 3).map(o => ({
          orderId: o.orderId,
          status: o.status,
          customerName: o.customerName,
          product: o.product?.name
        })));
      }
      
      setShippedOrders(shippedResponse?.orders || []);
      setOrders(allOrdersResponse?.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user?.cid, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOrderAction = async (orderId, action) => {
    try {
      await updateOrderStatus({ 
        orderId, 
        status: action, 
        cid: user?.cid 
      });
      Alert.alert('Success', `Order ${action} successfully`);
      loadOrders(); 
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', `Failed to ${action} order`);
    }
  };

  const renderOrderItem = ({ item }) => {
    if (!item) return null;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>
            Order #{item.orderNumber || item.orderId?.slice(-6) || 'Unknown'}
          </Text>
          <View style={[styles.statusBadge, styles[`status${item.status || 'unknown'}`]]}>
            <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
          </View>
        </View>
      
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="account" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Customer: {item.customerName}</Text>
          </View>
          {item.customerPhone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Phone: {item.customerPhone}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Icon name="package-variant" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Product: {item.product?.name} (Qty: {item.quantity})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="map-marker-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Delivery: {item.deliveryLocation}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="truck" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Transport Fee: Nu. {item.transportFee}</Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          {(item.status === 'shipped' || item.status === 'Pending' || !item.transporterId) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'Accepted')}
            >
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Accepted' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pickupButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'PickedUp')}
            >
              <Text style={styles.pickupButtonText}>Mark as Picked Up</Text>
            </TouchableOpacity>
          )}
          {item.status === 'PickedUp' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'Delivered')}
            >
              <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Delivered' && (
            <View style={styles.completedBadge}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "Available":
        const availableOrders = [...shippedOrders, ...orders.filter(order => !order.transporterId)];
        const uniqueAvailableOrders = Array.from(new Set(availableOrders.map(o => o.orderId || o.id)))
            .map(id => availableOrders.find(o => (o.orderId || o.id) === id));
        return uniqueAvailableOrders.filter(order => 
          order.status === 'Pending' || 
          order.status === 'pending' ||
          order.status === 'Shipped' ||
          order.status === 'shipped'
        );
      case "My Delivery":
        return orders.filter(order => 
          (order.transporterId === user?.id || order.transporterId === user?.cid) &&
          (order.status === 'Accepted' || 
          order.status === 'PickedUp')
        );
      case "Completed":
        return orders.filter(order => 
          order.status === 'Delivered' || 
          order.status === 'delivered'
        );
      default:
        return [];
    }
  };

  const tabs = ["Available", "My Delivery", "Completed"];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transporter Dashboard</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => console.log('Filter pressed')}>
          <Text style={styles.filterText}>Filter</Text>
          <Icon name="filter-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tab, activeTab === tab && styles.activeTab]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredOrders()}
            renderItem={renderOrderItem}
            keyExtractor={(item) => (item.orderId || item.id || item._id || Math.random().toString())}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="truck-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No orders found</Text>
                <Text style={styles.emptySubtext}>
                  {activeTab === "Available"
                    ? "Check back later for new orders"
                    : activeTab === "My Delivery"
                    ? "Orders you accept will appear here"
                    : "Completed deliveries will be listed here"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    color: "#111827",
    marginRight: 4,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  tab: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    paddingBottom: 4,
  },
  activeTab: {
    color: "#DC2626",
    borderBottomWidth: 2,
    borderBottomColor: "#DC2626",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusShipped: {
    backgroundColor: '#FDE68A',
  },
  statusAccepted: {
    backgroundColor: '#DBEAFE',
  },
  statusPickedUp: {
    backgroundColor: '#E0E7FF',
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
  },
  statusunknown: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#059669',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickupButton: {
    backgroundColor: '#F59E0B',
  },
  pickupButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deliverButton: {
    backgroundColor: '#3B82F6',
  },
  deliverButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  completedText: {
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  debugText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    fontFamily: 'monospace',
  },
});