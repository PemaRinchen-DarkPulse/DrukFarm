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
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
  ActivityIndicator, // <-- Import added
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { ensureMediaLibraryImagePermission } from '../utils/imageDownloadSimple';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, fetchProducts, fetchCategories, createCategory, fetchSellerOrders, markOrderShipped, markOrderConfirmed, downloadOrderImage } from '../lib/api';
import { resolveProductImage } from '../lib/image';
import { useAuth, getCurrentCid } from '../lib/auth';
import TransporterDashboard from '../components/TransporterDashboard';
import TshogpasDashboard from '../components/TshogpasDashboard';
import HiddenOrderImage from '../components/ui/HiddenOrderImage';

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

export default function Dashboard({ navigation }) {
  const { user } = useAuth();
  
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
  
  const [activeTab, setActiveTab] = useState("Products");
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
  const hiddenImgRef = useRef(null);

  // Categories fetched from backend
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const unitOptions = ["Kg", "g", "L", "ml", "Dozen", "Pcs"];

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSubTab, setOrderSubTab] = useState("Pending"); // New state for order sub-tabs
  const [downloadingImage, setDownloadingImage] = useState(null); // Track which image is being downloaded

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
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const getOrders = async () => {
    try {
      setOrdersLoading(true);
      let response;
      
      if (isTshogpas) {
        // Tshogpas see only confirmed orders ready to ship
        response = await fetchTshogpasOrders({ cid: user?.cid });
      } else {
        // Farmers see their own orders
        response = await fetchSellerOrders({ cid: user?.cid });
      }
      
      const ordersList = response?.orders || [];
      setOrders(ordersList);
    } catch (error) {
      console.log('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to fetch orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Products") {
      getProducts();
    } else if (activeTab === "Orders") {
      getOrders();
    }
  }, [activeTab]);

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

                // Switch to appropriate tab
                if (isSelfPurchase) {
                  await handleDownloadImage(orderId);
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
                  Alert.alert(
                    "Order Confirmed!",
                    "Order has been confirmed successfully.",
                    [{ text: "OK" }]
                  );
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
                await handleDownloadImage(orderId);

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
      
      // Request Photos permission via helper (won't re-prompt if already granted)
      const mediaPermission = await ensureMediaLibraryImagePermission();
      if (!mediaPermission.granted) {
        console.log('MediaLibrary permission denied, offering share-only option');
        Alert.alert(
          'Permission Required', 
          'Need media access to save image. Share instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share Image',
              onPress: () => handleDownloadImageWithoutSaving(orderId)
            }
          ]
        );
        return;
      }
      
      // Since we're in Expo Go, always use limited permissions (MediaLibrary only)
      console.log('Using MediaLibrary-only approach for Expo Go compatibility');
      await proceedWithLimitedPermissions();

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
      const orderData = orders.find(o => String(o.orderId) === String(orderId));
      
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

      console.log('Starting custom order card generation for order:', orderId);
      
      // Find the order in our local orders list to get complete data
      const orderData = orders.find(o => String(o.orderId) === String(orderId));
      let success = false;
      
      if (!orderData) {
        // If not found locally, fetch from server
        const resp = await fetchSellerOrders({ cid });
        const ordersList = resp?.orders || resp || [];
        const serverOrder = ordersList.find(o => String(o.orderId) === String(orderId));
        
        if (!serverOrder) {
          Alert.alert('Error', 'Order not found.');
          return;
        }
        
        // Use HiddenOrderImage component to generate and save custom order card
        success = await hiddenImgRef.current?.captureAndSave(serverOrder);
      } else {
        // Use HiddenOrderImage component to generate and save custom order card
        success = await hiddenImgRef.current?.captureAndSave(orderData);
      }
      
      if (success) {
        console.log('Image download process completed successfully');
      } else {
        console.log('Image save failed via HiddenOrderImage');
        Alert.alert('Error', 'Failed to save image to gallery. Please check permissions.');
      }
      
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
                onPress={() => handleMarkShipped(item.orderId)} 
                style={styles.shipButton}
              >
                <Icon name="truck-delivery-outline" size={16} color="#fff" />
                <Text style={styles.shipButtonText}>Ship</Text>
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
              refreshing={loading}
              onRefresh={getProducts}
            />
          </>
        );
      case "Orders":
        const filteredOrders = orders.filter(order => {
          if (orderSubTab === "Pending") {
            return order.status?.toLowerCase() === 'order placed';
          } else if (orderSubTab === "Confirmed") {
            return order.status?.toLowerCase() === 'order confirmed';
          } else if (orderSubTab === "Shipped") {
            return order.status?.toLowerCase() === 'shipped';
          } else if (orderSubTab === "All") {
            return true;
          }
          return false;
        });

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

            {filteredOrders.length === 0 && !ordersLoading ? (
              <View style={styles.placeholder}>
                <Icon name="cart-outline" size={48} color="#6B7280" />
                <Text style={styles.placeholderText}>
                  No {orderSubTab.toLowerCase()} orders yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredOrders}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Dashboard</Text>
      </View>

      <View style={styles.tabs}>
        {["Stats", "Products", "Orders"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}

      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddProductModal}
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/**
           * NOTE: Previously we used behavior="height" on Android which shrinks the whole form
           * when the keyboard appears. To keep the modal size stable, we only enable the
           * KeyboardAvoidingView on iOS (using padding). On Android the view is rendered as a
           * normal container so the form height remains constant and the keyboard may cover
           * lower fields, but the internal ScrollView lets the user scroll them into view.
           * If you prefer the keyboard to pan instead of overlay, set in app.json:
           * "android": { "softwareKeyboardLayoutMode": "pan" }
           */}
          <KeyboardAvoidingView
            enabled={Platform.OS === 'ios'}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            style={styles.keyboardAvoidingWrapper}
          >
            <View style={[styles.modalContainer, { height: screenHeightRef.current * 0.85, maxHeight: screenHeightRef.current * 0.85 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Product</Text>
                <TouchableOpacity
                  style={styles.closeButtonHeader}
                  onPress={() => setShowAddProductModal(false)}
                >
                  <Icon name="close-circle-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 + (Platform.OS === 'android' ? keyboardPadding : 0) }}
              >
                {/* Product Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Product Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Organic Apples"
                    placeholderTextColor="#9ca3af"
                    value={productName}
                    onChangeText={setProductName}
                  />
                </View>

                {/* Category and Stock Quantity Row */}
                <View style={styles.formRow}>
                  <View style={{ width: '58%' }}>
                    <Text style={styles.inputLabel}>Category</Text>
                    <CustomDropdown
                      options={categoryOptions}
                      value={productCategory}
                      onChange={setProductCategory}
                      placeholder="Select category..."
                    />
                    <TouchableOpacity onPress={() => setShowAddCategory(true)} style={styles.inlineAddLink}>
                      <Text style={styles.inlineAddLinkText}>+ New Category</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: '38%' }}>
                    <Text style={styles.inputLabel}>Stock Qty</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 50"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={productStockQuantity}
                      onChangeText={setProductStockQuantity}
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Min 70, Max 150 characters"
                    placeholderTextColor="#9ca3af"
                    multiline
                    maxLength={150}
                    value={productDescription}
                    onChangeText={setProductDescription}
                  />
                  <Text style={styles.charCount}>{productDescription.length} / 150</Text>
                </View>

                {/* Price and Unit Row */}
                <View style={styles.formRow}>
                  <View style={{ width: '38%' }}>
                    <Text style={styles.inputLabel}>Price (Nu.)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 120"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={productPrice}
                      onChangeText={setProductPrice}
                    />
                  </View>
                  <View style={{ width: '58%' }}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <CustomDropdown
                      options={unitOptions}
                      value={productUnit}
                      onChange={setProductUnit}
                      placeholder="Select a unit..."
                    />
                  </View>
                </View>

                {/* Product Image Uploader */}
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
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddCategory}
        onRequestClose={() => { setShowAddCategory(false); resetCategoryForm(); }}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { height: screenHeightRef.current * 0.6, maxHeight: screenHeightRef.current * 0.6 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Category</Text>
                <TouchableOpacity style={styles.closeButtonHeader} onPress={() => { setShowAddCategory(false); resetCategoryForm(); }}>
                  <Icon name="close-circle-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 + (Platform.OS === 'android' ? keyboardPadding : 0) }}
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
      </Modal>
      <HiddenOrderImage ref={hiddenImgRef} />
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
    marginBottom: 16,
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
    paddingBottom: 6,
  },
  productNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingWrapper: {
    width: "90%",
    maxHeight: "85%",
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 20,
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
  inlineAddLink: {
    marginTop: 8,
  },
  inlineAddLinkText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
});