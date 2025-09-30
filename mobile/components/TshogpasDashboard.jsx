import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { ensureMediaLibraryImagePermission } from '../utils/imageDownloadSimple';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, fetchProducts, fetchCategories, createCategory, fetchTshogpasOrders, markOrderShipped, markOrderConfirmed, downloadOrderImage, fetchUserDispatchAddresses, updateOrderStatus, confirmTshogpaPayment, getPaymentStatus, autoInitializePaymentFlows } from '../lib/api';
import { downloadOrderImageToGallery } from '../utils/imageDownloadSimple';

import { resolveProductImage } from '../lib/image';
import { useAuth, getCurrentCid } from '../lib/auth';
import HiddenOrderImage from './ui/HiddenOrderImage';

// CustomDropdown component
const LIST_MAX = 160;
function CustomDropdown({ options, value, onChange, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (option) => {
      onChange(option);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        activeOpacity={0.8}
        onPress={handleToggle}
      >
        <Text
          style={[styles.dropdownText, !value && styles.placeholderTextDropdown]}
          numberOfLines={1}
        >
          {(() => {
            if (!value) return placeholder;
            // Find the option that matches the current value
            const selectedOption = options.find(opt => 
              typeof opt === 'object' ? opt.value === value : opt === value
            );
            return selectedOption 
              ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
              : value;
          })()}
        </Text>
        <Icon
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: LIST_MAX }} nestedScrollEnabled>
            {options.map((opt, index) => {
              const optionKey = typeof opt === 'object' ? opt.value || opt.label || index : opt;
              const optionLabel = typeof opt === 'object' ? opt.label : opt;
              const optionValue = typeof opt === 'object' ? opt.value : opt;
              
              return (
                <TouchableOpacity
                  key={optionKey}
                  style={[
                    styles.dropdownItem,
                    value === optionValue && styles.dropdownItemActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(typeof opt === 'object' ? opt : opt)}
                >
                  <Text style={styles.dropdownItemText}>{optionLabel}</Text>
                  {value === optionValue ? (
                    <Icon name="check" size={18} color="#059669" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function TshogpasDashboard({ navigation }) {
  const { user } = useAuth();
  const screenDimensions = Dimensions.get('window');
  const MODAL_HEIGHT = screenDimensions.height * 0.85;
  const MODAL_WIDTH = screenDimensions.width * 0.9;
  
  // Authentication check - redirect if user is not logged in or not a tshogpas
  useEffect(() => {
    if (!user || !user.cid || String(user.role || '').toLowerCase() !== 'tshogpas') {
      console.log('User not authenticated as tshogpas, redirecting to Home');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      return;
    }
  }, [user, navigation]);
  
  const [activeTab, setActiveTab] = useState("Orders");
  const [orderSubTab, setOrderSubTab] = useState("All");
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Helper function to request storage permissions on Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Expo Go, we'll skip native storage permissions and rely on MediaLibrary only
        // This prevents the app from getting stuck on permission requests
        console.log('Running in Expo Go - skipping native storage permission');
        return false; // Always return false to use MediaLibrary-only approach
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS doesn't need explicit storage permission for MediaLibrary
  };

  // State for new product form fields
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [productStockQuantity, setProductStockQuantity] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  // Track keyboard height (Android) so we can add bottom padding instead of shrinking modal
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  // Keep a stable reference to full screen height (unaffected by keyboard) for modal sizing
  const screenHeightRef = useRef(Dimensions.get('screen').height);

  // Categories fetched from backend
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const unitOptions = ["Kg", "g", "L", "ml", "Dozen", "Pcs"];

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [downloadingImage, setDownloadingImage] = useState(null);
  const hiddenImgRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  // Payment-related state for Tshogpas
  const [paymentTab, setPaymentTab] = useState("Pending");
  const [paymentFilter, setPaymentFilter] = useState("Earning"); // "Earning" or "Dispatched"
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Debug: Log when paymentFilter changes
  useEffect(() => {
    console.log('PaymentFilter changed to:', paymentFilter);
    if (paymentFilter === "Dispatched") {
      console.log('Dispatched filter active - should show all shipped orders');
    }
  }, [paymentFilter]);

  const getProducts = async () => {
    try {
      setLoading(true);
      const fetched = await fetchProducts();
      console.log('Fetched products:', JSON.stringify(fetched[0], null, 2)); // Debug log
      const normalized = Array.isArray(fetched) ? fetched
        .filter(p => p.createdBy === user?.cid) // Filter for current seller only
        .map(p => ({
          id: String(p.productId || p._id || ''),
          productId: String(p.productId || p._id || ''),
          productName: p.productName,
          name: p.productName,
          categoryName: p.categoryName,
          description: p.description,
          price: p.price,
          unit: p.unit,
          stockQuantity: p.stockQuantity,
          stockUnit: p.unit,
          rating: p.rating,
          productImageUrl: p.productImageUrl,
          productImageBase64: p.productImageBase64,
          productImage: p.productImage,
          image: p.image,
        })) : [];
      console.log('Normalized product:', JSON.stringify(normalized[0], null, 2)); // Debug log
      setProducts(normalized);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getOrders = async () => {
    try {
      setOrdersLoading(true);
      const cid = getCurrentCid();
      console.log('TshogpasDashboard getOrders called with CID:', cid);
      if (!cid) {
        console.log('No CID available, skipping order fetch');
        setOrders([]);
        return;
      }
      
      console.log('Calling fetchTshogpasOrders with CID:', cid);
      const fetched = await fetchTshogpasOrders({ cid });
      console.log('Fetched tshogpas orders response:', fetched);
      console.log('Raw orders count:', fetched?.orders?.length || 0);
      
      if (fetched?.orders && fetched.orders.length > 0) {
        console.log('Sample raw order from API:', JSON.stringify(fetched.orders[0], null, 2));
        console.log('All order statuses:', fetched.orders.map(o => o.status));
        console.log('Sample buyer data:', {
          buyer: fetched.orders[0]?.buyer,
          userSnapshot: fetched.orders[0]?.userSnapshot,
          totalPrice: fetched.orders[0]?.totalPrice,
          quantity: fetched.orders[0]?.quantity,
          createdAt: fetched.orders[0]?.createdAt
        });
        
        // Check for specific shipped orders
        const shippedOrders = fetched.orders.filter(o => o.status?.toLowerCase() === 'shipped');
        console.log('Found shipped orders:', shippedOrders.length);
        if (shippedOrders.length > 0) {
          console.log('Sample shipped order:', JSON.stringify(shippedOrders[0], null, 2));
        }
      }
      
      const normalized = Array.isArray(fetched?.orders) ? fetched.orders
        .map((o, index) => {
          console.log(`Processing order ${index + 1}:`, {
            id: o._id,
            orderId: o.orderId,
            status: o.status,
            productName: o.product?.name,
            productSeller: o.product?.sellerCid
          });
          return {
            orderId: String(o.orderId || o._id || ''),
            _id: String(o._id || o.orderId || ''),
            id: String(o.orderId || o._id || ''),
            customerName: o.buyer?.name || 'Unknown',
            customerCid: o.buyer?.cid,
            product: {
              name: o.product?.name || 'Unknown Product',
              price: o.product?.price || 0,
              productImageBase64: o.product?.productImageBase64,
              productImageUrl: o.product?.productImageUrl,
              sellerCid: o.product?.sellerCid,
              sellerName: o.product?.sellerName || 'Unknown Seller'
            },
            buyer: {
              name: o.buyer?.name || 'Unknown',
              cid: o.buyer?.cid,
              phone: o.buyer?.phoneNumber, // Backend sends phoneNumber
              phoneNumber: o.buyer?.phoneNumber, // Keep original field too
              address: o.buyer?.location // Backend sends location
            },
            quantity: o.quantity || 1,
            totalAmount: o.totalPrice || 0, // Backend sends totalPrice
            totalPrice: o.totalPrice || 0, // Keep original field too
            status: o.status || 'unknown',
            orderDate: o.createdAt, // Backend sends createdAt
            createdAt: o.createdAt, // Keep original field too
            deliveryAddress: o.deliveryAddress || o.buyer?.location, // Fallback to buyer location
            qrCodeDataUrl: o.qrCodeDataUrl
          };
        }) : [];
      
      console.log('Normalized orders count:', normalized.length);
      console.log('Sample normalized order:', JSON.stringify(normalized[0], null, 2));
      if (normalized[0]) {
        console.log('Sample buyer phone data:', {
          phone: normalized[0].buyer?.phone,
          phoneNumber: normalized[0].buyer?.phoneNumber,
          originalBuyer: fetched?.orders?.[0]?.buyer
        });
      }
      
      console.log('Setting orders state with:', normalized.length, 'orders');
      setOrders(normalized);
    } catch (error) {
      console.error('Error fetching tshogpas orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getPaymentOrders = async () => {
    try {
      setPaymentLoading(true);
      const cid = getCurrentCid();
      console.log('getPaymentOrders called with CID:', cid, 'type:', typeof cid);
      if (!cid) {
        console.log('No CID available, skipping payment order fetch');
        setPaymentOrders([]);
        return;
      }
      
      // Auto-initialize payment flows for orders that need them
      try {
        await autoInitializePaymentFlows({ cid });
        console.log('Auto-initialized payment flows');
      } catch (error) {
        console.warn('Failed to auto-initialize payment flows:', error);
      }
      
      // Fetch orders for payment dashboard
      console.log('Fetching payment orders...');
      const fetched = await fetchTshogpasOrders({ cid });
      console.log('Payment orders API response:', {
        success: fetched?.success,
        ordersCount: fetched?.orders?.length || 0
      });
      
      const ordersList = fetched?.orders || [];
      console.log('Raw payment orders:', ordersList.length);
      
      if (ordersList.length > 0) {
        console.log('Sample payment order from backend:', JSON.stringify(ordersList[0], null, 2));
        console.log('Backend order field mapping check:', {
          hasSellerName: !!ordersList[0]?.product?.sellerName,
          hasDeliveryAddress: !!ordersList[0]?.deliveryAddress,
          buyerLocation: ordersList[0]?.buyer?.location,
          productFields: Object.keys(ordersList[0]?.product || {}),
          buyerFields: Object.keys(ordersList[0]?.buyer || {})
        });
        console.log('Payment order statuses:', ordersList.map(o => o.status));
        console.log('Shipped payment orders:', ordersList.filter(o => o.status?.toLowerCase() === 'shipped').length);
      }
      
      // Show ALL orders that were shipped by this Tshogpa (regardless of current status)
      // This includes orders that have been shipped, delivered, completed, etc.
      const allOrders = ordersList.map(o => {
        const currentCid = String(cid); // Ensure string comparison
        const productSellerCid = String(o.product?.sellerCid || '');
        const tshogpasCid = String(o.tshogpasCid || '');
        const isOwnProduct = productSellerCid === currentCid;
        const isDispatched = tshogpasCid === currentCid;
        
        console.log(`Processing payment order ${o.orderId || o._id}:`, {
          currentCid,
          productSellerCid,
          tshogpasCid,
          isOwnProduct,
          isDispatched,
          status: o.status,
          productName: o.product?.name
        });
        
        return {
          orderId: String(o.orderId || o._id || ''),
          product: {
            name: o.product?.name || 'Unknown Product',
            price: o.product?.price || 0,
            sellerCid: productSellerCid,
            sellerName: o.product?.sellerName || 'Unknown Seller'
          },
          buyer: {
            name: o.buyer?.name || 'Unknown',
            cid: o.buyer?.cid
          },
          farmer: {
            name: o.product?.sellerName || 'Unknown Farmer',
            cid: productSellerCid
          },
          transporter: {
            name: o.transporter?.name || 'Unknown Transporter',
            cid: o.transporter?.cid
          },
          totalPrice: o.totalPrice || 0, // Backend sends totalPrice
          status: o.status || 'unknown',
          quantity: o.quantity || 1,
          orderDate: o.createdAt, // Backend sends createdAt
          deliveryAddress: o.deliveryAddress || o.buyer?.location,
          settlementDate: o.settlementDate,
          transporterSettlementDate: o.transporterSettlementDate,
          farmerSettlementDate: o.farmerSettlementDate,
          tshogpasCid: tshogpasCid, // Track who shipped this order
          isOwnProduct: isOwnProduct, // Is this their own product
          isDispatched: isDispatched // Did this Tshogpa dispatch this order
        };
      });
      
      console.log('Mapped payment orders:', allOrders.length);
      if (allOrders.length > 0) {
        console.log('Sample mapped payment order:', JSON.stringify(allOrders[0], null, 2));
        console.log('Mapped payment order statuses:', allOrders.map(o => o.status));
        console.log('Orders dispatched by this Tshogpa:', allOrders.filter(o => o.isDispatched).length);
        console.log('Orders for this Tshogpa\'s own products:', allOrders.filter(o => o.isOwnProduct).length);
        
        // Debug: Show which orders are own products
        const ownProductOrders = allOrders.filter(o => o.isOwnProduct);
        console.log('Own product orders details:', ownProductOrders.map(o => ({
          orderId: o.orderId,
          status: o.status,
          productName: o.product.name,
          productSellerCid: o.product.sellerCid,
          currentCid: String(cid)
        })));
        
        // Debug: Show ALL orders and their relationship to current user
        console.log('All order relationships:', allOrders.map(o => ({
          orderId: o.orderId,
          isOwnProduct: o.isOwnProduct,
          isDispatched: o.isDispatched,
          status: o.status,
          productSellerCid: o.product.sellerCid,
          tshogpasCid: o.tshogpasCid,
          currentCid: String(cid)
        })));
        
        // Debug: Check if there are any orders that should be own products
        const shouldBeOwnProducts = allOrders.filter(o => {
          const match = String(o.product.sellerCid) === String(cid);
          if (match && !o.isOwnProduct) {
            console.warn('Order should be own product but isOwnProduct is false:', {
              orderId: o.orderId,
              productSellerCid: o.product.sellerCid,
              currentCid: String(cid),
              match
            });
          }
          return match;
        });
        console.log('Orders that should be own products:', shouldBeOwnProducts.length);
      }
      
      setPaymentOrders(allOrders);
    } catch (error) {
      console.error('Error fetching payment orders:', error);
      Alert.alert('Error', 'Failed to fetch payment orders.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const fetched = await fetchCategories();
      const names = Array.isArray(fetched) ? fetched.map(c => c.categoryName).sort() : [];
      const map = Array.isArray(fetched) ? fetched.reduce((acc, c) => {
        acc[c.categoryName] = c.categoryId;
        return acc;
      }, {}) : {};
      setCategoryOptions(names);
      setCategoriesMap(map);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    console.log('TshogpasDashboard useEffect triggered with:', {
      userCid: user?.cid,
      userRole: user?.role,
      activeTab
    });
    
    if (user?.cid && String(user.role || '').toLowerCase() === 'tshogpas') {
      console.log('User authenticated as tshogpas, loading data for tab:', activeTab);
      if (activeTab === "Products") {
        getProducts();
      } else if (activeTab === "Orders") {
        console.log('Loading orders for tshogpas...');
        getOrders();
      } else if (activeTab === "Payments") {
        console.log('Loading payment orders for tshogpas...');
        getPaymentOrders();
      }
      getCategories();
    } else {
      console.log('User not authenticated as tshogpas or missing data:', {
        userExists: !!user,
        hasCid: !!user?.cid,
        role: user?.role,
        roleCheck: String(user?.role || '').toLowerCase() === 'tshogpas'
      });
    }
  }, [user, activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "Products") {
        console.log('[Tshogpa] Refreshing products...');
        await getProducts();
      } else if (activeTab === "Orders") {
        console.log('[Tshogpa] Refreshing orders...');
        await getOrders();
      } else if (activeTab === "Payments") {
        console.log('[Tshogpa] Refreshing payment orders...');
        await getPaymentOrders();
      }
    } catch (error) {
      console.error('[Tshogpa] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  const forceRefreshPaymentOrders = async () => {
    try {
      console.log('[Payment Refresh] Force refreshing payment orders...');
      await getPaymentOrders();
      console.log('[Payment Refresh] Payment orders refreshed successfully');
    } catch (error) {
      console.error('[Payment Refresh] Failed to refresh payment orders:', error);
      Alert.alert('Refresh Failed', 'Failed to refresh payment data. Please try again.');
    }
  };

  const handleMarkPaymentReceived = async (orderId) => {
    try {
      // Find the specific order to validate
      const order = paymentOrders.find(o => o.orderId === orderId || o.id === orderId);
      if (!order) {
        Alert.alert('Error', 'Order not found');
        return;
      }

      // Enhanced validation for order status
      if (order.status?.toLowerCase() !== 'delivered') {
        Alert.alert(
          'Cannot Confirm Payment', 
          `Order must be delivered before payment can be confirmed.\n\nCurrent status: ${order.status || 'Unknown'}`
        );
        return;
      }

      // Check if tshogpa is also the seller (special case)
      const isTshogpaSeller = order.product?.sellerCid === user?.cid;
      
      // FRONTEND HIERARCHY VALIDATION: Check if prerequisites are met
      if (!isTshogpaSeller && order.transporter?.cid && order.paymentFlow) {
        // If there's a transporter and tshogpa is not the seller, check hierarchy
        const transporterStep = order.paymentFlow.find(s => s.step === 'consumer_to_transporter');
        if (transporterStep && transporterStep.status !== 'completed') {
          Alert.alert(
            'Cannot Confirm Payment',
            'The transporter must confirm their payment first before you can confirm yours. Please contact the transporter to complete their payment step.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      const paymentStepDescription = isTshogpaSeller 
        ? 'This will complete the payment workflow since you are both the tshogpa and seller.'
        : 'This will complete the transporter → tshogpa payment step.';

      Alert.alert(
        'Confirm Payment Receipt',
        `Confirm that you have received payment for Order #${(orderId || '').slice(-6)}?\n\n${paymentStepDescription}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Payment',
            style: 'default',
            onPress: async () => {
              try {
                // Show loading state
                console.log(`[Tshogpa Payment] Confirming payment for order: ${orderId}`, {
                  isTshogpaSeller,
                  tshogpasCid: user?.cid,
                  sellerCid: order.product?.sellerCid
                });
                
                // Use the payment workflow API with enhanced error handling
                console.log(`[Frontend] About to call confirmTshogpaPayment for order: ${orderId}`);
                const confirmationResult = await confirmTshogpaPayment({ orderId, cid: user?.cid });
                console.log(`[Frontend] confirmTshogpaPayment result:`, confirmationResult);
                
                // Check if payment was already completed
                if (confirmationResult.alreadyCompleted) {
                  console.log(`[Tshogpa Payment] Payment was already completed for order: ${orderId}`);
                  
                  // Update local state to ensure it shows in completed tab
                  setPaymentOrders(prevOrders => 
                    prevOrders.map(order => 
                      (order.orderId === orderId || order.id === orderId)
                        ? { 
                            ...order, 
                            paymentConfirmedBy: 'tshogpa',
                            paymentConfirmedAt: new Date().toISOString(),
                            settlementDate: new Date().toISOString(),
                            // Ensure paymentFlow shows completion
                            paymentFlow: (order.paymentFlow || []).map(step => {
                              if (step.step === 'transporter_to_tshogpa' || step.step === 'consumer_to_tshogpa') {
                                return { ...step, status: 'completed', timestamp: step.timestamp || new Date().toISOString() };
                              }
                              return step;
                            })
                          }
                        : order
                    )
                  );
                  
                  // Switch to Completed tab to show the result
                  setPaymentTab('Completed');
                  
                  Alert.alert(
                    'Payment Already Confirmed', 
                    'This payment was already confirmed previously. You can view it in the Completed tab.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                
                console.log(`[Tshogpa Payment] Payment confirmed successfully for order: ${orderId}`);
                
                // Update local state FIRST to ensure immediate UI update
                setPaymentOrders(prevOrders => 
                  prevOrders.map(order => 
                    (order.orderId === orderId || order.id === orderId)
                      ? { 
                          ...order, 
                          status: isTshogpaSeller ? 'completed' : 'payment received', 
                          settlementDate: new Date().toISOString(),
                          paymentConfirmedBy: 'tshogpa',
                          paymentConfirmedAt: new Date().toISOString(),
                          isPaid: isTshogpaSeller, // Mark as fully paid if tshogpa is seller
                          // Update paymentFlow to mark tshogpa step as completed
                          paymentFlow: (order.paymentFlow || []).map(step => {
                            if (step.step === 'transporter_to_tshogpa' || step.step === 'consumer_to_tshogpa') {
                              return { ...step, status: 'completed', timestamp: new Date().toISOString() };
                            }
                            return step;
                          })
                        }
                      : order
                  )
                );
                
                // Switch to Completed tab to show the result immediately
                setPaymentTab('Completed');
                
                  // Then refresh payment data from server to get latest status (but don't overwrite local state)
                try {
                  await getPaymentOrders();
                  console.log('[Tshogpa Payment] Successfully refreshed payment orders after confirmation');
                } catch (refreshError) {
                  console.warn('Failed to refresh payment orders after confirmation:', refreshError);
                  // Continue with local state - don't fail the whole operation
                }
                
                const successMessage = isTshogpaSeller
                  ? 'Payment workflow completed! Since you are both the tshogpa and seller, the entire payment flow is now complete.'
                  : 'Payment has been successfully confirmed and recorded in the system.';
                
                Alert.alert(
                  'Payment Confirmed', 
                  successMessage,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('[Tshogpa Payment] Confirmation error:', error);
                console.error('[Tshogpa Payment] Error details:', {
                  message: error.message,
                  body: error.body,
                  status: error.status,
                  response: error.response
                });
                
                // Enhanced error handling with specific messages
                let errorMessage = 'Unknown error occurred';
                
                if (error.body && typeof error.body === 'object') {
                  errorMessage = error.body.error || error.body.message || JSON.stringify(error.body);
                } else if (error.message) {
                  errorMessage = error.message;
                }
                
                console.log('[Tshogpa Payment] Parsed error message:', errorMessage);
                
                if (errorMessage.includes('Order has not been delivered')) {
                  Alert.alert(
                    'Cannot Confirm Payment',
                    'Order status indicates it has not been delivered yet. Please ensure the order is marked as delivered before confirming payment.'
                  );
                } else if (errorMessage.includes('Payment already confirmed')) {
                  Alert.alert(
                    'Already Confirmed',
                    'This payment has already been confirmed. Check the Completed tab to see the status.'
                  );
                } else if (errorMessage.includes('Only the assigned tshogpa')) {
                  Alert.alert(
                    'Permission Denied',
                    'You are not authorized to confirm payment for this order.'
                  );
                } else if (errorMessage.includes('Previous step') && errorMessage.includes('must be completed first')) {
                  Alert.alert(
                    'Payment Step Order Error',
                    'The payment workflow must be completed in order. A previous payment step is still pending.'
                  );
                } else {
                  Alert.alert(
                    'Payment Confirmation Failed',
                    `Unable to confirm payment: ${errorMessage}`
                  );
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Tshogpa Payment] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred while processing payment confirmation.');
    }
  };

  // Keyboard event listeners for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardPadding(e.endCoordinates.height);
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardPadding(0);
      });

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }
  }, []);

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log(`Delete product ${productId}`) },
      ]
    );
  };

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setProductImage({ uri: asset.uri, base64: asset.base64, mime: asset.mimeType || 'image/jpeg' });
  };

  const handleSelectCategoryImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setNewCategoryImage({ uri: asset.uri, base64: asset.base64, mime: asset.mimeType || 'image/jpeg' });
  };

  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryImage(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryDescription.trim() || !newCategoryImage) {
      Alert.alert('Error', 'Please fill category name, description and image.');
      return;
    }
    if (newCategoryDescription.trim().length < 15 || newCategoryDescription.trim().length > 45) {
      Alert.alert('Error', 'Description must be 15-45 characters.');
      return;
    }
    try {
      setCreatingCategory(true);
      const payload = {
        categoryName: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        imageBase64: newCategoryImage.base64,
      };
      const created = await createCategory(payload);
      setCategoryOptions(prev => [...new Set([...prev, created.categoryName])].sort());
      setCategoriesMap(prev => ({ ...prev, [created.categoryName]: created.categoryId }));
      setProductCategory(created.categoryName);
      resetCategoryForm();
      setShowAddCategory(false);
      Alert.alert('Success', 'Category created.');
    } catch (e) {
      console.log('Create category error', e);
      Alert.alert('Error', e.body?.error || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      "Remove Image",
      "Are you sure you want to remove this image?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => setProductImage(null) },
      ]
    );
  };

  const handleAddProduct = async () => {
    if (!productName || !productCategory || !productDescription || !productPrice || !productUnit || !productStockQuantity || !productImage) {
      Alert.alert("Error", "Please fill all fields and upload an image.");
      return;
    }
    if (productDescription.length < 70 || productDescription.length > 150) {
      Alert.alert("Error", "Description must be between 70 and 150 characters.");
      return;
    }

    const resolvedCategoryId = categoriesMap[productCategory] || productCategory;
    const productData = {
      productName,
      categoryId: resolvedCategoryId,
      description: productDescription,
      price: parseFloat(productPrice),
      unit: productUnit,
      stockQuantity: parseInt(productStockQuantity),
      productImageBase64: productImage.base64,
      createdBy: user?.cid,
    };

    try {
      await createProduct(productData);
      Alert.alert("Success", "Product added successfully!");
      setShowAddProductModal(false);
      getProducts();
      setProductName("");
      setProductCategory("");
      setProductDescription("");
      setProductPrice("");
      setProductUnit("");
      setProductStockQuantity("");
      setProductImage(null);
    } catch (error) {
      Alert.alert("Error", "Failed to add product.");
    }
  };

  const handleEditProduct = (productId) => {
    Alert.alert("Edit Product", `You want to edit product ID: ${productId}`);
  };

  const handleMarkConfirmed = async (orderId, isSelfPurchase = false) => {
    try {
      // Check if tshogpas has at least one dispatch address
      const cid = getCurrentCid();
      if (!cid) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const dispatchAddresses = await fetchUserDispatchAddresses(cid);
      
      if (!dispatchAddresses || dispatchAddresses.length === 0) {
        Alert.alert(
          "No Dispatch Address",
          "Please add your dispatch address before confirming orders.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Address",
              onPress: () => {
                navigation.navigate('DispatchAddress');
              }
            }
          ]
        );
        return;
      }

      // For Tshogpas, confirming an order moves it directly to "shipped" status
      const response = await markOrderConfirmed({ orderId, cid: user?.cid });
      
      if (response.success) {
        // Update local state to reflect the new status (shipped for Tshogpas)
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId || order._id === orderId
              ? { ...order, status: 'shipped' }
              : order
          )
        );

        Alert.alert("Success", isSelfPurchase ? "Order accepted and shipped!" : "Order confirmed and shipped!");
        
        // Switch to Confirmed tab to show the updated order
        setOrderSubTab("Confirmed");
      }
    } catch (error) {
      console.error('Confirm order error:', error);
      
      // Check if the error is about missing dispatch address
      if (error.body?.error === 'Please add your dispatch address') {
        Alert.alert(
          "No Dispatch Address",
          "Please add your dispatch address before confirming orders.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Address",
              onPress: () => {
                navigation.navigate('DispatchAddress');
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", error.body?.error || "Failed to confirm order.");
      }
    }
  };

  const handleDownloadConfirmedOrderImage = async (orderId) => {
    if (downloadingImage === orderId) {
      console.log('Image download already in progress for order:', orderId);
      return;
    }

    try {
      setDownloadingImage(orderId);
      
      const hasStoragePermission = await requestStoragePermission();
      await downloadAndSaveImage(orderId, hasStoragePermission);
      
    } catch (error) {
      console.log('Download Image error:', error);
      Alert.alert('Error', 'Failed to download order image');
    } finally {
      setDownloadingImage(null);
    }
  };

  // Helper function to handle the image download and saving process
  const downloadAndSaveImage = async (orderId, hasStoragePermission) => {
    const cid = getCurrentCid();
    
    try {
      console.log('Starting custom order card generation for order:', orderId);
      
      // Find the order in our local orders list to get complete data
      const orderData = orders.find(o => {
        const oId = String(o.orderId || o._id || '');
        return oId === String(orderId);
      });
      
      if (!orderData) {
        console.log('Order not found in local list, fetching from server...');
        Alert.alert('Error', 'Order not found.');
        return;
      }
      
      // Use HiddenOrderImage component to generate and save custom order card
      const success = await hiddenImgRef.current?.captureAndSave(orderData);
      
      if (success) {
        console.log('Custom order card generated and saved successfully');
      } else {
        console.log('Order card generation failed');
        Alert.alert('Error', 'Failed to generate order card. Please try again.');
      }
      
    } catch (error) {
      console.log('downloadAndSaveImage error:', error);
      Alert.alert('Download Error', `Failed to generate order card: ${error.message || 'Unknown error'}`);
    }
  };

  const getFilteredOrders = () => {
    console.log('getFilteredOrders called with:', {
      orderSubTab,
      totalOrders: orders.length,
      orders: orders.map(o => ({ orderId: o.orderId, status: o.status, isOwnProduct: o.product?.sellerCid === user?.cid }))
    });
    
    // First filter to only show orders for Tshogpa's own products
    const ownProductOrders = orders.filter(o => {
      const isOwnProduct = String(o.product?.sellerCid) === String(user?.cid);
      console.log(`Order ${o.orderId} - isOwnProduct: ${isOwnProduct} (sellerCid: ${o.product?.sellerCid}, userCid: ${user?.cid})`);
      return isOwnProduct;
    });
    
    console.log('Own product orders:', ownProductOrders.length);
    
    let filtered;
    switch (orderSubTab) {
      case "Pending":
        // Show orders that are placed but not yet confirmed/shipped
        filtered = ownProductOrders.filter(o => {
          const status = o.status?.toLowerCase();
          return status === 'order placed';
        });
        break;
      case "Confirmed":
        // Show orders that are shipped
        filtered = ownProductOrders.filter(o => {
          const status = o.status?.toLowerCase();
          return status === 'shipped';
        });
        break;
      case "All":
      default:
        // Show ALL own product orders regardless of status
        filtered = ownProductOrders;
    }
    
    console.log('Filtered orders for tab', orderSubTab + ':', {
      count: filtered.length,
      orders: filtered.map(o => ({ orderId: o.orderId, status: o.status, productName: o.product?.name }))
    });
    
    return filtered;
  };

  const getFilteredPaymentOrders = () => {
    console.log('getFilteredPaymentOrders called with:', {
      paymentFilter,
      paymentTab,
      paymentOrdersCount: paymentOrders?.length || 0
    });
    
    if (!paymentOrders) {
      console.log('No payment orders available');
      return [];
    }
    
    console.log('All payment orders statuses:', paymentOrders.map(o => o.status));
    console.log('All payment orders detail:', paymentOrders.map(o => ({
      orderId: o.orderId,
      status: o.status,
      isOwnProduct: o.isOwnProduct,
      isDispatched: o.isDispatched,
      productSellerCid: o.product?.sellerCid,
      tshogpasCid: o.tshogpasCid,
      productSellerName: o.product?.sellerName,
      farmerName: o.farmer?.name
    })));
    
    let filtered = paymentOrders;
    
    // Filter by view type (Earning vs Dispatched)
    if (paymentFilter === "Earning") {
      // Show orders for Tshogpas' own products only (where they are the seller)
      // Apply both product ownership and payment status filtering
      filtered = paymentOrders.filter(order => {
        const isOwnProduct = order.isOwnProduct === true;
        const hasPaymentRelevantStatus = ['shipped', 'delivered', 'completed', 'payment pending', 'out for delivery', 'payment received'].includes(order.status?.toLowerCase());
        
        console.log(`Earning - Order ${order.orderId}:`, {
          status: order.status,
          isOwnProduct,
          hasPaymentRelevantStatus,
          productSellerCid: order.product?.sellerCid,
          currentUserCid: getCurrentCid(),
          productSellerName: order.product?.sellerName,
          willShow: isOwnProduct && hasPaymentRelevantStatus
        });
        
        // Show orders for own products that have payment-relevant statuses
        return isOwnProduct && hasPaymentRelevantStatus;
      });
      console.log('Earning view filtered orders (own products with payment status):', filtered.length);
      console.log('Earning view orders detail:', filtered.map(o => ({
        orderId: o.orderId,
        productName: o.product?.name,
        status: o.status,
        sellerName: o.product?.sellerName
      })));
    } else if (paymentFilter === "Dispatched") {
      // Show ONLY orders that were actually dispatched/shipped by this Tshogpa
      // Filter by isDispatched flag and shipped status
      const dispatchedOrders = paymentOrders.filter(order => {
        const status = order.status?.toLowerCase();
        const wasDispatchedByThisTshogpa = order.isDispatched === true;
        const hasShippedStatus = ['shipped', 'delivered', 'completed', 'payment pending', 'out for delivery', 'payment received'].includes(status);
        
        console.log(`Dispatched - Order ${order.orderId}:`, {
          status,
          isDispatched: order.isDispatched,
          tshogpasCid: order.tshogpasCid,
          wasDispatchedByThisTshogpa,
          hasShippedStatus,
          willShow: wasDispatchedByThisTshogpa && hasShippedStatus
        });
        
        return wasDispatchedByThisTshogpa && hasShippedStatus;
      });
      console.log('Dispatched view filtered orders:', dispatchedOrders.length);
      filtered = dispatchedOrders;
    }
    
    // Enhanced filter by payment status (Pending vs Completed) - Apply to both Earning and Dispatched
    console.log(`[Filter Debug] Filtering for ${paymentTab} tab, ${paymentFilter} view`);
    console.log(`[Filter Debug] Orders before status filtering:`, filtered.map(o => ({
      orderId: o.orderId,
      status: o.status,
      paymentConfirmedBy: o.paymentConfirmedBy,
      paymentConfirmedAt: o.paymentConfirmedAt,
      settlementDate: o.settlementDate,
      isPaid: o.isPaid,
      paymentFlow: o.paymentFlow ? o.paymentFlow.map(s => `${s.step}:${s.status}`) : []
    })));
    
    if (paymentTab === "Pending") {
      // Show orders where payment is still pending
      const pendingFiltered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || '';
        const hasSettlementDate = order.settlementDate || order.paymentConfirmedAt;
        const isPaymentCompleted = ['payment received', 'completed', 'settled'].includes(status);
        const isPaid = order.isPaid === true;
        const paymentConfirmedBy = order.paymentConfirmedBy;
        
        // Check payment flow for tshogpa payment completion
        const hasTshogpaPaymentCompleted = order.paymentFlow && order.paymentFlow.find(step => 
          (step.step === 'transporter_to_tshogpa' || step.step === 'consumer_to_tshogpa') && 
          step.status === 'completed'
        );
        
        // Order is pending if payment is NOT completed and no settlement date and not paid and not confirmed AND paymentFlow doesn't show completion
        const isPending = !isPaymentCompleted && !hasSettlementDate && !isPaid && !paymentConfirmedBy && !hasTshogpaPaymentCompleted;
        
        console.log(`Pending check for order ${order.orderId}:`, {
          status,
          hasSettlementDate: !!hasSettlementDate,
          isPaymentCompleted,
          isPaid,
          paymentConfirmedBy,
          hasTshogpaPaymentCompleted: !!hasTshogpaPaymentCompleted,
          paymentFlowSteps: order.paymentFlow ? order.paymentFlow.map(s => `${s.step}:${s.status}`) : [],
          isPending
        });
        
        return isPending;
      });
      console.log(`${paymentFilter} - Pending payment filtered orders:`, pendingFiltered.length);
      return pendingFiltered;
    } else if (paymentTab === "Completed") {
      // Show orders where payment has been received/completed
      const completedFiltered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || '';
        const hasSettlementDate = order.settlementDate || order.paymentConfirmedAt;
        const isPaymentCompleted = ['payment received', 'completed', 'settled'].includes(status);
        const isPaid = order.isPaid === true;
        const paymentConfirmedBy = order.paymentConfirmedBy;
        
        // Check payment flow for tshogpa payment completion
        const hasTshogpaPaymentCompleted = order.paymentFlow && order.paymentFlow.find(step => 
          (step.step === 'transporter_to_tshogpa' || step.step === 'consumer_to_tshogpa') && 
          step.status === 'completed'
        );
        
        // Order is completed if payment confirmed or has settlement date or is marked as paid or payment flow shows completion
        const isCompleted = isPaymentCompleted || hasSettlementDate || isPaid || paymentConfirmedBy || hasTshogpaPaymentCompleted;
        
        console.log(`Completed check for order ${order.orderId}:`, {
          status,
          hasSettlementDate: !!hasSettlementDate,
          isPaymentCompleted,
          isPaid,
          paymentConfirmedBy,
          hasTshogpaPaymentCompleted: !!hasTshogpaPaymentCompleted,
          isCompleted
        });
        
        return isCompleted;
      });
      console.log(`${paymentFilter} - Completed payment filtered orders:`, completedFiltered.length);
      return completedFiltered;
    }
    
    console.log('Final filtered result:', filtered.length);
    return filtered;
  };

  const renderProduct = ({ item }) => {
    const img = resolveProductImage(item);
    const stockOk = (Number(item.stockQuantity) || 0) > 0;
    return (
      <View style={styles.card}>
        <Image source={{ uri: img }} style={styles.image} />
        <View style={styles.cardDetails}>
          <View>
            <Text style={styles.title}>{item.name || item.productName}</Text>
            {item.categoryName && (
              <Text style={styles.category}>{item.categoryName}</Text>
            )}
            <Text style={[styles.stock, { color: stockOk ? '#16A34A' : '#DC2626' }]}>
              Stock: {item.stockQuantity} {item.stockUnit}
            </Text>
            <Text style={styles.price}>Nu.{item.price} / {item.unit}</Text>
            <View style={styles.editButtonContainer}>
              <TouchableOpacity onPress={() => handleEditProduct(item.id)} style={styles.editButton}>
                <Icon name="pencil-outline" size={16} color="#059669" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleDeleteProduct(item.id)} style={styles.actionIcon}>
            <Icon name="delete-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOrder = ({ item }) => {
    const canConfirm = item.status?.toLowerCase() === 'order placed';
    const canShip = item.status?.toLowerCase() === 'order confirmed';
    const isShipped = item.status?.toLowerCase() === 'shipped';
    
    // For Tshogpas, orders move directly to shipped when confirmed
    // So show download button for shipped orders (which appear in Confirmed tab)
    const canDownload = isShipped;
    
    // Special case: if consumer buys their own product, they can accept it directly
    const isSelfPurchase = item.buyer?.cid === item.product?.sellerCid;

    // Get product image - check multiple possible fields
    const getProductImage = () => {
      if (item.product?.productImageBase64) {
        return item.product.productImageBase64.startsWith('data:') 
          ? item.product.productImageBase64
          : `data:image/jpeg;base64,${item.product.productImageBase64}`;
      }
      // Fallback to a default product image or placeholder
      return 'https://via.placeholder.com/110x110?text=Product';
    };

    return (
      <View style={styles.card}>
        <View style={styles.orderLeftColumn}>
          <Image source={{ uri: getProductImage() }} style={styles.orderImage} />
          <View style={styles.orderActionSection}>
            {canConfirm && (
              <TouchableOpacity 
                onPress={() => handleMarkConfirmed(item.orderId, isSelfPurchase)} 
                style={styles.confirmButton}
              >
                <Icon name="check-circle-outline" size={16} color="#fff" />
                <Text style={styles.confirmButtonText}>
                  {isSelfPurchase ? 'Accept' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            )}
            
            {canDownload && (
              <TouchableOpacity 
                onPress={() => handleDownloadConfirmedOrderImage(item.orderId)} 
                style={[styles.downloadButton, downloadingImage === item.orderId && styles.downloadingButton]}
                disabled={downloadingImage === item.orderId}
              >
                {downloadingImage === item.orderId ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Icon name="download" size={16} color="#059669" />
                )}
                <Text style={styles.downloadButtonText}>
                  {downloadingImage === item.orderId ? 'Downloading...' : 'Download'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.productSection}>
            <Text style={styles.productNameText}>{item.product?.name}</Text>
            <Text style={styles.orderDetailsText}>Qty: {item.quantity}</Text>
            <Text style={styles.priceText}>Nu.{item.totalAmount}</Text>
          </View>
          
          <View style={styles.buyerSection}>
            <Text style={styles.buyerLabel}>Customer</Text>
            <Text style={styles.buyerName}>{item.customerName}</Text>
            {(item.buyer?.phone || item.buyer?.phoneNumber) && (
              <Text style={styles.buyerContact}>{item.buyer?.phone || item.buyer?.phoneNumber}</Text>
            )}
            {item.deliveryAddress && (
              <Text style={styles.buyerContact}>Address: {item.deliveryAddress}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentTableRow = ({ item, index }) => {
    const isPending = paymentTab === "Pending";
    const isEarningView = paymentFilter === "Earning";
    const isDispatchedView = paymentFilter === "Dispatched";
    const isEvenRow = index % 2 === 0;
    
    return (
      <View style={[styles.paymentTableRow, { backgroundColor: isEvenRow ? '#FFFFFF' : '#F8FAFC' }]}>
        <View style={[styles.paymentTableCell, { flex: 1.2, marginRight: 8, marginLeft: -4 }]}>
          <Text style={styles.paymentCellText}>
            {item.orderId ? `#${item.orderId.slice(-4)}` : 'N/A'}
          </Text>
        </View>
        {isDispatchedView ? (
          <>
            <View style={[styles.paymentTableCell, { flex: 1.8, marginLeft: 4, marginRight: 4 }]}>
              <Text style={styles.paymentCellText}>{item.transporter?.name || item.transporterName || 'No Transporter'}</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1, alignItems: 'flex-end', paddingRight: 6, marginLeft: 2 }]}>
              <Text style={styles.paymentCellText}>{item.totalPrice || '0'}</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.3, marginLeft: 16 }]}>
              <Text style={styles.paymentCellText}>{item.farmer?.name || item.sellerName || 'Unknown Farmer'}</Text>
            </View>
            {isPending ? (
              <View style={[styles.paymentTableCell, { flex: 1.2, alignItems: 'flex-end', paddingRight: 8, marginLeft: 4 }]}>
                <TouchableOpacity 
                  style={styles.receivedButton}
                  onPress={() => handleMarkPaymentReceived(item.orderId)}
                >
                  <Icon name="check" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.paymentTableCell, { flex: 1.2, marginLeft: 4 }]}>
                <Text style={[styles.paymentCellText, { 
                  color: item.status?.toLowerCase() === 'completed' ? '#059669' : 
                         item.status?.toLowerCase() === 'delivered' ? '#0EA5E9' : 
                         item.status?.toLowerCase() === 'shipped' ? '#F59E0B' : '#6B7280',
                  fontSize: 12,
                  textTransform: 'capitalize'
                }]} numberOfLines={1}>
                  {item.status || 'Unknown'}
                </Text>
              </View>
            )}
          </>
        ) : isEarningView ? (
          <>
            <View style={[styles.paymentTableCell, { flex: 1.3 }]}>
              <Text style={styles.paymentCellText}>{item.buyer?.name || 'Unknown Tshogpa'}</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1, alignItems: 'flex-end', paddingRight: 12 }]}>
              <Text style={styles.paymentCellText}>{item.totalPrice || '0'}</Text>
            </View>
            {isPending ? (
              <View style={[styles.paymentTableCell, { flex: 1.3, alignItems: 'flex-end', paddingRight: 4 }]}>
                <TouchableOpacity 
                  style={styles.receivedButton}
                  onPress={() => handleMarkPaymentReceived(item.orderId)}
                >
                  <Icon name="check" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.paymentTableCell, { flex: 1.3 }]}>
                <Text style={styles.paymentCellText}>
                  {(() => {
                    // Get settlement date from payment flow or fallback to legacy fields
                    if (item.paymentFlow && item.paymentFlow.length > 0) {
                      const tshogpaStep = item.paymentFlow.find(s => 
                        s.step === 'transporter_to_tshogpa' || s.step === 'consumer_to_tshogpa'
                      );
                      if (tshogpaStep && tshogpaStep.status === 'completed' && tshogpaStep.timestamp) {
                        return new Date(tshogpaStep.timestamp).toLocaleDateString();
                      }
                    }
                    
                    // Fallback to legacy settlement date fields
                    if (item.settlementDate) {
                      return new Date(item.settlementDate).toLocaleDateString();
                    }
                    
                    if (item.paymentConfirmedAt) {
                      return new Date(item.paymentConfirmedAt).toLocaleDateString();
                    }
                    
                    return 'N/A';
                  })()}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.paymentTableCell, { flex: 1.3, marginLeft: 16 }]}>
              <Text style={styles.paymentCellText}>{item.farmer?.name || 'Unknown Farmer'}</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.2, alignItems: 'flex-end', paddingRight: 8 }]}>
              <Text style={styles.paymentCellText}>{item.totalPrice || '0'}</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.8 }]}>
              <Text style={styles.paymentCellText}>{item.transporter?.name || 'Unknown Transporter'}</Text>
            </View>
            {isPending ? (
              <View style={[styles.paymentTableCell, { flex: 1.2, alignItems: 'flex-end', paddingRight: 8 }]}>
                <TouchableOpacity 
                  style={styles.receivedButton}
                  onPress={() => handleMarkPaymentReceived(item.orderId)}
                >
                  <Icon name="check" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.paymentTableCell, { flex: 1.4 }]}>
                <View style={styles.settlementDatesContainer}>
                  <Text style={styles.paymentCellText}>
                    T: {item.transporterSettlementDate 
                      ? new Date(item.transporterSettlementDate).toLocaleDateString() 
                      : 'N/A'
                    }
                  </Text>
                  <Text style={styles.paymentCellText}>
                    F: {item.farmerSettlementDate 
                      ? new Date(item.farmerSettlementDate).toLocaleDateString() 
                      : 'N/A'
                    }
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderPaymentTableHeader = () => {
    const isPending = paymentTab === "Pending";
    const isEarningView = paymentFilter === "Earning";
    const isDispatchedView = paymentFilter === "Dispatched";
    
    return (
      <View style={styles.paymentTableHeader}>
        <View style={[styles.paymentTableCell, { flex: 1.2, marginRight: 8, marginLeft: -4 }]}>
          <Text style={styles.paymentHeaderText}>Order ID</Text>
        </View>
        {isDispatchedView ? (
          <>
            <View style={[styles.paymentTableCell, { flex: 1.8, marginLeft: 4, marginRight: 4 }]}>
              <Text style={styles.paymentHeaderText}>Transporter</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1, alignItems: 'flex-end', paddingRight: 6, marginLeft: 2 }]}>
              <Text style={styles.paymentHeaderText}>Price</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.3, marginLeft: 16 }]}>
              <Text style={styles.paymentHeaderText}>Farmer</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.2, marginLeft: 4 }]}>
              <Text style={styles.paymentHeaderText}>
                {isPending ? 'Action' : 'Status'}
              </Text>
            </View>
          </>
        ) : isEarningView ? (
          <>
            <View style={[styles.paymentTableCell, { flex: 1.3 }]}>
              <Text style={styles.paymentHeaderText}>Tshogpa</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1, alignItems: 'flex-end', paddingRight: 12 }]}>
              <Text style={styles.paymentHeaderText}>Amount (NU)</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.3 }]}>
              <Text style={styles.paymentHeaderText}>
                {isPending ? 'Action' : 'Settlement Date'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.paymentTableCell, { flex: 1.3, marginLeft: 16 }]}>
              <Text style={styles.paymentHeaderText}>Farmer</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.2, alignItems: 'flex-end', paddingRight: 8 }]}>
              <Text style={styles.paymentHeaderText}>Amount</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.8 }]}>
              <Text style={styles.paymentHeaderText}>Transporter</Text>
            </View>
            <View style={[styles.paymentTableCell, { flex: 1.2 }]}>
              <Text style={styles.paymentHeaderText}>Action</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Products":
        return (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Products</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddProductModal(true)}
              >
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="basket-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No products found</Text>
                  <Text style={styles.emptySubtext}>
                    Add your first product to start selling
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => setShowAddProductModal(true)}
                  >
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={styles.emptyActionBtnText}>Add Product</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        );
      case "Orders":
        return (
          <>
            {ordersLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredOrders()}
                renderItem={renderOrder}
                keyExtractor={(item, index) => (item.orderId || item.id || item._id || `order-${index}`)}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="package-variant-closed" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No orders found</Text>
                    <Text style={styles.emptySubtext}>
                      {orderSubTab === "All"
                        ? "You don't have any orders yet"
                        : orderSubTab === "Pending"
                        ? "No pending orders at the moment"
                        : "No confirmed orders ready to ship"}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        );
      case "Payments":
        return (
          <>
            {/* Payment Tabs - Show for both Earning and Dispatched filters */}
            <View style={styles.paymentTabs}>
              {["Pending", "Completed"].map((tab) => (
                <TouchableOpacity 
                  key={tab} 
                  onPress={() => setPaymentTab(tab)}
                  style={[
                    styles.paymentTab,
                    paymentTab === tab && styles.activePaymentTab
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentTabText,
                      paymentTab === tab && styles.activePaymentTabText
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
                ))}
            </View>

            {/* Filter Dropdown for Earning/Dispatched */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>View:</Text>
              <View style={styles.dropdownWrapper}>
                <CustomDropdown 
                  options={[
                    { label: "Earning", value: "Earning" },
                    { label: "Dispatched", value: "Dispatched" }
                  ]}
                  value={paymentFilter}
                  onChange={(option) => setPaymentFilter(option.value)}
                  placeholder="Select View"
                />
              </View>
            </View>

            {/* Payment Table */}
            {paymentLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>Loading payments...</Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredPaymentOrders()}
                renderItem={renderPaymentTableRow}
                keyExtractor={(item, index) => (item.orderId || item.id || item._id || `payment-${index}`)}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name={paymentFilter === "Dispatched" ? "truck-delivery-outline" : "credit-card"} size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>
                      {paymentFilter === "Dispatched" 
                        ? "No dispatched orders found"
                        : `No ${paymentTab.toLowerCase()} ${paymentFilter.toLowerCase()} payments found`
                      }
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {paymentFilter === "Dispatched"
                        ? "All orders you have shipped will appear here"
                        : paymentTab === "Pending" 
                        ? `Your pending ${paymentFilter.toLowerCase()} payments will show here`
                        : `Your completed ${paymentFilter.toLowerCase()} payment history will show here`
                      }
                    </Text>
                  </View>
                }
                ListHeaderComponent={
                  getFilteredPaymentOrders().length > 0 ? (
                    <View style={styles.paymentTableContainer}>
                      {renderPaymentTableHeader()}
                    </View>
                  ) : null
                }
              />
            )}
          </>
        );
      default:
        return (
          <View style={styles.centered}>
            <Text>Content for {activeTab}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Hidden image renderer for download */}
      <HiddenOrderImage ref={hiddenImgRef} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tshogpas Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {["Products", "Orders", "Payments"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order Sub-tabs */}
      {activeTab === "Orders" && (
        <View style={styles.subTabs}>
          {["All", "Pending", "Confirmed"].map((subTab) => {
            // Filter to only count orders for Tshogpa's own products
            const ownProductOrders = orders.filter(o => 
              String(o.product?.sellerCid) === String(user?.cid)
            );
            
            let count = 0;
            if (subTab === "All") {
              count = ownProductOrders.length;
            } else if (subTab === "Pending") {
              count = ownProductOrders.filter(o => {
                const status = o.status?.toLowerCase();
                return status === 'order placed';
              }).length;
            } else if (subTab === "Confirmed") {
              count = ownProductOrders.filter(o => {
                const status = o.status?.toLowerCase();
                return status === 'shipped';
              }).length;
            }
            
            return (
              <TouchableOpacity
                key={subTab}
                onPress={() => setOrderSubTab(subTab)}
                style={[
                  styles.subTab,
                  orderSubTab === subTab && styles.activeSubTab
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    orderSubTab === subTab && styles.activeSubTabText
                  ]}
                >
                  {subTab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.content}>
        {renderContent()}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddProductModal}
        onRequestClose={() => setShowAddProductModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Product</Text>
                <TouchableOpacity style={styles.closeButtonHeader} onPress={() => setShowAddProductModal(false)}>
                  <Icon name="close-circle-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 10, flexGrow: 1 }}
                bounces={false}
                overScrollMode="never"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Product Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter product name"
                    placeholderTextColor="#9ca3af"
                    value={productName}
                    onChangeText={setProductName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <TouchableOpacity onPress={() => setShowAddCategory(true)} style={styles.addCategoryBtn}>
                      <Icon name="plus-circle-outline" size={20} color="#059669" />
                      <Text style={styles.addCategoryText}>Add New</Text>
                    </TouchableOpacity>
                  </View>
                  <CustomDropdown
                    options={categoryOptions}
                    value={productCategory}
                    onChange={setProductCategory}
                    placeholder="Select a category"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (70-150 chars)</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Describe your product..."
                    placeholderTextColor="#9ca3af"
                    value={productDescription}
                    onChangeText={setProductDescription}
                    multiline
                    numberOfLines={4}
                    maxLength={160}
                  />
                  <Text style={styles.charCount}>{productDescription.length} / 150</Text>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.halfWidth}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Price (Nu.)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#9ca3af"
                        value={productPrice}
                        onChangeText={setProductPrice}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={styles.halfWidth}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Unit</Text>
                      <CustomDropdown
                        options={unitOptions}
                        value={productUnit}
                        onChange={setProductUnit}
                        placeholder="Select unit"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Stock Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter stock quantity"
                    placeholderTextColor="#9ca3af"
                    value={productStockQuantity}
                    onChangeText={setProductStockQuantity}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Product Image</Text>
                  {!productImage ? (
                    <TouchableOpacity style={styles.imageUploadButton} onPress={handleSelectImage}>
                      <Icon name="camera-plus-outline" size={24} color="#374151" />
                      <Text style={styles.imageUploadButtonText}>Upload Image</Text>
                      <Text style={styles.imageUploadHint}>PNG, JPG, up to 5MB</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: productImage.uri }} style={styles.imagePreview} />
                      <TouchableOpacity style={styles.imageEditButton} onPress={handleRemoveImage}>
                        <Icon name="pencil-outline" size={18} color="#fff" />
                        <Text style={styles.imageEditButtonText}>Edit/Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct}>
                  <Text style={styles.submitButtonText}>Submit Product</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddCategory}
        onRequestClose={() => { setShowAddCategory(false); resetCategoryForm(); }}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Category</Text>
                <TouchableOpacity style={styles.closeButtonHeader} onPress={() => { setShowAddCategory(false); resetCategoryForm(); }}>
                  <Icon name="close-circle-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
                bounces={false}
                overScrollMode="never"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Herbs"
                    placeholderTextColor="#9ca3af"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (15-45 chars)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Short description"
                    placeholderTextColor="#9ca3af"
                    value={newCategoryDescription}
                    onChangeText={setNewCategoryDescription}
                    maxLength={60}
                  />
                  <Text style={styles.charCount}>{newCategoryDescription.length} / 45</Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Image</Text>
                  {!newCategoryImage ? (
                    <TouchableOpacity style={styles.imageUploadButton} onPress={handleSelectCategoryImage}>
                      <Icon name="image-plus" size={24} color="#374151" />
                      <Text style={styles.imageUploadButtonText}>Pick Image</Text>
                      <Text style={styles.imageUploadHint}>Square preferred</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: newCategoryImage.uri }} style={styles.imagePreview} />
                      <TouchableOpacity style={styles.imageEditButton} onPress={() => setNewCategoryImage(null)}>
                        <Icon name="pencil-outline" size={18} color="#fff" />
                        <Text style={styles.imageEditButtonText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <TouchableOpacity disabled={creatingCategory} style={[styles.submitButton, creatingCategory && { opacity: 0.6 }]} onPress={handleCreateCategory}>
                  <Text style={styles.submitButtonText}>{creatingCategory ? 'Saving...' : 'Save Category'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- BASE STYLES ---
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 12,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
  marginBottom: 8,
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
  },
  subTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  subTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  activeSubTab: {
    backgroundColor: "#DC2626",
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeSubTabText: {
    color: "#FFFFFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 140,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    minHeight: 120,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 8,
    alignSelf: "center",
    margin: 16,
  },
  cardDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  stock: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 4,
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F3EF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginRight: 8,
  },
  editButtonText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardActions: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
  },
  actionIcon: {
    marginLeft: 10,
    padding: 5,
  },
  // --- ORDER STYLES ---
  orderLeftColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  orderImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    alignSelf: "flex-start",
    margin: 16,
  },
  orderActionSection: {
    marginTop: 0,
    width: 110, // Same width as image
    alignItems: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'stretch',
    minHeight: 34,
    marginBottom: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the content
    backgroundColor: '#E6F3EF',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'stretch',
    minHeight: 34, // Set a min height to prevent size change
    marginBottom: 8,
  },
  downloadButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadingButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.7,
  },
  orderDetails: {
    flex: 1,
  },
  productSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: 8,
    paddingBottom: 6,
  },
  productNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 4,
  },
  orderDetailsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 4,
    marginBottom: 4,
  },
  buyerSection: {
    paddingVertical: 4,
  },
  buyerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  buyerContact: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  // --- MODAL AND FORM STYLES ---
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalWrapper: {
    position: 'absolute',
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.85,
    top: Dimensions.get('window').height * 0.075,
    left: Dimensions.get('window').width * 0.05,
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
    flex: 0,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "left",
  },
  closeButtonHeader: {
    padding: 5,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    height: 45,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCategoryText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // --- MODERN IMAGE UPLOADER STYLES ---
  imageUploadButton: {
    height: 120,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    marginBottom: 10,
  },
  imageUploadButtonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    marginTop: 8,
  },
  imageUploadHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  imageEditButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  submitButton: {
    backgroundColor: "#059669",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- DROPDOWN STYLES ---
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  placeholderTextDropdown: {
    color: '#9ca3af'
  },
  dropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    zIndex: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#ecfdf5'
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827'
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
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },

  // Payment Styles
  paymentTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  paymentTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePaymentTab: {
    backgroundColor: '#059669',
  },
  paymentTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activePaymentTabText: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  dropdownWrapper: {
    flex: 1,
  },
  paymentTableContainer: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  paymentTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4C7C59',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  paymentTableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#999999',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  paymentTableCell: {
    flex: 1,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  paymentHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  paymentCellText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  receivedButton: {
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 1,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  receivedButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  paymentListContainer: {
    flexGrow: 1,
  },
  settlementDatesContainer: {
    alignItems: 'center',
  },
});