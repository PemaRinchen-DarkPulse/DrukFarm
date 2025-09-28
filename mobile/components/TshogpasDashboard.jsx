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
import { createProduct, fetchProducts, fetchCategories, createCategory, fetchTshogpasOrders, markOrderShipped, markOrderConfirmed, downloadOrderImage } from '../lib/api';
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

export default function TshogpasDashboard({ navigation }) {
  const { user } = useAuth();
  
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
      if (!cid) {
        console.log('No CID available, skipping order fetch');
        setOrders([]);
        return;
      }
      
      const fetched = await fetchTshogpasOrders({ cid });
      console.log('Fetched tshogpas orders:', fetched);
      const normalized = Array.isArray(fetched?.orders) ? fetched.orders
        .filter(o => {
          // Only show orders for products created by this Tshogpas user
          const productSellerCid = o.product?.sellerCid || o.product?.createdBy;
          return productSellerCid === user?.cid;
        })
        .map(o => ({
          orderId: String(o.orderId || o._id || ''),
          _id: String(o._id || o.orderId || ''),
          id: String(o.orderId || o._id || ''),
          customerName: o.customerName || o.buyer?.name || 'Unknown',
          customerCid: o.customerCid || o.buyer?.cid,
          product: {
            name: o.product?.name || o.product?.productName || 'Unknown Product',
            price: o.product?.price || 0,
            productImageBase64: o.product?.productImageBase64,
            productImageUrl: o.product?.productImageUrl,
            sellerCid: o.product?.sellerCid || o.product?.createdBy,
            sellerName: o.product?.sellerName || 'Unknown Seller'
          },
          buyer: {
            name: o.buyer?.name || o.customerName || 'Unknown',
            cid: o.buyer?.cid || o.customerCid,
            phone: o.buyer?.phone,
            address: o.buyer?.address
          },
          quantity: o.quantity || 1,
          totalAmount: o.totalAmount || (o.product?.price * o.quantity) || 0,
          status: o.status || 'unknown',
          orderDate: o.orderDate || o.createdAt,
          deliveryAddress: o.deliveryAddress,
          qrCodeDataUrl: o.qrCodeDataUrl
        })) : [];
      
      setOrders(normalized);
    } catch (error) {
      console.error('Error fetching tshogpas orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
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
    if (user?.cid && String(user.role || '').toLowerCase() === 'tshogpas') {
      getProducts();
      getOrders();
      getCategories();
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "Products") {
      await getProducts();
    } else if (activeTab === "Orders") {
      await getOrders();
    }
    setRefreshing(false);
  }, [activeTab]);

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
      await markOrderConfirmed(orderId);
      Alert.alert("Success", isSelfPurchase ? "Order accepted!" : "Order confirmed!");
      getOrders();
    } catch (error) {
      Alert.alert("Error", "Failed to confirm order.");
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
    switch (orderSubTab) {
      case "Pending":
        return orders.filter(o => o.status?.toLowerCase() === 'order placed');
      case "Confirmed":
        return orders.filter(o => o.status?.toLowerCase() === 'order confirmed');
      case "Shipped":
        return orders.filter(o => o.status?.toLowerCase() === 'shipped');
      case "All":
      default:
        return orders;
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
            
            {canShip && (
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
            {item.buyer?.phone && (
              <Text style={styles.buyerContact}>Phone: {item.buyer.phone}</Text>
            )}
            {item.deliveryAddress && (
              <Text style={styles.buyerContact}>Address: {item.deliveryAddress}</Text>
            )}
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
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            enabled={Platform.OS === 'ios'}
            behavior="padding"
            style={styles.keyboardAvoidingWrapper}
          >
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
                contentContainerStyle={{ paddingBottom: 20 }}
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
          <KeyboardAvoidingView
            enabled={Platform.OS === 'ios'}
            behavior="padding"
            style={styles.keyboardAvoidingWrapper}
          >
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
                contentContainerStyle={{ paddingBottom: 20 }}
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
          </KeyboardAvoidingView>
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
    paddingTop: 100,
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
});