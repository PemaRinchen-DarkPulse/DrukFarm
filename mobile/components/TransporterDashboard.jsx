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
import { fetchTransporterOrders, fetchShippedOrders, updateOrderStatus, fetchDzongkhags, fetchTownsByDzongkhag } from '../lib/api';

const { height: screenHeight } = Dimensions.get('window');

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
  const [pickupTown, setPickupTown] = useState('');
  const [dropOffDzongkhag, setDropOffDzongkhag] = useState('');
  const [dropOffTown, setDropOffTown] = useState('');
  const slideAnim = useState(new Animated.Value(screenHeight))[0];
  
  // Data states
  const [dzongkhags, setDzongkhags] = useState([]);
  const [pickupTowns, setPickupTowns] = useState([]);
  const [dropOffTowns, setDropOffTowns] = useState([]);
  const [loadingDzongkhags, setLoadingDzongkhags] = useState(false);
  const [loadingPickupTowns, setLoadingPickupTowns] = useState(false);
  const [loadingDropOffTowns, setLoadingDropOffTowns] = useState(false);
  
  // Dropdown visibility states
  const [showPickupDzongkhagDropdown, setShowPickupDzongkhagDropdown] = useState(false);
  const [showPickupTownDropdown, setShowPickupTownDropdown] = useState(false);
  const [showDropOffDzongkhagDropdown, setShowDropOffDzongkhagDropdown] = useState(false);
  const [showDropOffTownDropdown, setShowDropOffTownDropdown] = useState(false);

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

  // Data loading functions
  const loadDzongkhags = useCallback(async () => {
    try {
      setLoadingDzongkhags(true);
      const data = await fetchDzongkhags();
      setDzongkhags(data);
    } catch (error) {
      console.error('Error loading dzongkhags:', error);
      Alert.alert('Error', 'Failed to load dzongkhags');
    } finally {
      setLoadingDzongkhags(false);
    }
  }, []);

  const loadPickupTowns = useCallback(async (dzongkhag) => {
    if (!dzongkhag) {
      setPickupTowns([]);
      return;
    }
    try {
      setLoadingPickupTowns(true);
      const data = await fetchTownsByDzongkhag(dzongkhag);
      setPickupTowns(data);
    } catch (error) {
      console.error('Error loading pickup towns:', error);
      Alert.alert('Error', 'Failed to load towns for pickup location');
      setPickupTowns([]);
    } finally {
      setLoadingPickupTowns(false);
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
    setPickupTown(''); // Reset town selection
    loadPickupTowns(dzongkhag);
  };

  const handleDropOffDzongkhagSelect = (dzongkhag) => {
    setDropOffDzongkhag(dzongkhag);
    setDropOffTown(''); // Reset town selection
    loadDropOffTowns(dzongkhag);
  };

  const applyFilters = () => {
    const filterData = {
      pickupDzongkhag,
      pickupTown,
      dropOffDzongkhag,
      dropOffTown
    };
    console.log('Applying filters:', filterData);
    closeBottomSheet();
  };

  const clearFilters = () => {
    setPickupDzongkhag('');
    setPickupTown('');
    setDropOffDzongkhag('');
    setDropOffTown('');
    setPickupTowns([]);
    setDropOffTowns([]);
    closeAllDropdowns();
  };

  const closeAllDropdowns = () => {
    setShowPickupDzongkhagDropdown(false);
    setShowPickupTownDropdown(false);
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

  // Debug effect to track modal visibility
  useEffect(() => {
    console.log('isFilterVisible changed to:', isFilterVisible);
  }, [isFilterVisible]);

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
          {(item.status === 'shipped' || item.status === 'Shipped') && !item.transporterId && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'accept')}
            >
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>
          )}
          {(item.status === 'Accepted' || item.status === 'out for delivery' || item.status === 'OUT_FOR_DELIVERY') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pickupButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'pickup')}
            >
              <Text style={styles.pickupButtonText}>Mark as Picked Up</Text>
            </TouchableOpacity>
          )}
          {item.status === 'PickedUp' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={() => handleOrderAction(item.orderId || item.id, 'deliver')}
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
    let filteredOrders = [];
    
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
        filteredOrders = orders.filter(order => 
          (order.transporterId === user?.id || order.transporterId === user?.cid) &&
          (order.status === 'Accepted' || 
          order.status === 'out for delivery' ||
          order.status === 'OUT_FOR_DELIVERY' ||
          order.status === 'PickedUp')
        );
        break;
      case "Completed":
        filteredOrders = orders.filter(order => 
          order.status === 'Delivered' || 
          order.status === 'delivered'
        );
        break;
      default:
        filteredOrders = [];
    }

    // Apply location filters if they exist
    if (pickupDzongkhag || pickupTown || dropOffDzongkhag || dropOffTown) {
      filteredOrders = filteredOrders.filter(order => {
        const matchesPickupDzongkhag = !pickupDzongkhag || 
          (order.pickupLocation && order.pickupLocation.toLowerCase().includes(pickupDzongkhag.toLowerCase())) ||
          (order.customerAddress && order.customerAddress.toLowerCase().includes(pickupDzongkhag.toLowerCase()));
        
        const matchesPickupTown = !pickupTown || 
          (order.pickupLocation && order.pickupLocation.toLowerCase().includes(pickupTown.toLowerCase())) ||
          (order.customerAddress && order.customerAddress.toLowerCase().includes(pickupTown.toLowerCase()));
        
        const matchesDropOffDzongkhag = !dropOffDzongkhag || 
          (order.deliveryLocation && order.deliveryLocation.toLowerCase().includes(dropOffDzongkhag.toLowerCase()));
          
        const matchesDropOffTown = !dropOffTown || 
          (order.deliveryLocation && order.deliveryLocation.toLowerCase().includes(dropOffTown.toLowerCase()));
          
        return matchesPickupDzongkhag && matchesPickupTown && matchesDropOffDzongkhag && matchesDropOffTown;
      });
    }

    return filteredOrders;
  };

  const tabs = ["Available", "My Delivery", "Completed"];

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
            (pickupDzongkhag || pickupTown || dropOffDzongkhag || dropOffTown) && styles.filterButtonActive
          ]} 
          onPress={() => {
            console.log('Filter button pressed');
            openBottomSheet();
          }}
        >
          <Text style={[
            styles.filterText,
            (pickupDzongkhag || pickupTown || dropOffDzongkhag || dropOffTown) && styles.filterTextActive
          ]}>
            Filter
          </Text>
          <Icon 
            name={pickupDzongkhag || pickupTown || dropOffDzongkhag || dropOffTown ? "filter" : "filter-outline"} 
            size={20} 
            color={(pickupDzongkhag || pickupTown || dropOffDzongkhag || dropOffTown) ? "#059669" : "#111827"} 
          />
          {(pickupDzongkhag || pickupTown || dropOffDzongkhag || dropOffTown) && (
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
                      setShowPickupTownDropdown(false);
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

                {/* Pickup Town Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Town</Text>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, !pickupDzongkhag && styles.disabledDropdown]}
                    onPress={() => {
                      if (pickupDzongkhag) {
                        setShowPickupDzongkhagDropdown(false);
                        setShowDropOffDzongkhagDropdown(false);
                        setShowDropOffTownDropdown(false);
                        setShowPickupTownDropdown(!showPickupTownDropdown);
                      }
                    }}
                    disabled={!pickupDzongkhag}
                  >
                    <Icon name="home-map-marker" size={20} color={pickupDzongkhag ? "#6B7280" : "#D1D5DB"} style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, (!pickupTown || !pickupDzongkhag) && styles.placeholderText]}>
                      {pickupTown || (pickupDzongkhag ? 'Select Town' : 'Select Dzongkhag first')}
                    </Text>
                    <Icon 
                      name={showPickupTownDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={pickupDzongkhag ? "#6B7280" : "#D1D5DB"} 
                    />
                  </TouchableOpacity>
                  
                  {showPickupTownDropdown && pickupDzongkhag && (
                    <View style={styles.dropdownList}>
                      {loadingPickupTowns ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#059669" />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {pickupTowns.map((town, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setPickupTown(town);
                                setShowPickupTownDropdown(false);
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
                      setShowPickupTownDropdown(false);
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
                        setShowPickupTownDropdown(false);
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
    maxHeight: 150,
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
    maxHeight: 140,
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
});