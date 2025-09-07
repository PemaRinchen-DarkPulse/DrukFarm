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
  KeyboardAvoidingView, // <-- Import KeyboardAvoidingView
  Keyboard,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, fetchProducts, fetchCategories, createCategory } from '../lib/api';
import { resolveProductImage } from '../lib/image';
import { useAuth } from '../lib/auth';

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
  const [activeTab, setActiveTab] = useState("Products");
  const [showAddProductModal, setShowAddProductModal] = useState(false);

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
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    try {
      setLoading(true);
      const fetched = await fetchProducts();
      const normalized = Array.isArray(fetched) ? fetched.map(p => ({
        id: String(p.productId || p._id || ''),
        productId: String(p.productId || p._id || ''),
        productName: p.productName,
        name: p.productName,
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
      setProducts(normalized);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Products") {
      getProducts();
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

  const renderProduct = ({ item }) => {
    const img = resolveProductImage(item);
    const stockOk = (Number(item.stockQuantity) || 0) > 0;
    return (
      <View style={styles.card}>
        <Image source={{ uri: img }} style={styles.image} />
        <View style={styles.cardDetails}>
          <View>
            <Text style={styles.title}>{item.name || item.productName}</Text>
            <Text style={[styles.stock, { color: stockOk ? '#16A34A' : '#DC2626' }]}>
              Stock: {item.stockQuantity} {item.stockUnit}
            </Text>
          </View>
          <Text style={styles.price}>Nu.{item.price} / {item.unit}</Text>
          <TouchableOpacity onPress={() => handleEditProduct(item.id)} style={styles.editButton}>
            <Icon name="pencil-outline" size={16} color="#059669" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleDeleteProduct(item.id)} style={styles.actionIcon}>
            <Icon name="delete-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
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
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshing={loading}
              onRefresh={getProducts}
            />
          </>
        );
      case "Orders":
        return (
          <View style={styles.placeholder}>
            <Icon name="cart-outline" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>No orders yet.</Text>
          </View>
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
      case "Settings":
        return (
          <View style={styles.placeholder}>
            <Icon name="cog-outline" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>
              Manage your settings here.
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
        {["Stats", "Products", "Orders", "Settings"].map((tab) => (
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
           *   "android": { "softwareKeyboardLayoutMode": "pan" }
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
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 16,
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
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
    marginTop: 8,
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
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
});