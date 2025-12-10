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
  Animated,
  PanResponder, // <-- Imports added for bottom sheet
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { ensureMediaLibraryImagePermission } from '../utils/imageDownloadSimple';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, fetchProducts, fetchCategories, createCategory, fetchSellerOrders, markOrderShipped, markOrderConfirmed, downloadOrderImage, updateOrderStatus } from '../lib/api';
import { downloadOrderImageToGallery } from '../utils/imageDownloadSimple';

import { resolveProductImage } from '../lib/image';
import { useAuth, getCurrentCid } from '../lib/auth';
import TransporterDashboard from '../components/TransporterDashboard';
import TshogpasDashboard from '../components/TshogpasDashboard';
import HiddenOrderImage from '../components/ui/HiddenOrderImage';
import FarmerFilterModal from '../components/FarmerFilterModal';

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
          {value || placeholder}
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
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.dropdownItem,
                  value === opt && styles.dropdownItemActive,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelect(opt)}
              >
                <Text style={styles.dropdownItemText}>{opt}</Text>
                {value === opt ? (
                  <Icon name="check" size={18} color="#059669" />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function FarmerDashboard({ navigation }) {
  const { user } = useAuth();
  const screenDimensions = Dimensions.get('window');
  const MODAL_HEIGHT = screenDimensions.height * 0.85;
  const MODAL_WIDTH = screenDimensions.width * 0.9;
  
  // Check user role and render appropriate dashboard
  if (user?.role?.toLowerCase() === 'transporter') {
    return <TransporterDashboard navigation={navigation} />;
  }
  
  if (user?.role?.toLowerCase() === 'tshogpas') {
    return <TshogpasDashboard navigation={navigation} />;
  }
  
  // Authentication check - redirect if user is not logged in or not a farmer
  useEffect(() => {
    if (!user || !user.cid || String(user.role || '').toLowerCase() !== 'farmer') {
      console.log('User not authenticated as farmer, redirecting to Home');
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
  
  // Filter state
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState("All Categories");
  const [orderSearchText, setOrderSearchText] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState("All Time");
  const [orderPriceFilter, setOrderPriceFilter] = useState("All Prices");
  const slideAnim = useState(new Animated.Value(screenDimensions.height))[0];
  
  // Dropdown visibility states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

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
  const [downloadingImage, setDownloadingImage] = useState(null); // Track which image is being downloaded
  const hiddenImgRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  const getProducts = async () => {
    try {
      setLoading(true);
      const fetched = await fetchProducts({ includeOwn: true });
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
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const getOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      // Farmers see their own orders (seller orders)
      const response = await fetchSellerOrders({ cid: user?.cid });
      const ordersList = response?.orders || [];
      console.log('Fetched farmer orders:', ordersList); // Debug log
      setOrders(ordersList);
    } catch (error) {
      console.log('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to fetch orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.cid]);

  // Bottom sheet functions
  const openBottomSheet = () => {
    setIsFilterVisible(true);
    Animated.spring(slideAnim, {
      toValue: screenDimensions.height * 0.3,
      useNativeDriver: false,
      bounciness: 8,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: screenDimensions.height,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setIsFilterVisible(false);
      closeAllDropdowns();
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      const newValue = screenDimensions.height * 0.3 + gestureState.dy;
      if (newValue >= screenDimensions.height * 0.3) {
        slideAnim.setValue(newValue);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        closeBottomSheet();
      } else {
        Animated.timing(slideAnim, {
          toValue: screenDimensions.height * 0.3,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const closeAllDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowDateDropdown(false);
    setShowPriceDropdown(false);
  };

  const applyFilters = () => {
    closeBottomSheet();
  };

  const clearFilters = () => {
    setProductCategoryFilter("All Categories");
    setOrderSearchText("");
    setOrderDateFilter("All Time");
    setOrderPriceFilter("All Prices");
    closeAllDropdowns();
  };
  
  const hasActiveFilters = () => {
    return (
      productCategoryFilter !== "All Categories" ||
      orderSearchText.trim() !== "" ||
      orderDateFilter !== "All Time" ||
      orderPriceFilter !== "All Prices"
    );
  };

  useEffect(() => {
    if (isFilterVisible) {
      Animated.spring(slideAnim, {
        toValue: screenDimensions.height * 0.3,
        useNativeDriver: false,
        bounciness: 8,
      }).start();
    }
  }, [isFilterVisible]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "Products") {
        console.log('[Farmer] Refreshing products...');
        await getProducts();
      } else if (activeTab === "Orders") {
        console.log('[Farmer] Refreshing orders...');
        await getOrders();
      }
    } catch (error) {
      console.error('[Farmer] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, getOrders]);

  useEffect(() => {
    if (activeTab === "Products") {
      getProducts();
    } else if (activeTab === "Orders") {
      getOrders();
    }
  }, [activeTab, getOrders]);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCategories();
        const names = list.map(c => c.categoryName).sort();
        setCategoryOptions(names);
        const map = {};
        list.forEach(c => { map[c.categoryName] = c.categoryId; });
        setCategoriesMap(map);
      } catch (e) {
        console.log('Failed to fetch categories', e);
      }
    })();
  }, []);

  // Keyboard listeners (mainly for Android). We avoid shrinking modal and instead add scroll space.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardPadding(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardPadding(0));
    // Track orientation changes to recompute base screen height
    const dimSub = Dimensions.addEventListener('change', ({ screen }) => {
      screenHeightRef.current = screen.height; // unaffected by keyboard
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4,3],
      quality: 0.85,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    setProductImage({
      uri: asset.uri,
      base64: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
    });
  };

  const handleSelectCategoryImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to pick an image.');
      return;
    }
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

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete product ID: ${productId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            setProducts(products.filter((product) => product.id !== productId));
            Alert.alert("Deleted", `Product ID: ${productId} deleted.`);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleMarkConfirmed = async (orderId, isSelfPurchase = false) => {
    const actionText = isSelfPurchase ? "Accept Order" : "Confirm Order";
    const buttonText = isSelfPurchase ? "Accept Order" : "Confirm Order";
    
    Alert.alert(
      actionText,
      `Are you sure you want to ${isSelfPurchase ? 'accept' : 'confirm'} this order?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: buttonText,
          onPress: async () => {
            try {
              let response;
              let newStatus;
              
              if (isSelfPurchase) {
                // For self-purchases, mark directly as shipped
                response = await markOrderShipped({ orderId, cid: user?.cid });
                newStatus = 'shipped';
              } else {
                // For regular orders, mark as confirmed
                response = await markOrderConfirmed({ orderId, cid: user?.cid });
                newStatus = 'order confirmed';
              }
              
              if (response.success) {
                // Update the local orders state
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, status: newStatus }
                      : order
                  )
                );

                // Download and save the image automatically for both cases
                console.log('Attempting to download image for confirmed order:', orderId);
                setDownloadingImage(orderId);
                const downloadSuccess = await downloadOrderImageToGallery(orderId);
                setDownloadingImage(null);
                if (!downloadSuccess) {
                  console.log('Image download failed for order:', orderId);
                }

                // Switch to appropriate tab
                if (isSelfPurchase) {
                  setOrderSubTab("Shipped");
                  setTimeout(() => {
                    Alert.alert(
                      "Order Accepted!",
                      "Your own order has been marked as shipped successfully.",
                      [{ text: "OK" }]
                    );
                  }, 1000);
                } else {
                  setOrderSubTab("Confirmed");
                  setTimeout(() => {
                    Alert.alert(
                      "Order Confirmed!",
                      "Order has been confirmed successfully.",
                      [{ text: "OK" }]
                    );
                  }, 1000); // Delay to avoid conflicting with download alerts
                }
              }
            } catch (error) {
              console.log('Confirm/Accept order error:', error);
              Alert.alert('Error', error.body?.error || `Failed to ${isSelfPurchase ? 'accept' : 'confirm'} order.`);
            }
          },
        },
      ]
    );
  };

  const handleMarkShipped = async (orderId) => {
    Alert.alert(
      "Mark as Shipped",
      "Are you sure you want to mark this order as shipped?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ship Order",
          onPress: async () => {
            try {
              const response = await markOrderShipped({ orderId, cid: user?.cid });
              
              if (response.success) {
                // Update the local orders state
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.orderId === orderId 
                      ? { ...order, status: 'shipped' }
                      : order
                  )
                );

                // Download and share the image
                setDownloadingImage(orderId);
                await downloadOrderImageToGallery(orderId);
                setDownloadingImage(null);

                // Switch to Shipped tab to show the updated order
                setOrderSubTab("Shipped");

                // Show success message for order status update
                setTimeout(() => {
                  Alert.alert(
                    "Order Shipped!",
                    "Order has been marked as shipped successfully.",
                    [{ text: "OK" }]
                  );
                }, 1000); // Delay to avoid conflicting with download alerts
              }
            } catch (error) {
              console.log('Ship order error:', error);
              Alert.alert('Error', error.body?.error || 'Failed to ship order.');
            }
          },
        },
      ]
    );
  };

  const downloadQRCode = async (qrDataUrl, orderId) => {
    try {
      console.log('Starting QR download for order:', orderId);
      console.log('QR data URL length:', qrDataUrl ? qrDataUrl.length : 'null');
      
      // Check if QR code data exists
      if (!qrDataUrl) {
        Alert.alert('Error', 'QR code not available for this order.');
        return;
      }

      // Request media library permissions
      console.log('Requesting media library permissions...');
      const permForQR = await ensureMediaLibraryImagePermission();
      console.log('Permission granted:', permForQR.granted);
      
      if (!permForQR.granted) {
        Alert.alert('Permission Required', 'Please allow access to save QR code to your device.');
        return;
      }

      // Create a filename with the order ID and timestamp
      const timestamp = Date.now();
      const filename = `DrukFarm_Order_QR_${orderId.slice(-6)}_${timestamp}.png`;
  const baseDirQR = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDirQR) throw new Error('No writable directory available');
  const fileUri = baseDirQR + filename;
      console.log('Saving to file URI:', fileUri);
      
      // Extract base64 data (remove data:image/png;base64, prefix if present)
      const base64Data = qrDataUrl.includes(',') ? qrDataUrl.split(',')[1] : qrDataUrl;
      console.log('Base64 data length:', base64Data.length);
      
      // Save the base64 image data to a temporary file
      await LegacyFileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });
      console.log('File written successfully');

      // Save to device gallery/downloads
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      console.log('Asset created:', asset.id);
      
      // Try to add to Downloads album (Android) or create QR Codes album
      try {
        let album = await MediaLibrary.getAlbumAsync('DrukFarm QR Codes');
        if (!album) {
          album = await MediaLibrary.createAlbumAsync('DrukFarm QR Codes', asset, false);
          console.log('Created new album:', album.id);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          console.log('Added to existing album');
        }
      } catch (albumError) {
        console.log('Could not create/add to album:', albumError);
        // Asset is still saved to gallery even if album creation fails
      }

      // Also try sharing if available
      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          'QR Code Saved!',
          'QR code has been saved to your device gallery. Would you like to share it?',
          [
            { text: 'Just Save', style: 'cancel' },
            {
              text: 'Share',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'image/png',
                    dialogTitle: `QR Code for Order #${orderId.slice(-6)}`,
                  });
                } catch (shareError) {
                  console.log('Share error:', shareError);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Success!', `QR code saved to your device gallery as "${filename}"`);
      }

      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        console.log('Temporary file cleaned up');
      } catch (cleanupError) {
        console.log('Cleanup error:', cleanupError);
      }
      
    } catch (error) {
      console.log('QR download error:', error);
      Alert.alert('Error', `Failed to save QR code: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDownloadConfirmedOrderImage = async (orderId) => {
    // This function is specifically for downloading images from confirmed orders
    // without changing the order status
    if (downloadingImage === orderId) {
      console.log('Image download already in progress for order:', orderId);
      return;
    }
    
    console.log('Starting image download for confirmed order (no status change):', orderId);
    setDownloadingImage(orderId);
    try {
      // Try local generation first (Expo friendly)
      const localOk = await hiddenImgRef.current?.captureAndSave(orderId);
      if (!localOk) {
        // Fallback to server-rendered image if local failed
        await downloadAndSaveImage(orderId, false);
      }
    } catch (error) {
      console.log('Download error:', error);
      Alert.alert('Error', `Failed to download image: ${error.message || 'Unknown error'}`);
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleDownloadImage = async (orderId) => {
    // Prevent multiple simultaneous downloads for the same order
    if (downloadingImage === orderId) {
      console.log('Image download already in progress for order:', orderId);
      return;
    }
    
    // Helper function for full permissions flow
    const proceedWithFullPermissions = async () => {
      await downloadAndSaveImage(orderId, true);
    };
    
    // Helper function for limited permissions flow
    const proceedWithLimitedPermissions = async () => {
      await downloadAndSaveImage(orderId, false);
    };
    
    try {
      setDownloadingImage(orderId);
      
      const cid = getCurrentCid();
      if (!cid) {
        console.log('Image Download Error: No CID found');
        Alert.alert('Error', 'User authentication required.');
        return;
      }

      console.log('Starting image download for order:', orderId);
      console.log('User CID:', cid);
      
      // Prefer local generation (renders a clean white image with QR)
      const localOk = await hiddenImgRef.current?.captureAndSave(orderId);
      if (!localOk) {
        // Fallback to server PNG download route
        console.log('Local generation failed, falling back to server');
        await proceedWithLimitedPermissions();
      }

    } catch (error) {
      console.log('Download Image error:', error);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        body: error.body
      });
      
      let message = 'Failed to download order image';
      
      if (error?.body?.error) {
        message = error.body.error;
        console.log('Server error message:', error.body.error);
      } else if (error?.message) {
        message = error.message;
        console.log('Error message:', error.message);
      }
      
      // Don't show error for asset creation since we've handled that
      if (message.includes('Could not create asset')) {
        message = 'Image saved successfully but could not be added to gallery. You can still share the file.';
      }
      
      Alert.alert('Error', message);
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
        // If not found locally, fetch from server
        try {
          const resp = await fetchSellerOrders({ cid });
          const ordersList = resp?.orders || resp || [];
          const serverOrder = ordersList.find(o => String(o.orderId) === String(orderId));
          
          if (!serverOrder) {
            Alert.alert('Error', 'Order not found.');
            return;
          }
          
          // Use HiddenOrderImage component to generate and save custom order card
          const success = await hiddenImgRef.current?.captureAndSave(serverOrder);
          
          if (success) {
            console.log('Custom order card generated and saved successfully');
          } else {
            console.log('Order card generation failed');
            Alert.alert('Error', 'Failed to generate order card. Please try again.');
          }
        } catch (fetchError) {
          console.log('Error fetching order from server:', fetchError);
          Alert.alert('Error', 'Could not retrieve order details.');
        }
      } else {
        console.log('Using local order data for card generation');
        
        // Use HiddenOrderImage component to generate and save custom order card
        const success = await hiddenImgRef.current?.captureAndSave(orderData);
        
        if (success) {
          console.log('Custom order card generated and saved successfully');
        } else {
          console.log('Order card generation failed');
          Alert.alert('Error', 'Failed to generate order card. Please try again.');
        }
      }
      
    } catch (error) {
      console.log('downloadAndSaveImage error:', error);
      Alert.alert('Download Error', `Failed to generate order card: ${error.message || 'Unknown error'}`);
    }
  };

  // Fallback function for image download when storage permissions are not available
  const handleDownloadImageWithoutSaving = async (orderId) => {
    // Prevent multiple simultaneous downloads for the same order
    if (downloadingImage === orderId) {
      console.log('Image download already in progress for order:', orderId);
      return;
    }
    
    try {
      setDownloadingImage(orderId);
      
      const cid = getCurrentCid();
      if (!cid) {
        Alert.alert('Error', 'User authentication required.');
        return;
      }

      console.log('Starting image download and save for order:', orderId);
      
      // Download image from server
      const response = await downloadOrderImage(orderId, cid);
      const imageData = response?.data;
      
      if (!response?.success || !imageData) {
        console.error('Invalid server response:', response);
        Alert.alert('Error', 'No image data received from server.');
        return;
      }
      
      console.log('Image data received, preparing for share');
      
      // Save as PNG file
      const filename = response.filename || `DrukFarm_Order_${orderId.slice(-6)}_${Date.now()}.png`;
  const baseDir2 = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir2) throw new Error('No writable directory available');
  const savedFileUri = baseDir2 + filename;
      
      // Clean base64 data
      let cleanBase64 = imageData;
      if (typeof cleanBase64 === 'string' && cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }
      
      // Save image file for sharing
      await LegacyFileSystem.writeAsStringAsync(savedFileUri, cleanBase64, {
        encoding: 'base64',
      });
      
      console.log('Image saved for sharing:', savedFileUri);
      
      // Try to save to gallery anyway (might work)
      let savedToGallery = false;
      try {
        const asset = await MediaLibrary.createAssetAsync(savedFileUri);
        console.log('Successfully saved to gallery');
        savedToGallery = true;
      } catch (mediaError) {
        console.log('Could not save to gallery, will share only:', mediaError);
      }
      
      // Show success message with share option
      const message = savedToGallery 
        ? 'Image saved to your gallery and ready to share!'
        : 'Image ready to share!';
      
      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          'Image Ready!',
          message,
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Share Now',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(savedFileUri, {
                    mimeType: 'image/png',
                    dialogTitle: `Order Details - #${orderId.slice(-6)}`,
                  });
                } catch (shareError) {
                  console.log('Share error:', shareError);
                  Alert.alert('Error', 'Failed to share image.');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Image Ready!', 'Image saved but sharing not available on this device.');
      }
      
      // Keep file permanently saved for easy access
      
    } catch (error) {
      console.log('Download Image error:', error);
      let message = 'Failed to download order image';
      if (error?.body?.error) {
        message = error.body.error;
      } else if (error?.message) {
        message = error.message;
      }
      Alert.alert('Error', message);
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleDownloadQR = async (orderId) => {
    try {
      // Find the order to get its QR code
      const order = orders.find(o => o.orderId === orderId);
      if (!order) {
        Alert.alert('Error', 'Order not found.');
        return;
      }
      
      if (!order.qrCodeDataUrl) {
        Alert.alert('Error', 'QR code not available for this order. This might be an older order.');
        return;
      }
      
      await downloadQRCode(order.qrCodeDataUrl, orderId);
    } catch (error) {
      console.log('Download QR error:', error);
      Alert.alert('Error', 'Failed to download QR code.');
    }
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
    
    // Special case: if vegetable vendor buys their own product, they can accept it directly
    const isSelfPurchase = item.buyer?.cid === item.product?.sellerCid;

    // Check if order status should be displayed
    const statusToShow = ['shipped', 'out for delivery', 'delivered', 'cancelled'];
    const shouldShowStatus = statusToShow.includes(item.status?.toLowerCase());

    // Get status display color
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'shipped':
          return '#009688'; // Teal
        case 'out for delivery':
          return '#FFA726'; // Orange
        case 'delivered':
          return '#4C7C59'; // Green
        case 'cancelled':
          return '#DC2626'; // Red
        default:
          return '#6B7280'; // Gray
      }
    };

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
            
            {canShip && (
              <TouchableOpacity 
                onPress={() => handleDownloadConfirmedOrderImage(item.orderId)} 
                style={[styles.downloadButton, downloadingImage === item.orderId && styles.downloadingButton]}
                disabled={downloadingImage === item.orderId}
              >
                {downloadingImage === item.orderId ? (
                  <ActivityIndicator size="small" color="#6B7280" />
                ) : (
                  <Text style={styles.downloadButtonText}>
                    Download
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {isShipped && (
              <TouchableOpacity 
                onPress={() => handleDownloadImage(item.orderId)} 
                style={[styles.downloadButton, downloadingImage === item.orderId && styles.downloadingButton]}
                disabled={downloadingImage === item.orderId}
              >
                {downloadingImage === item.orderId ? (
                  <ActivityIndicator size="small" color="#6B7280" />
                ) : (
                  <Text style={styles.downloadButtonText}>
                    Download
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {/* Show status for specific statuses only in All tab */}
            {shouldShowStatus && orderSubTab === "All" && (
              <View style={[styles.statusButton, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={[styles.statusButtonText, { color: '#FFFFFF' }]}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1).toLowerCase() || 'Unknown'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.orderContent}>
            <View style={styles.productSection}>
              <Text style={styles.productNameText}>{item.product?.name}</Text>
              <Text style={styles.priceText}>Nu.{item.totalPrice}</Text>
              <Text style={styles.orderDetailsText}>
                Qty: {item.quantity} {item.product?.unit}
              </Text>
            </View>
            
            <View style={styles.buyerSection}>
              <Text style={styles.buyerLabel}>Buyer:</Text>
              <Text style={styles.buyerName}>{item.buyer?.name || 'Unknown'}</Text>
              <Text style={styles.buyerContact}>{item.buyer?.phoneNumber || 'No contact'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getFilteredOrders = () => {
    if (!orders) return [];
    
    let filtered = orders;
    
    // Filter by status tab
    if (orderSubTab === "Pending") {
      filtered = filtered.filter(order => order.status?.toLowerCase() === 'order placed');
    } else if (orderSubTab === "Confirmed") {
      filtered = filtered.filter(order => order.status?.toLowerCase() === 'order confirmed');
    } else if (orderSubTab === "Shipped") {
      filtered = filtered.filter(order => order.status?.toLowerCase() === 'shipped');
    }
    
    // Filter by search text (buyer name or order ID)
    if (orderSearchText.trim()) {
      const searchLower = orderSearchText.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.buyer?.name?.toLowerCase().includes(searchLower) ||
        order.orderId?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by date
    if (orderDateFilter !== "All Time") {
      const now = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt || order.orderDate);
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        
        switch (orderDateFilter) {
          case "Today":
            return diffDays < 1;
          case "Last 7 Days":
            return diffDays <= 7;
          case "Last 30 Days":
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }
    
    // Filter by price range
    if (orderPriceFilter !== "All Prices") {
      filtered = filtered.filter(order => {
        const price = parseFloat(order.totalPrice || 0);
        
        switch (orderPriceFilter) {
          case "Under Nu.500":
            return price < 500;
          case "Nu.500 - Nu.1000":
            return price >= 500 && price <= 1000;
          case "Nu.1000 - Nu.5000":
            return price >= 1000 && price <= 5000;
          case "Above Nu.5000":
            return price > 5000;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  const getFilteredProducts = () => {
    if (!products) return [];
    
    if (productCategoryFilter === "All Categories") {
      return products;
    }
    
    return products.filter(product => 
      product.categoryName === productCategoryFilter
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
              data={getFilteredProducts()}
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
                keyExtractor={(item) => (item.orderId || item.id || item._id || Math.random().toString())}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="package-variant-closed" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No orders found</Text>
                    <Text style={styles.emptySubtext}>
                      {orderSearchText || orderDateFilter !== "All Time" || orderPriceFilter !== "All Prices"
                        ? "No orders match your filters"
                        : orderSubTab === "All"
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

        return (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Orders</Text>
              <View style={styles.orderCount}>
                <Text style={styles.orderCountText}>
                  {orders.length} total
                </Text>
              </View>
            </View>

            {/* Order Sub-tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderSubTabsContainer}>
              <View style={styles.orderSubTabs}>
                <TouchableOpacity 
                  onPress={() => setOrderSubTab("Pending")}
                  style={[
                    styles.orderSubTab,
                    orderSubTab === "Pending" && styles.activeOrderSubTab
                  ]}
                >
                  <Text style={[
                    styles.orderSubTabText,
                    orderSubTab === "Pending" && styles.activeOrderSubTabText
                  ]}>
                    Pending ({orders.filter(o => o.status?.toLowerCase() === 'order placed').length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setOrderSubTab("Confirmed")}
                  style={[
                    styles.orderSubTab,
                    orderSubTab === "Confirmed" && styles.activeOrderSubTab
                  ]}
                >
                  <Text style={[
                    styles.orderSubTabText,
                    orderSubTab === "Confirmed" && styles.activeOrderSubTabText
                  ]}>
                    Confirmed ({orders.filter(o => o.status?.toLowerCase() === 'order confirmed').length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setOrderSubTab("Shipped")}
                  style={[
                    styles.orderSubTab,
                    orderSubTab === "Shipped" && styles.activeOrderSubTab
                  ]}
                >
                  <Text style={[
                    styles.orderSubTabText,
                    orderSubTab === "Shipped" && styles.activeOrderSubTabText
                  ]}>
                    Shipped ({orders.filter(o => o.status?.toLowerCase() === 'shipped').length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setOrderSubTab("All")}
                  style={[
                    styles.orderSubTab,
                    orderSubTab === "All" && styles.activeOrderSubTab
                  ]}
                >
                  <Text style={[
                    styles.orderSubTabText,
                    orderSubTab === "All" && styles.activeOrderSubTabText
                  ]}>
                    All ({orders.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {getFilteredOrders().length === 0 && !ordersLoading ? (
              <View style={styles.placeholder}>
                <Icon name="cart-outline" size={48} color="#6B7280" />
                <Text style={styles.placeholderText}>
                  No {orderSubTab.toLowerCase()} orders yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredOrders()}
                renderItem={renderOrder}
                keyExtractor={(item) => item.orderId}
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
                refreshing={ordersLoading}
                onRefresh={getOrders}
              />
            )}
          </>
        );
      case "Stats":
        return (
          <View style={styles.placeholder}>
            <Icon name="chart-line" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>
              Your sales stats will show here.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Hidden image renderer for download */}
      <HiddenOrderImage ref={hiddenImgRef} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Dashboard</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters() && styles.filterButtonActive]}
          onPress={openBottomSheet}
        >
          <Text style={[styles.filterText, hasActiveFilters() && styles.filterTextActive]}>Filters</Text>
          <Icon name="filter-variant" size={18} color={hasActiveFilters() ? "#059669" : "#111827"} />
          {hasActiveFilters() && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["Products", "Orders"].map((tab) => (
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
          {["All", "Pending", "Confirmed"].map((subTab) => (
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
                {subTab}
              </Text>
            </TouchableOpacity>
          ))}
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

      {/* Filter Bottom Sheet Modal */}
      <FarmerFilterModal
        visible={isFilterVisible}
        onClose={closeBottomSheet}
        slideAnim={slideAnim}
        panResponder={panResponder}
        activeTab={activeTab}
        orderSearchText={orderSearchText}
        setOrderSearchText={setOrderSearchText}
        productCategoryFilter={productCategoryFilter}
        setProductCategoryFilter={setProductCategoryFilter}
        categoryOptions={categoryOptions}
        showCategoryDropdown={showCategoryDropdown}
        setShowCategoryDropdown={setShowCategoryDropdown}
        orderDateFilter={orderDateFilter}
        setOrderDateFilter={setOrderDateFilter}
        showDateDropdown={showDateDropdown}
        setShowDateDropdown={setShowDateDropdown}
        orderPriceFilter={orderPriceFilter}
        setOrderPriceFilter={setOrderPriceFilter}
        showPriceDropdown={showPriceDropdown}
        setShowPriceDropdown={setShowPriceDropdown}
        onApply={applyFilters}
        onClear={clearFilters}
        closeAllDropdowns={closeAllDropdowns}
      />
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
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
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
  orderLeftColumn: {
    alignItems: 'center',
    marginRight: 12,
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
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
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

  // --- ORDER STYLES ---
  orderSubTabsContainer: {
    marginBottom: 16,
  },
  orderSubTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  orderSubTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeOrderSubTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderSubTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeOrderSubTabText: {
    color: '#DC2626',
  },
  orderContent: {
    gap: 8,
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
  statusButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'stretch',
    minHeight: 34,
    marginBottom: 8,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
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
  shipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'stretch',
    minHeight: 34,
    marginBottom: 8,
  },
  shipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
  downloadingButtonText: { // This style is no longer used by Text, but kept for reference
    color: '#6B7280',
  },
  orderCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
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
  halfWidth: {
    flex: 1,
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
  
  // --- FILTER STYLES ---
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginLeft: 'auto',
  },
  filterButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  filterText: {
    fontSize: 14,
    color: '#111827',
    marginRight: 6,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  filterIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
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
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  paymentTableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentTableCell: {
    flex: 1,
    paddingHorizontal: 6,
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
    marginRight: 4,
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
});