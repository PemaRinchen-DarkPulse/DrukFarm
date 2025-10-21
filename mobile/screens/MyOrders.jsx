import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fetchMyOrders, cancelMyOrder } from "../lib/api";
import { getCurrentCid } from "../lib/auth";
import { resolveProductImage } from '../lib/image';
import AddReviewModal from '../components/AddReviewModal';

export default function MyOrders({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('summary'); // 'summary' or 'detail'
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);

  // Get summary of orders grouped by status
  const getOrdersSummary = () => {
    const statusCounts = {};
    
    orders.forEach(order => {
      const statusDisplay = getStatusDisplay(order.status);
      const statusKey = statusDisplay.status;
      
      if (!statusCounts[statusKey]) {
        statusCounts[statusKey] = {
          status: statusKey,
          icon: statusDisplay.icon,
          color: statusDisplay.color,
          count: 0,
          orders: []
        };
      }
      
      statusCounts[statusKey].count += 1;
      statusCounts[statusKey].orders.push(order);
    });
    
    return Object.values(statusCounts);
  };

  // Get orders filtered by selected status
  const getFilteredOrders = () => {
    if (!selectedStatus) return [];
    
    return orders.filter(order => {
      const statusDisplay = getStatusDisplay(order.status);
      return statusDisplay.status === selectedStatus;
    });
  };

  // Map backend status to display properties
  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': { status: 'Pending', icon: 'clock-outline', color: '#FACC15' },
      'placed': { status: 'Placed', icon: 'receipt', color: '#3B82F6' },
      'paid': { status: 'Paid', icon: 'credit-card', color: '#10B981' },
      'shipped': { status: 'Shipped', icon: 'truck', color: '#3B82F6' },
      'OUT_FOR_DELIVERY': { status: 'Out for Delivery', icon: 'bike', color: '#F97316' },
      'Out for Delivery': { status: 'Out for Delivery', icon: 'bike', color: '#F97316' },
      'delivered': { status: 'Delivered', icon: 'check-circle', color: '#22C55E' },
      'cancelled': { status: 'Cancelled', icon: 'close-circle', color: '#EF4444' },
    };
    
    return statusMap[status] || { status: 'Pending', icon: 'clock-outline', color: '#FACC15' };
  };

  // Handle order cancellation
  const handleCancelOrder = (orderId, orderStatus) => {
    if (orderStatus !== 'pending') {
      Alert.alert(
        'Cannot Cancel',
        'Only pending orders can be cancelled.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const cid = getCurrentCid();
              await cancelMyOrder({ orderId, cid });
              
              // Refresh orders after cancellation
              await loadOrders();
              
              Alert.alert('Success', 'Order has been cancelled successfully.');
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle add review button
  const handleAddReview = (order) => {
    setSelectedOrderForReview(order);
    setReviewModalVisible(true);
  };

  // Handle review submission callback
  const handleReviewSubmitted = () => {
    // Refresh orders to update any review status if needed
    loadOrders();
  };

  // Fetch orders from backend
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cid = getCurrentCid();
      if (!cid) {
        setError('Please log in to view your orders');
        setLoading(false);
        return;
      }

      const ordersData = await fetchMyOrders({ cid });
      
      // Store the raw orders data - we'll transform it in the render methods
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Reset view when orders change
  useEffect(() => {
    if (orders.length === 0) {
      setCurrentView('summary');
      setSelectedStatus(null);
    }
  }, [orders]);

  // Render function for status summary cards
  const renderStatusSummary = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        setSelectedStatus(item.status);
        setCurrentView('detail');
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.status, { color: item.color }]}>{item.status}</Text>
        <Text style={styles.orderId}>{item.count} order{item.count !== 1 ? 's' : ''}</Text>
      </View>
      <Icon name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );

  // Render function for individual order details
  const renderOrderDetail = ({ item }) => {
    const statusDisplay = getStatusDisplay(item.status);
    const product = item.product || {};
    const seller = item.seller || {};
    
    // Logic to display price consistently (e.g., price per kg)
    let displayPrice = Number(product.price || 0);
    let displayUnit = product.unit || 'kg';
    
    if (product.unit === "g") {
      displayPrice = (displayPrice / 500) * 1000; // Calculate price per 1000g (1kg)
      displayUnit = "kg";
    }

    // Get product image - handle order structure properly
    const getOrderProductImage = () => {
      // Debug logging
      console.log('=== IMAGE DEBUG INFO ===');
      console.log('Product data:', product);
      console.log('Product image base64 length:', product.productImageBase64?.length || 0);
      console.log('Product image base64 preview:', product.productImageBase64?.substring(0, 50) || 'NO DATA');
      
      // Check if we have base64 image data
      const base64Data = product.productImageBase64;
      if (base64Data && typeof base64Data === 'string' && base64Data.length > 20) {
        // If it already includes data URI prefix, return as is
        if (base64Data.startsWith('data:image/')) {
          console.log('Using data URI as-is');
          return base64Data;
        }
        // If it's just base64 data, add the data URI prefix
        const dataUri = `data:image/jpeg;base64,${base64Data}`;
        console.log('Created data URI, length:', dataUri.length);
        return dataUri;
      }
      
      console.log('No valid base64 data found, using fallback');
      // Fallback to resolveProductImage with proper structure
      return resolveProductImage({
        productImageBase64: base64Data,
        productImage: product.productImage,
        image: product.image,
        productImageUrl: product.productImageUrl,
        ...product
      });
    };
    
    const productImage = getOrderProductImage();
    
    return (
      <TouchableOpacity 
        style={styles.orderDetailCard}
        activeOpacity={0.7}
        onPress={() => {
          // Future: Navigate to order details screen or show order actions
          console.log('Order pressed:', item.orderId);
          console.log('Product image:', productImage);
          console.log('Product data:', product);
        }}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusDisplay.color}20` }]}>
              <Icon name={statusDisplay.icon} size={14} color={statusDisplay.color} />
              <Text style={[styles.statusText, { color: statusDisplay.color }]}>
                {statusDisplay.status}
              </Text>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            {/* Order Date - Moved to right */}
            {item.createdAt && (
              <View style={styles.dateInline}>
                <Icon name="calendar" size={12} color="#9CA3AF" />
                <Text style={styles.dateTextInline}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
            {/* Cancel Button (only for pending orders) */}
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.cancelButtonSmall}
                onPress={() => handleCancelOrder(item.orderId, item.status)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.productSection}>
          {/* Left Column - Image */}
          <View style={styles.productImageContainer}>
            <Image
              source={
                productImage && productImage !== 'https://via.placeholder.com/300x200.png?text=Image'
                  ? { uri: productImage }
                  : require("../assets/heroimage.jpg")
              }
              style={styles.productImage}
              onError={(error) => {
                console.log('Image load error:', error.nativeEvent.error);
                console.log('Failed image URL:', productImage);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', productImage);
              }}
            />
          </View>

          {/* Right Column - Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name || 'Product Details Unavailable'}
            </Text>
            <Text style={styles.productPrice}>
              Nu. {displayPrice.toFixed(0)}/{displayUnit}
            </Text>
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantity: </Text>
              <Text style={styles.quantityValue}>{item.quantity || 1}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total: </Text>
              <Text style={styles.totalValue}>Nu. {(item.totalPrice || 0).toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Seller Info */}
        {seller.name && (
          <View style={styles.sellerSection}>
            <Icon name="store" size={16} color="#6B7280" />
            <Text style={styles.sellerInfo}>
              Sold by {seller.name}
              {seller.location ? `, ${seller.location}` : ''}
            </Text>
          </View>
        )}

        {/* Transporter Info (if out for delivery) */}
        {item.transporter && (statusDisplay.status === 'Out for Delivery') && (
          <View style={styles.transporterSection}>
            <Icon name="bike" size={16} color="#F97316" />
            <Text style={styles.transporterInfo}>
              Delivered by {item.transporter.name}
              {item.transporter.phoneNumber ? ` (${item.transporter.phoneNumber})` : ''}
            </Text>
          </View>
        )}

        {/* Add Review Button (only for delivered orders) */}
        {statusDisplay.status === 'Delivered' && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddReview(item);
            }}
          >
            <Icon name="star-outline" size={18} color="#059669" />
            <Text style={styles.reviewButtonText}>Rate & Review</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (currentView === 'detail') {
            setCurrentView('summary');
            setSelectedStatus(null);
          } else {
            navigation.goBack();
          }
        }}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentView === 'summary' ? 'My Orders' : `${selectedStatus} Orders`}
        </Text>
        <TouchableOpacity onPress={loadOrders}>
          <Icon name="refresh" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <View style={styles.centerContainer}>
          <Icon name="package-variant-closed" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>You don't have any orders yet</Text>
        </View>
      )}

      {/* Order Status Summary */}
      {!loading && !error && orders.length > 0 && currentView === 'summary' && (
        <FlatList
          data={getOrdersSummary()}
          renderItem={renderStatusSummary}
          keyExtractor={(item) => item.status}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4 }}
        />
      )}

      {/* Individual Orders List */}
      {!loading && !error && orders.length > 0 && currentView === 'detail' && (
        <FlatList
          data={getFilteredOrders()}
          renderItem={renderOrderDetail}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4 }}
        />
      )}

      {/* Review Modal */}
      <AddReviewModal
        visible={reviewModalVisible}
        onClose={() => {
          setReviewModalVisible(false);
          setSelectedOrderForReview(null);
        }}
        order={selectedOrderForReview}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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

  // Summary view card styles
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: { flex: 1 },
  status: { fontSize: 15, fontWeight: "700" },
  orderId: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  // Detailed order card styles
  orderDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateTextInline: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  cancelButtonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelButtonText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderIdText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  
  productSection: {
    flexDirection: "row",
    marginBottom: 12,
  },
  productImageContainer: {
    marginRight: 16,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
    marginBottom: 2,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  quantityLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  sellerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 6,
  },
  sellerInfo: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
    flex: 1,
  },

  transporterSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEF3E2",
    borderRadius: 8,
    marginBottom: 6,
  },
  transporterInfo: {
    fontSize: 13,
    color: "#F97316",
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },

  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#059669",
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 6,
  },
});