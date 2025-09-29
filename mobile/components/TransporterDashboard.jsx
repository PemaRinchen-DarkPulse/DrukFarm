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
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from '../lib/auth';
import { fetchTransporterOrders, fetchShippedOrders, updateOrderStatus, fetchDzongkhags, fetchDispatchAddresses, fetchGewogsByDzongkhag, fetchVillagesByGewog, setOutForDelivery } from '../lib/api';

const { height: screenHeight } = Dimensions.get('window');

// Helper function to normalize status for styling
const getStatusStyleName = (status) => {
  if (!status) return 'unknown';
  // Convert 'Out for Delivery' to 'OutforDelivery' for style naming
  return status.replace(/\s+/g, '');
};

export default function TransporterDashboard({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Available");
  const [orders, setOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Bottom sheet states
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [pickupDzongkhag, setPickupDzongkhag] = useState('');
  const [pickupGewog, setPickupGewog] = useState('');
  const [pickupVillage, setPickupVillage] = useState('');
  const [dropOffDzongkhag, setDropOffDzongkhag] = useState('');
  const [dropOffTown, setDropOffTown] = useState('');
  const slideAnim = useState(new Animated.Value(screenHeight))[0];
  
  // Data states
  const [dzongkhags, setDzongkhags] = useState([]);
  const [pickupGewogs, setPickupGewogs] = useState([]);
  const [pickupVillages, setPickupVillages] = useState([]);
  const [dropOffTowns, setDropOffTowns] = useState([]);
  const [loadingDzongkhags, setLoadingDzongkhags] = useState(false);
  const [loadingPickupGewogs, setLoadingPickupGewogs] = useState(false);
  const [loadingPickupVillages, setLoadingPickupVillages] = useState(false);
  const [loadingDropOffTowns, setLoadingDropOffTowns] = useState(false);
  
  // Dropdown visibility states
  const [showPickupDzongkhagDropdown, setShowPickupDzongkhagDropdown] = useState(false);
  const [showPickupGewogDropdown, setShowPickupGewogDropdown] = useState(false);
  const [showPickupVillageDropdown, setShowPickupVillageDropdown] = useState(false);
  const [showDropOffDzongkhagDropdown, setShowDropOffDzongkhagDropdown] = useState(false);
  const [showDropOffTownDropdown, setShowDropOffTownDropdown] = useState(false);

  // Payment-related state
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    // Don't load orders if user is not logged in or not a transporter
    if (!user || !user.cid || String(user.role || '').toLowerCase() !== 'transporter') {
      console.log('User not logged in or not a transporter, skipping order load');
      setOrders([]);
      setShippedOrders([]);
      return;
    }
    
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
          product: o.product?.name,
          transporterId: o.transporterId,
          transporter: o.transporter
        })));
      }
      
      if (allOrdersResponse?.orders) {
        console.log('Transporter orders from API:', allOrdersResponse.orders.length);
        console.log('Sample transporter orders:', allOrdersResponse.orders.slice(0, 3).map(o => ({
          orderId: o.orderId || o.id,
          status: o.status,
          customerName: o.customerName,
          transporterId: o.transporterId,
          transporter: o.transporter
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

  const loadPaymentOrders = useCallback(async () => {
    if (!user || !user.cid || String(user.role || '').toLowerCase() !== 'transporter') {
      console.log('User not logged in or not a transporter, skipping payment order load');
      setPaymentOrders([]);
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      // Fetch transporter orders for payment tracking
      const response = await fetchTransporterOrders({ 
        cid: user?.cid, 
        transporterId: user?.id || user?.cid 
      });
      
      // Filter to only show orders that are in payment-relevant states
      const paymentRelevantOrders = (response?.orders || []).filter(order => 
        ['delivered', 'completed', 'payment pending'].includes(order.status?.toLowerCase())
      ).map(o => ({
        orderId: String(o.orderId || o._id || ''),
        product: {
          name: o.product?.name || o.product?.productName || 'Unknown Product',
          price: o.product?.price || 0,
        },
        buyer: {
          name: o.buyer?.name || o.customerName || 'Unknown Buyer',
          cid: o.buyer?.cid || o.customerCid
        },
        totalPrice: o.totalAmount || (o.product?.price * o.quantity) || 0,
        status: o.status || 'unknown',
        settlementDate: o.settlementDate,
        transporterSettlementDate: o.transporterSettlementDate
      }));
      
      setPaymentOrders(paymentRelevantOrders);
    } catch (error) {
      console.error('Error loading payment orders:', error);
      Alert.alert('Error', 'Failed to load payment orders');
    } finally {
      setPaymentLoading(false);
    }
  }, [user?.cid, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "Payments") {
      await loadPaymentOrders();
    } else {
      await loadOrders();
    }
    setRefreshing(false);
  }, [loadOrders, loadPaymentOrders, activeTab]);

  const handleMarkPaymentReceived = async (orderId) => {
    try {
      Alert.alert(
        'Payment Received',
        'Mark this payment as received?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                // Update order status to indicate payment received
                await updateOrderStatus({ orderId, status: 'payment received', cid: user?.cid });
                
                // Update local state
                setPaymentOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, status: 'payment received', settlementDate: new Date().toISOString() }
                      : order
                  )
                );
                
                Alert.alert('Success', 'Payment marked as received');
              } catch (error) {
                Alert.alert('Error', 'Failed to mark payment as received');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  // Data loading functions
  const loadDzongkhags = useCallback(async () => {
    try {
      setLoadingDzongkhags(true);
      const data = await fetchDispatchAddresses();
      const dzongkhagNames = data.map(item => item.dzongkhag);
      setDzongkhags(dzongkhagNames);
    } catch (error) {
      console.error('Error loading dzongkhags:', error);
      Alert.alert('Error', 'Failed to load dzongkhags');
    } finally {
      setLoadingDzongkhags(false);
    }
  }, []);

  const loadPickupGewogs = useCallback(async (dzongkhag) => {
    if (!dzongkhag) {
      setPickupGewogs([]);
      return;
    }
    try {
      setLoadingPickupGewogs(true);
      const data = await fetchGewogsByDzongkhag(dzongkhag);
      setPickupGewogs(data);
    } catch (error) {
      console.error('Error loading pickup gewogs:', error);
      Alert.alert('Error', 'Failed to load gewogs for pickup location');
      setPickupGewogs([]);
    } finally {
      setLoadingPickupGewogs(false);
    }
  }, []);

  const loadPickupVillages = useCallback(async (dzongkhag, gewog) => {
    if (!dzongkhag || !gewog) {
      setPickupVillages([]);
      return;
    }
    try {
      setLoadingPickupVillages(true);
      const data = await fetchVillagesByGewog(dzongkhag, gewog);
      setPickupVillages(data);
    } catch (error) {
      console.error('Error loading pickup villages:', error);
      Alert.alert('Error', 'Failed to load villages for pickup location');
      setPickupVillages([]);
    } finally {
      setLoadingPickupVillages(false);
    }
  }, []);

  const loadDropOffTowns = useCallback(async (dzongkhag) => {
    if (!dzongkhag) {
      setDropOffTowns([]);
      return;
    }
    try {
      setLoadingDropOffTowns(true);
      const data = await fetchTownsByDzongkhag(dzongkhag);
      setDropOffTowns(data);
    } catch (error) {
      console.error('Error loading drop-off towns:', error);
      Alert.alert('Error', 'Failed to load towns for drop-off location');
      setDropOffTowns([]);
    } finally {
      setLoadingDropOffTowns(false);
    }
  }, []);

  // Bottom sheet functions
  const openBottomSheet = () => {
    console.log('Opening bottom sheet...');
    console.log('Current isFilterVisible:', isFilterVisible);
    setIsFilterVisible(true);
    console.log('Set isFilterVisible to true');
    // Load dzongkhags when opening the modal
    if (dzongkhags.length === 0) {
      loadDzongkhags();
    }
  };

  const closeBottomSheet = () => {
    console.log('Closing bottom sheet...');
    closeAllDropdowns();
    setIsFilterVisible(false);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      const newValue = screenHeight * 0.4 + gestureState.dy;
      if (newValue >= screenHeight * 0.4) {
        slideAnim.setValue(newValue);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        closeBottomSheet();
      } else {
        Animated.timing(slideAnim, {
          toValue: screenHeight * 0.4,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  // Dropdown handlers
  const handlePickupDzongkhagSelect = (dzongkhag) => {
    setPickupDzongkhag(dzongkhag);
    setPickupGewog(''); // Reset gewog selection
    setPickupVillage(''); // Reset village selection
    loadPickupGewogs(dzongkhag);
  };

  const handlePickupGewogSelect = (gewog) => {
    setPickupGewog(gewog);
    setPickupVillage(''); // Reset village selection
    loadPickupVillages(pickupDzongkhag, gewog);
  };

  const handlePickupVillageSelect = (village) => {
    setPickupVillage(village);
  };

  const handleDropOffDzongkhagSelect = (dzongkhag) => {
    setDropOffDzongkhag(dzongkhag);
    setDropOffTown(''); // Reset town selection
    loadDropOffTowns(dzongkhag);
  };

  const applyFilters = () => {
    const filterData = {
      pickupDzongkhag,
      pickupGewog,
      pickupVillage,
      dropOffDzongkhag,
      dropOffTown
    };
    console.log('Applying filters:', filterData);
    closeBottomSheet();
  };

  const clearFilters = () => {
    setPickupDzongkhag('');
    setPickupGewog('');
    setPickupVillage('');
    setDropOffDzongkhag('');
    setDropOffTown('');
    setPickupGewogs([]);
    setPickupVillages([]);
    setDropOffTowns([]);
    closeAllDropdowns();
  };

  const closeAllDropdowns = () => {
    setShowPickupDzongkhagDropdown(false);
    setShowPickupGewogDropdown(false);
    setShowPickupVillageDropdown(false);
    setShowDropOffDzongkhagDropdown(false);
    setShowDropOffTownDropdown(false);
  };

  // Authentication check - redirect if user is not logged in or not a transporter
  useEffect(() => {
    if (!user || !user.cid || String(user.role || '').toLowerCase() !== 'transporter') {
      console.log('User not authenticated as transporter, redirecting to Home');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      return;
    }
  }, [user, navigation]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (activeTab === "Payments") {
      loadPaymentOrders();
    }
  }, [activeTab, loadPaymentOrders]);

  // Debug effect to track modal visibility
  useEffect(() => {
    console.log('isFilterVisible changed to:', isFilterVisible);
  }, [isFilterVisible]);

  const handleOrderAction = async (orderId, action) => {
    try {
      if (action === 'accept') {
        // When accepting an order, set it to "out for delivery" with transporter details
        await setOutForDelivery({ 
          orderId, 
          cid: user?.cid,
          name: user?.name || user?.fullName || 'Transporter',
          phoneNumber: user?.phoneNumber || user?.phone || ''
        });
        Alert.alert('Success', 'Order accepted and set for delivery');
      } else if (action === 'deliver') {
        // Update status to delivered
        await updateOrderStatus({ 
          orderId, 
          status: 'Delivered', 
          cid: user?.cid 
        });
        Alert.alert('Success', 'Order delivered successfully');
      } else {
        // For other actions, use the generic status update
        await updateOrderStatus({ 
          orderId, 
          status: action, 
          cid: user?.cid 
        });
        Alert.alert('Success', `Order ${action} successfully`);
      }
      loadOrders(); 
    } catch (error) {
      console.error('Error updating order:', error);
      const errorMessage = error?.body?.message || error?.message || 'Unknown error occurred';
      Alert.alert('Error', `Failed to ${action === 'accept' ? 'accept' : action} order: ${errorMessage}`);
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
          <View style={[styles.statusBadge, styles[`status${getStatusStyleName(item.status)}`]]}>
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
          {(item.status === 'shipped' || item.status === 'Shipped') && !item.transporterId && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'accept')}
            >
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>
          )}
          {(item.status === 'delivered' || item.status === 'Delivered') && (
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
    let filteredOrders = [];
    
    console.log('Filtering orders for tab:', activeTab);
    console.log('Total orders:', orders.length);
    console.log('Total shipped orders:', shippedOrders.length);
    console.log('Current user:', { cid: user?.cid, id: user?.id });
    
    switch (activeTab) {
      case "Available":
        const availableOrders = [...shippedOrders, ...orders.filter(order => !order.transporterId)];
        const uniqueAvailableOrders = Array.from(new Set(availableOrders.map(o => o.orderId || o.id)))
            .map(id => availableOrders.find(o => (o.orderId || o.id) === id));
        filteredOrders = uniqueAvailableOrders.filter(order => 
          order.status === 'Shipped' ||
          order.status === 'shipped'
        );
        break;
      case "My Delivery":
        // Combine both orders arrays and filter for orders assigned to current transporter
        const allMyOrders = [...orders, ...shippedOrders];
        const uniqueMyOrders = Array.from(new Set(allMyOrders.map(o => o.orderId || o.id)))
            .map(id => allMyOrders.find(o => (o.orderId || o.id) === id));
        
        console.log('=== MY DELIVERY DEBUG ===');
        console.log('Total unique orders to check:', uniqueMyOrders.length);
        console.log('Current user CID:', user?.cid);
        console.log('Current user ID:', user?.id);
        
        filteredOrders = uniqueMyOrders.filter(order => {
          // Debug each order
          console.log('Checking order:', {
            orderId: order.orderId || order.id,
            status: order.status,
            transporterId: order.transporterId,
            'transporter.cid': order.transporter?.cid,
            'transporter.name': order.transporter?.name
          });
          
          // Check if order is assigned to current transporter
          const isAssignedToMe = (
            order.transporterId === user?.id || 
            order.transporterId === user?.cid ||
            order.transporter?.cid === user?.cid ||
            order.transporter?.cid === user?.id
          );
          
          // The transporter assignment is already checked through transporter fields
          // No need for additional status-based assignment logic
          const isAssignedToMeUpdated = isAssignedToMe;
          
          console.log('Transporter assignment checks:', {
            'transporterId === user.id': order.transporterId === user?.id,
            'transporterId === user.cid': order.transporterId === user?.cid,
            'transporter.cid === user.cid': order.transporter?.cid === user?.cid,
            'transporter.cid === user.id': order.transporter?.cid === user?.id,
            'isAssignedToMe': isAssignedToMe,
            'isAssignedToMeUpdated': isAssignedToMeUpdated,
            'order.status': order.status
          });
          
          // Check if order has appropriate status for "My Delivery"
          const hasMyDeliveryStatus = (
            order.status === 'Out for Delivery' ||
            order.status === 'delivered' ||
            order.status === 'Delivered'
          );
          
          console.log('Status checks:', {
            'status': order.status,
            'hasMyDeliveryStatus': hasMyDeliveryStatus
          });
          
          const shouldInclude = isAssignedToMeUpdated && hasMyDeliveryStatus;
          console.log('Should include in My Delivery:', shouldInclude);
          console.log('---');
          
          return shouldInclude;
        });
        console.log('=== END MY DELIVERY DEBUG ===');
        break;
      case "Completed":
        // Combine both orders arrays and filter for completed orders by current transporter
        const allCompletedOrders = [...orders, ...shippedOrders];
        const uniqueCompletedOrders = Array.from(new Set(allCompletedOrders.map(o => o.orderId || o.id)))
            .map(id => allCompletedOrders.find(o => (o.orderId || o.id) === id));
        
        filteredOrders = uniqueCompletedOrders.filter(order => {
          // Check if order was completed by current transporter
          const isCompletedByMe = (
            order.transporterId === user?.id || 
            order.transporterId === user?.cid ||
            order.transporter?.cid === user?.cid ||
            order.transporter?.cid === user?.id
          );
          
          // Check if order is completed
          const isCompleted = (
            order.status === 'delivered' ||
            order.status === 'Delivered'
          );
          
          return isCompletedByMe && isCompleted;
        });
        break;
      default:
        filteredOrders = [];
    }

    // Apply location filters if they exist
    if (pickupDzongkhag || pickupGewog || pickupVillage || dropOffDzongkhag || dropOffTown) {
      filteredOrders = filteredOrders.filter(order => {
        const matchesPickupDzongkhag = !pickupDzongkhag || 
          (order.pickupLocation && order.pickupLocation.toLowerCase().includes(pickupDzongkhag.toLowerCase())) ||
          (order.customerAddress && order.customerAddress.toLowerCase().includes(pickupDzongkhag.toLowerCase()));
        
        const matchesPickupGewog = !pickupGewog || 
          (order.pickupLocation && order.pickupLocation.toLowerCase().includes(pickupGewog.toLowerCase())) ||
          (order.customerAddress && order.customerAddress.toLowerCase().includes(pickupGewog.toLowerCase()));
        
        const matchesPickupVillage = !pickupVillage || 
          (order.pickupLocation && order.pickupLocation.toLowerCase().includes(pickupVillage.toLowerCase())) ||
          (order.customerAddress && order.customerAddress.toLowerCase().includes(pickupVillage.toLowerCase()));
        
        const matchesDropOffDzongkhag = !dropOffDzongkhag || 
          (order.deliveryLocation && order.deliveryLocation.toLowerCase().includes(dropOffDzongkhag.toLowerCase()));
          
        const matchesDropOffTown = !dropOffTown || 
          (order.deliveryLocation && order.deliveryLocation.toLowerCase().includes(dropOffTown.toLowerCase()));
          
        return matchesPickupDzongkhag && matchesPickupGewog && matchesPickupVillage && matchesDropOffDzongkhag && matchesDropOffTown;
      });
    }

    console.log('Filtered orders for', activeTab, ':', filteredOrders.length);
    console.log('Sample filtered orders:', filteredOrders.slice(0, 3).map(o => ({
      orderId: o.orderId || o.id,
      status: o.status,
      transporterId: o.transporterId,
      transporter: o.transporter
    })));

    return filteredOrders;
  };

  const renderPaymentTableRow = ({ item }) => {
    const isPending = item.status !== 'payment received';
    
    return (
      <View style={styles.paymentTableRow}>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentCellText}>{item.orderId || 'N/A'}</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentCellText}>{item.product?.name || 'Unknown Product'}</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentCellText}>{item.buyer?.name || 'Unknown Tshogpa'}</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentCellText}>Nu.{item.totalPrice || '0'}</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={[styles.paymentCellText, styles.statusText]}>{item.status || 'Unknown'}</Text>
        </View>
        <View style={styles.paymentTableCell}>
          {isPending ? (
            <TouchableOpacity 
              style={styles.receivedButton}
              onPress={() => handleMarkPaymentReceived(item.orderId)}
            >
              <Text style={styles.receivedButtonText}>Received</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.paymentCellText}>
              {item.settlementDate 
                ? new Date(item.settlementDate).toLocaleDateString() 
                : 'N/A'
              }
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderPaymentTableHeader = () => {
    return (
      <View style={styles.paymentTableHeader}>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentHeaderText}>Order ID</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentHeaderText}>Product</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentHeaderText}>Tshogpa</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentHeaderText}>Amount</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentHeaderText}>Status</Text>
        </View>
        <View style={styles.paymentTableCell}>
          <Text style={styles.paymentHeaderText}>Action</Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === "Payments") {
      return paymentLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <View style={styles.paymentTableContainer}>
          {renderPaymentTableHeader()}
          <FlatList
            data={paymentOrders}
            renderItem={renderPaymentTableRow}
            keyExtractor={(item) => (item.orderId || item.id || item._id || Math.random().toString())}
            contentContainerStyle={styles.paymentListContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="credit-card" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No payment orders found</Text>
                <Text style={styles.emptySubtext}>
                  Your payment history will show here
                </Text>
              </View>
            }
          />
        </View>
      );
    }

    // Default content for other tabs (Available, My Delivery, Completed)
    return loading ? (
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
    );
  };

  const tabs = ["Available", "My Delivery", "Completed", "Payments"];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transporter Dashboard</Text>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            (pickupDzongkhag || pickupGewog || pickupVillage || dropOffDzongkhag || dropOffTown) && styles.filterButtonActive
          ]} 
          onPress={() => {
            console.log('Filter button pressed');
            openBottomSheet();
          }}
        >
          <Text style={[
            styles.filterText,
            (pickupDzongkhag || pickupGewog || pickupVillage || dropOffDzongkhag || dropOffTown) && styles.filterTextActive
          ]}>
            Filter
          </Text>
          <Icon 
            name={pickupDzongkhag || pickupGewog || pickupVillage || dropOffDzongkhag || dropOffTown ? "filter" : "filter-outline"} 
            size={20} 
            color={(pickupDzongkhag || pickupGewog || pickupVillage || dropOffDzongkhag || dropOffTown) ? "#059669" : "#111827"} 
          />
          {(pickupDzongkhag || pickupGewog || pickupVillage || dropOffDzongkhag || dropOffTown) && (
            <View style={styles.filterIndicator} />
          )}
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
        {renderContent()}
      </View>

      {/* Bottom Sheet Filter Modal */}
      <Modal
        transparent={true}
        visible={isFilterVisible}
        animationType="slide"
        onRequestClose={closeBottomSheet}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={closeBottomSheet}
          />
          <View style={styles.bottomSheet}>
            {/* Handle bar for visual indication */}
            <View style={styles.handleBar} />
            
            {/* Header */}
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={closeBottomSheet} style={styles.closeButton}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
              {/* Pickup Location Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Pickup Location</Text>
                
                {/* Pickup Dzongkhag Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Dzongkhag</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowPickupGewogDropdown(false);
                      setShowPickupVillageDropdown(false);
                      setShowDropOffDzongkhagDropdown(false);
                      setShowDropOffTownDropdown(false);
                      setShowPickupDzongkhagDropdown(!showPickupDzongkhagDropdown);
                    }}
                  >
                    <Icon name="map-marker" size={20} color="#6B7280" style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, !pickupDzongkhag && styles.placeholderText]}>
                      {pickupDzongkhag || 'Select Dzongkhag'}
                    </Text>
                    <Icon name={showPickupDzongkhagDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {showPickupDzongkhagDropdown && (
                    <View style={styles.dropdownList}>
                      {loadingDzongkhags ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#059669" />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {dzongkhags.map((dzongkhag, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                handlePickupDzongkhagSelect(dzongkhag);
                                setShowPickupDzongkhagDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{dzongkhag}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                {/* Pickup Gewog Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Gewog</Text>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, !pickupDzongkhag && styles.disabledDropdown]}
                    onPress={() => {
                      if (pickupDzongkhag) {
                        setShowPickupDzongkhagDropdown(false);
                        setShowPickupVillageDropdown(false);
                        setShowDropOffDzongkhagDropdown(false);
                        setShowDropOffTownDropdown(false);
                        setShowPickupGewogDropdown(!showPickupGewogDropdown);
                      }
                    }}
                    disabled={!pickupDzongkhag}
                  >
                    <Icon name="map" size={20} color={pickupDzongkhag ? "#6B7280" : "#D1D5DB"} style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, (!pickupGewog || !pickupDzongkhag) && styles.placeholderText]}>
                      {pickupGewog || (pickupDzongkhag ? 'Select Gewog' : 'Select Dzongkhag first')}
                    </Text>
                    <Icon 
                      name={showPickupGewogDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={pickupDzongkhag ? "#6B7280" : "#D1D5DB"} 
                    />
                  </TouchableOpacity>
                  
                  {showPickupGewogDropdown && pickupDzongkhag && (
                    <View style={styles.dropdownList}>
                      {loadingPickupGewogs ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#059669" />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {pickupGewogs.map((gewog, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                handlePickupGewogSelect(gewog.name);
                                setShowPickupGewogDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{gewog.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                {/* Pickup Village Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Village</Text>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, (!pickupDzongkhag || !pickupGewog) && styles.disabledDropdown]}
                    onPress={() => {
                      if (pickupDzongkhag && pickupGewog) {
                        setShowPickupDzongkhagDropdown(false);
                        setShowPickupGewogDropdown(false);
                        setShowDropOffDzongkhagDropdown(false);
                        setShowDropOffTownDropdown(false);
                        setShowPickupVillageDropdown(!showPickupVillageDropdown);
                      }
                    }}
                    disabled={!pickupDzongkhag || !pickupGewog}
                  >
                    <Icon name="home-city" size={20} color={(pickupDzongkhag && pickupGewog) ? "#6B7280" : "#D1D5DB"} style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, (!pickupVillage || !pickupDzongkhag || !pickupGewog) && styles.placeholderText]}>
                      {pickupVillage || ((pickupDzongkhag && pickupGewog) ? 'Select Village' : 'Select Gewog first')}
                    </Text>
                    <Icon 
                      name={showPickupVillageDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={(pickupDzongkhag && pickupGewog) ? "#6B7280" : "#D1D5DB"} 
                    />
                  </TouchableOpacity>
                  
                  {showPickupVillageDropdown && pickupDzongkhag && pickupGewog && (
                    <View style={styles.dropdownList}>
                      {loadingPickupVillages ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#059669" />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {pickupVillages.map((village, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                handlePickupVillageSelect(village);
                                setShowPickupVillageDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{village}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Drop-off Location Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Drop-off Location</Text>
                
                {/* Drop-off Dzongkhag Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Dzongkhag</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowPickupDzongkhagDropdown(false);
                      setShowPickupGewogDropdown(false);
                      setShowPickupVillageDropdown(false);
                      setShowDropOffTownDropdown(false);
                      setShowDropOffDzongkhagDropdown(!showDropOffDzongkhagDropdown);
                    }}
                  >
                    <Icon name="map-marker-check" size={20} color="#6B7280" style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, !dropOffDzongkhag && styles.placeholderText]}>
                      {dropOffDzongkhag || 'Select Dzongkhag'}
                    </Text>
                    <Icon name={showDropOffDzongkhagDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {showDropOffDzongkhagDropdown && (
                    <View style={styles.dropdownList}>
                      {loadingDzongkhags ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#059669" />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {dzongkhags.map((dzongkhag, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                handleDropOffDzongkhagSelect(dzongkhag);
                                setShowDropOffDzongkhagDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{dzongkhag}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                {/* Drop-off Town Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Town</Text>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, !dropOffDzongkhag && styles.disabledDropdown]}
                    onPress={() => {
                      if (dropOffDzongkhag) {
                        setShowPickupDzongkhagDropdown(false);
                        setShowPickupGewogDropdown(false);
                        setShowPickupVillageDropdown(false);
                        setShowDropOffDzongkhagDropdown(false);
                        setShowDropOffTownDropdown(!showDropOffTownDropdown);
                      }
                    }}
                    disabled={!dropOffDzongkhag}
                  >
                    <Icon name="home-map-marker" size={20} color={dropOffDzongkhag ? "#6B7280" : "#D1D5DB"} style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, (!dropOffTown || !dropOffDzongkhag) && styles.placeholderText]}>
                      {dropOffTown || (dropOffDzongkhag ? 'Select Town' : 'Select Dzongkhag first')}
                    </Text>
                    <Icon 
                      name={showDropOffTownDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={dropOffDzongkhag ? "#6B7280" : "#D1D5DB"} 
                    />
                  </TouchableOpacity>
                  
                  {showDropOffTownDropdown && dropOffDzongkhag && (
                    <View style={styles.dropdownList}>
                      {loadingDropOffTowns ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#059669" />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {dropOffTowns.map((town, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setDropOffTown(town);
                                setShowDropOffTownDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{town}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  filterText: {
    fontSize: 14,
    color: "#111827",
    marginRight: 4,
  },
  filterTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  filterIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
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
  statusOutforDelivery: {
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
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
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
  // Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsScroll: {
    flexDirection: 'row',
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  // New dropdown styles
  sectionContainer: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 48,
  },
  disabledDropdown: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#D1D5DB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 185, // Height for approximately 5 items
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 180, // Slightly less than dropdownList to ensure proper scrolling
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  // Test modal styles
  testModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  testModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    minWidth: '80%',
  },
  testModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 15,
    textAlign: 'center',
  },
  testModalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
    textAlign: 'center',
  },
  testModalButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  testModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  // Payment Styles
  paymentTableContainer: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  paymentTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  paymentTableCell: {
    flex: 1,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  paymentHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  paymentCellText: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  receivedButton: {
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  receivedButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  paymentListContainer: {
    flexGrow: 1,
  },
});