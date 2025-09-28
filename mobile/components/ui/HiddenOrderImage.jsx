import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { ensureMediaLibraryImagePermission } from '../../utils/imageDownloadSimple';
import { fetchSellerOrders, fetchUserByCid } from '../../lib/api';
import { getCurrentCid, getCurrentUser } from '../../lib/auth';

/**
 * HiddenOrderImage
 * - Renders a white card with order details and a QR code
 * - Exposes captureAndSave(orderId | orderObject) via ref
 * - Works in Expo Go using react-native-view-shot + MediaLibrary
 */
const HiddenOrderImage = forwardRef((props, ref) => {
  const shotRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [externalImageDataUrl, setExternalImageDataUrl] = useState(null);

  useImperativeHandle(ref, () => ({
    // Capture a locally rendered order card
    captureAndSave: async (orderInput) => {
      try {
        // Resolve order data: either an object or fetch by ID
        let ord = null;
        if (orderInput && typeof orderInput === 'object') {
          ord = orderInput;
        } else if (typeof orderInput === 'string') {
          const cid = getCurrentCid();
          const resp = await fetchSellerOrders({ cid });
          const list = resp?.orders || resp || [];
          ord = list.find(o => String(o.orderId) === String(orderInput));
          if (!ord) throw new Error('Order not found');
        } else {
          throw new Error('Invalid order input');
        }

        // Debug order structure
        console.log('Processing order:', ord?.orderId || ord?._id);
        console.log('Has deliveryAddress:', !!ord?.deliveryAddress);
        console.log('Has seller info:', !!ord?.seller);

        // Get seller information - now included directly in the order response
        let sellerInfo = { name: 'N/A', phoneNumber: 'N/A' };
        if (ord?.seller) {
          sellerInfo = {
            name: ord.seller.name || 'N/A',
            phoneNumber: ord.seller.phoneNumber || 'N/A'
          };
          console.log('Using seller info from order:', sellerInfo);
        } else {
          console.log('No seller info in order, trying fallback methods');
          // Fallback: try to fetch using sellerCid if available
          try {
            const sellerCid = ord?.product?.sellerCid;
            if (sellerCid) {
              console.log('Fetching seller info for CID:', sellerCid);
              const seller = await fetchUserByCid(sellerCid);
              if (seller) {
                sellerInfo = {
                  name: seller.name || 'N/A',
                  phoneNumber: seller.phoneNumber || 'N/A'
                };
              }
            }
          } catch (sellerError) {
            console.log('Error fetching seller info:', sellerError);
            // Last fallback to current user
            const currentUser = getCurrentUser();
            if (currentUser) {
              sellerInfo = {
                name: currentUser.name || 'N/A',
                phoneNumber: currentUser.phoneNumber || 'N/A'
              };
            }
          }
        }
        
        // Enhanced order details with all required information
        const details = {
          orderId: String(ord.orderId || ord._id || ''),
          // Consumer information
          consumerName: ord?.buyer?.name || ord?.userSnapshot?.name || 'N/A',
          consumerPhone: ord?.buyer?.phoneNumber || ord?.userSnapshot?.phoneNumber || 'N/A',
          // Product information
          productName: ord?.product?.name || ord?.product?.productName || 'N/A',
          quantity: ord?.quantity ?? 'N/A',
          unit: ord?.product?.unit || '',
          price: ord?.totalPrice ?? ord?.product?.price ?? 'N/A',
          // Seller information (now included in order response)
          sellerName: sellerInfo.name,
          sellerPhone: sellerInfo.phoneNumber,
          // Delivery address (now included directly in order response)
          deliveryPlace: ord?.deliveryAddress?.place || 'N/A',
          deliveryDzongkhag: ord?.deliveryAddress?.dzongkhag || 'N/A',
          // Order status
          status: ord?.status || 'N/A',
        };

        console.log('Generated order details for image:', {
          orderId: details.orderId,
          sellerName: details.sellerName,
          deliveryPlace: details.deliveryPlace,
          deliveryDzongkhag: details.deliveryDzongkhag
        });

        setOrder(details);

        // Wait a tick for render
        await new Promise(res => setTimeout(res, 100));

        // Capture directly to a temporary file (this works in Expo Go)
        console.log('Capturing image for gallery save...');
        const tmpUri = await shotRef.current.capture?.({ format: 'png', result: 'tmpfile', quality: 1 });
        if (!tmpUri) throw new Error('Failed to capture image');
        console.log('Image captured to:', tmpUri);

        // Save directly to MediaLibrary (this will prompt for permission automatically in Expo Go)
        console.log('Saving to MediaLibrary (this may prompt for permission)...');
        const asset = await MediaLibrary.createAssetAsync(tmpUri);
        console.log('Asset created successfully:', asset.id);
        
        // Try to organize in album (optional, non-blocking)
        try {
          let album = await MediaLibrary.getAlbumAsync('DrukFarm Orders');
          if (!album) {
            console.log('Creating DrukFarm Orders album...');
            album = await MediaLibrary.createAlbumAsync('DrukFarm Orders', asset, false);
            console.log('Album created successfully');
          } else {
            console.log('Adding to existing DrukFarm Orders album...');
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            console.log('Added to album successfully');
          }
        } catch (albumErr) {
          // Non-fatal: asset is still in Photos even if album ops fail
          console.log('Album operation skipped (image still saved to Photos):', albumErr?.message || albumErr);
        }

        Alert.alert('Success!', 'Order image saved to your Photos app!\n\nYou can find it in your gallery.');
        return true;
      } catch (e) {
        console.log('HiddenOrderImage captureAndSave error:', e);
        
        // More helpful error messages for Expo Go
        let errorMessage = 'Failed to save image to gallery';
        if (e.code === 'ERR_NO_PERMISSIONS' || e.message?.toLowerCase().includes('permission')) {
          errorMessage = 'Photo access permission is required. Please allow access when prompted by the system.';
        } else if (e.message?.includes('capture')) {
          errorMessage = 'Failed to process image. Please try again.';
        } else if (e.message?.includes('createAsset')) {
          errorMessage = 'Failed to save to gallery. Make sure you have storage space available.';
        } else if (e.message) {
          errorMessage = e.message;
        }
        
        Alert.alert('Save Failed', errorMessage + '\n\nTip: Make sure to allow photo access when prompted.');
        return false;
      }
    },

    // Capture and save from an external base64 image (server-provided)
    captureBase64AndSave: async (base64String) => {
      try {
        if (!base64String || typeof base64String !== 'string') throw new Error('Invalid image data');
        const dataUrl = base64String.startsWith('data:') ? base64String : `data:image/png;base64,${base64String}`;
        setExternalImageDataUrl(dataUrl);
        // wait to render
        await new Promise(res => setTimeout(res, 100));

        // Capture image to temporary file (this works in Expo Go)
        console.log('Capturing image for gallery save...');
        const tmpUri = await shotRef.current.capture?.({ format: 'png', result: 'tmpfile', quality: 1 });
        if (!tmpUri) throw new Error('Failed to capture image');
        console.log('Image captured to:', tmpUri);

        // Save directly to MediaLibrary (this will prompt for permission automatically in Expo Go)
        console.log('Saving to MediaLibrary (this may prompt for permission)...');
        const asset = await MediaLibrary.createAssetAsync(tmpUri);
        console.log('Asset created successfully:', asset.id);
        
        // Try to organize in album (optional, non-blocking)
        try {
          let album = await MediaLibrary.getAlbumAsync('DrukFarm Orders');
          if (!album) {
            console.log('Creating DrukFarm Orders album...');
            album = await MediaLibrary.createAlbumAsync('DrukFarm Orders', asset, false);
            console.log('Album created successfully');
          } else {
            console.log('Adding to existing DrukFarm Orders album...');
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            console.log('Added to album successfully');
          }
        } catch (albumErr) {
          console.log('Album operation skipped (image still saved to Photos):', albumErr?.message || albumErr);
        }

        setExternalImageDataUrl(null);
        Alert.alert('Success!', 'Order image saved to your Photos app!\n\nYou can find it in your gallery.');
        return true;
      } catch (e) {
        console.log('HiddenOrderImage captureBase64AndSave error:', e);
        setExternalImageDataUrl(null);
        
        // More helpful error messages for Expo Go
        let errorMessage = 'Failed to save image to gallery';
        if (e.code === 'ERR_NO_PERMISSIONS' || e.message?.toLowerCase().includes('permission')) {
          errorMessage = 'Photo access permission is required. Please allow access when prompted by the system.';
        } else if (e.message?.includes('capture')) {
          errorMessage = 'Failed to process image. Please try again.';
        } else if (e.message?.includes('createAsset')) {
          errorMessage = 'Failed to save to gallery. Make sure you have storage space available.';
        } else if (e.message) {
          errorMessage = e.message;
        }
        
        Alert.alert('Save Failed', errorMessage + '\n\nTip: Make sure to allow photo access when prompted.');
        return false;
      }
    }
  }), []);

  // Hidden container (rendered off-screen)
  return (
    <View style={styles.hiddenRoot} collapsable={false}>
      <ViewShot ref={shotRef} style={styles.canvas} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          {externalImageDataUrl ? (
            <Image
              source={{ uri: externalImageDataUrl }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain', backgroundColor: '#ffffff' }}
            />
          ) : (
            <View>
              {/* Header */}
              <Text style={styles.header}>DrukFarm Order</Text>
              {/* QR */}
              <View style={styles.qrWrap}>
                {order?.orderId ? (
                  <QRCode
                    value={`DrukFarm-Order-${order.orderId}`}
                    size={220}
                    backgroundColor="#ffffff"
                    color="#000000"
                  />
                ) : (
                  <View />
                )}
              </View>
              {/* Details */}
              <View style={styles.details}>
                {/* Order Information */}
                <SectionHeader title="ORDER DETAILS" />
                <Row label="Order ID" value={order?.orderId || ''} />
                <Row label="Status" value={order?.status || ''} />
                
                {/* Product Information */}
                <SectionHeader title="PRODUCT" />
                <Row label="Product Name" value={order?.productName || ''} />
                <Row label="Quantity" value={`${order?.quantity ?? ''} ${order?.unit ?? ''}`.trim()} />
                <Row label="Total Price" value={`Nu. ${order?.price ?? ''}`} />
                
                {/* Seller Information */}
                <SectionHeader title="SELLER" />
                <Row label="Seller Name" value={order?.sellerName || ''} />
                <Row label="Phone Number" value={order?.sellerPhone || ''} />
                
                {/* Consumer Information */}
                <SectionHeader title="CONSUMER" />
                <Row label="Consumer Name" value={order?.consumerName || ''} />
                <Row label="Phone Number" value={order?.consumerPhone || ''} />
                
                {/* Delivery Address */}
                <SectionHeader title="DELIVERY ADDRESS" />
                <Row label="Place" value={order?.deliveryPlace || ''} />
                <Row label="Dzongkhag" value={order?.deliveryDzongkhag || ''} />
              </View>
              {/* Footer */}
              <Text style={styles.footer}>Scan the QR to track and verify this order</Text>
            </View>
          )}
        </View>
      </ViewShot>
    </View>
  );
});

function SectionHeader({ title }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

function Row({ label, value }){
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenRoot: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0.01,
    // Increased dimensions to accommodate more content
    width: 1080,
    height: 1800,
  },
  canvas: {
    width: 1080,
    height: 1800,
    backgroundColor: '#ffffff',
    padding: 40,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 2,
    borderRadius: 20,
    padding: 40,
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 24,
  },
  qrWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  details: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 32,
    fontWeight: '800',
    color: '#059669',
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  label: {
    fontSize: 28,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 28,
    color: '#111827',
    textAlign: 'right',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 24,
    fontWeight: '500',
  },
});

export default HiddenOrderImage;
