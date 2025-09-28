import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { fetchTshogpasOrders, markOrderShipped, downloadOrderImage } from '../lib/api';
import { useAuth, getCurrentCid } from '../lib/auth';

export default function TshogpasDashboard({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Orders");
  const [orderSubTab, setOrderSubTab] = useState("Ready to Ship");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(null);

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

  const getOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const response = await fetchTshogpasOrders({ cid: user?.cid });
      const ordersList = response?.orders || [];
      setOrders(ordersList);
    } catch (error) {
      console.log('Failed to fetch tshogpas orders:', error);
      Alert.alert('Error', 'Failed to fetch orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.cid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getOrders();
    setRefreshing(false);
  }, [getOrders]);

  useEffect(() => {
    if (activeTab === "Orders") {
      getOrders();
    }
  }, [activeTab, getOrders]);

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

  const requestStoragePermission = async () => {
    return true; // Simplified for Expo Go
  };

  const handleDownloadImage = async (orderId) => {
    if (downloadingImage === orderId) {
      console.log('Image download already in progress for order:', orderId);
      return;
    }
    
    try {
      setDownloadingImage(orderId);
      
      const cid = getCurrentCid();
      if (!cid) {
        console.log('Image Download Error: No CID found');
        Alert.alert('Error', 'User authentication required.');
        return;
      }

      console.log('Starting image download for order:', orderId);
      
      // Request MediaLibrary permission
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      
      if (mediaPermission.status !== 'granted') {
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
      
      await downloadAndSaveImage(orderId, false);

    } catch (error) {
      console.log('Download Image error:', error);
      Alert.alert('Error', `Failed to download image: ${error.message || 'Unknown error'}`);
    } finally {
      setDownloadingImage(null);
    }
  };

  const downloadAndSaveImage = async (orderId, hasFullPermissions) => {
    try {
      const cid = getCurrentCid();
      const response = await downloadOrderImage(orderId, cid);
      
      if (!response?.base64Data) {
        Alert.alert('Error', 'No image data received');
        return;
      }

      const filename = `order_${orderId.slice(-6)}_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, response.base64Data, {
        encoding: 'base64',
      });

      // Save to device gallery
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('DrukFarm Orders');
      
      if (album == null) {
        await MediaLibrary.createAlbumAsync('DrukFarm Orders', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // Offer to share
      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          'Image Saved!',
          'Order image has been saved to your device gallery. Would you like to share it?',
          [
            { text: 'Just Save', style: 'cancel' },
            {
              text: 'Share',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'image/png',
                    dialogTitle: `Order Image for #${orderId.slice(-6)}`,
                  });
                } catch (shareError) {
                  console.log('Share error:', shareError);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Success!', `Order image saved to your device gallery as "${filename}"`);
      }

      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Cleanup error:', cleanupError);
      }
      
    } catch (error) {
      console.log('Download and save error:', error);
      Alert.alert('Error', `Failed to save image: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDownloadImageWithoutSaving = async (orderId) => {
    try {
      const cid = getCurrentCid();
      const response = await downloadOrderImage(orderId, cid);
      
      if (!response?.base64Data) {
        Alert.alert('Error', 'No image data received');
        return;
      }

      const filename = `order_${orderId.slice(-6)}_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, response.base64Data, {
        encoding: 'base64',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: `Order Image for #${orderId.slice(-6)}`,
        });
      } else {
        Alert.alert('Error', 'Sharing not available on this device');
      }

      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Cleanup error:', cleanupError);
      }

    } catch (error) {
      console.log('Share image error:', error);
      Alert.alert('Error', `Failed to share image: ${error.message || 'Unknown error'}`);
    }
  };

  const renderOrder = ({ item }) => {
    const canShip = item.status?.toLowerCase() === 'order confirmed';
    const isShipped = item.status?.toLowerCase() === 'shipped';

    // Get product image
    const getProductImage = () => {
      if (item.product?.productImageBase64) {
        return item.product.productImageBase64.startsWith('data:') 
          ? item.product.productImageBase64
          : `data:image/jpeg;base64,${item.product.productImageBase64}`;
      }
      return 'https://via.placeholder.com/110x110?text=Product';
    };

    return (
      <View style={styles.card}>
        <View style={styles.orderLeftColumn}>
          <Image source={{ uri: getProductImage() }} style={styles.orderImage} />
          <View style={styles.orderActionSection}>
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

  const getFilteredOrders = () => {
    if (!orders) return [];
    
    if (orderSubTab === "Ready to Ship") {
      return orders.filter(order => order.status?.toLowerCase() === 'order confirmed');
    } else if (orderSubTab === "Shipped") {
      return orders.filter(order => order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'out for delivery');
    }
    
    return [];
  };

  const renderContent = () => {
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
                  {orderSubTab === "Ready to Ship"
                    ? "No orders ready to ship at the moment"
                    : "No shipped orders to display"}
                </Text>
              </View>
            }
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tshogpas Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {["Ready to Ship", "Shipped"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setOrderSubTab(tab)}
            style={[
              styles.subTab,
              orderSubTab === tab && styles.activeSubTab
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                orderSubTab === tab && styles.activeSubTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
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
    marginBottom: 16,
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
  orderCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDetails: {
    flex: 1,
    padding: 12,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    minWidth: 110,
  },
  orderLeftColumn: {
    alignItems: 'center',
  },
  productSection: {
    marginBottom: 8,
  },
  productNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  orderDetailsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  buyerSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  buyerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F3EF',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'stretch',
    minHeight: 34,
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
});