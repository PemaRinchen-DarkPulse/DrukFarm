import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth, getCurrentCid } from '../lib/auth'
import { updateOrderStatus, fetchUserDispatchAddresses, fetchOrderById, saveTshogpasDetails, createTestOrder } from '../lib/api'
import { apiConfig } from '../lib/apiConfig'

export default function Scanner() {
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!permission) {
      requestPermission()
    }
  }, [])

  useEffect(() => {
    if (isFocused) setScanned(false)
  }, [isFocused])

  const showAlert = (title, message, onPress = null) => {
    Alert.alert(title, message, [
      { text: 'OK', onPress: onPress || (() => navigation.goBack()) }
    ])
  }

  const showSuccessAlert = (message) => {
    Alert.alert('Success', message, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  }

  const handleCreateTestOrder = async () => {
    try {
      const currentUserCid = getCurrentCid()
      if (!currentUserCid) {
        showAlert('Error', 'Please log in to create test order')
        return
      }

      setProcessing(true)
      const result = await createTestOrder(currentUserCid)
      
      Alert.alert(
        'Test Order Created', 
        `Order ID: ${result.orderId}\n\nYou can now create a QR code with this ID and scan it to test the scanner functionality.`,
        [
          { text: 'Copy ID', onPress: () => {
            // If running on web, copy to clipboard
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(result.orderId)
            }
          }},
          { text: 'OK' }
        ]
      )
    } catch (error) {
      console.error('Error creating test order:', error)
      showAlert('Error', 'Failed to create test order: ' + (error.message || 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  const handleBarCodeScanned = useCallback(async ({ type, data }) => {
    if (scanned || processing) return
    setScanned(true)
    setProcessing(true)

    try {
      const currentUserCid = getCurrentCid()
      console.log('Current User CID:', currentUserCid)
      if (!currentUserCid) {
        showAlert('Error', 'Please log in to scan orders')
        return
      }

      // Extract order ID from QR code data
      console.log('QR Code Data:', data)
      
      let orderId = null
      
      // Try different QR code formats
      if (data === 'test') {
        // For testing purposes
        orderId = '66daa4c8c8ba803156ece8d7' // Sample valid ObjectId format
      } else if (data.includes('/orders/')) {
        // URL format: https://example.com/orders/66daa4c8c8ba803156ece8d7
        const match = data.match(/\/orders\/([a-fA-F0-9]{24})/)
        if (match) {
          orderId = match[1]
        }
      } else if (data.includes('order:')) {
        // Prefixed format: order:66daa4c8c8ba803156ece8d7
        const match = data.match(/order:([a-fA-F0-9]{24})/)
        if (match) {
          orderId = match[1]
        }
      } else if (/^[0-9a-fA-F]{24}$/.test(data)) {
        // Direct ObjectId format
        orderId = data
      } else {
        // Try to extract any 24-character hex string from the data
        const match = data.match(/([a-fA-F0-9]{24})/)
        if (match) {
          orderId = match[1]
        }
      }

      console.log('Extracted Order ID:', orderId)
      
      if (!orderId) {
        showAlert('Error', `Invalid QR code format. Expected order ID but got: "${data.substring(0, 50)}${data.length > 50 ? '...' : ''}".\n\nQR code should contain:\n- A 24-character order ID\n- URL with /orders/[id]\n- Format like "order:[id]"`)
        return
      }

      // Fetch order details
      console.log('Fetching order...')
      const order = await fetchOrderById(orderId, currentUserCid)
      if (!order) {
        showAlert('Error', 'Order not found')
        return
      }

      // Get current user role and CID
      const userRole = user?.role || 'vegetable_vendor'
      const userCid = currentUserCid

      // Process based on user role and order conditions
      await processOrderByRole(order, userRole, userCid)

    } catch (error) {
      console.error('QR Scan Error:', error)
      console.error('Error status:', error.status)
      console.error('Error body:', error.body)
      
      let errorMessage = 'Failed to process QR code'
      if (error.status === 400) {
        errorMessage = error.body?.error || 'Invalid request - please check the QR code format'
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed - please log in again'
      } else if (error.status === 403) {
        errorMessage = 'Access denied - you don\'t have permission to view this order'
      } else if (error.status === 404) {
        errorMessage = 'Order not found - the QR code may be invalid'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showAlert('Error', errorMessage)
    } finally {
      setProcessing(false)
    }
  }, [scanned, processing, user, navigation])

  const processOrderByRole = async (order, userRole, userCid) => {
    const { _id: orderId, status, userCid: orderUserCid, product } = order
    const sellerCid = product?.sellerCid

    switch (userRole) {
      case 'farmer':
      case 'transporter':
      case 'vegetable_vendor':
        // If order belongs to user (either as buyer or seller), update status to 'delivered'
        if (orderUserCid === userCid || sellerCid === userCid) {
          await updateOrderStatus({ orderId, status: 'delivered', cid: userCid })
          showSuccessAlert('Order marked as delivered successfully!')
        } else {
          showAlert('Error', 'This order does not belong to you')
        }
        break

      case 'tshogpas':
        await processTshogpasOrder(order, userCid)
        break

      default:
        showAlert('Error', 'Unauthorized role for order scanning')
    }
  }

  const processTshogpasOrder = async (order, userCid) => {
    const { _id: orderId, status, tshogpasCid, userCid: orderUserCid, product } = order
    const sellerCid = product?.sellerCid

    // Special case: If the buyer (orderUserCid) is the same as current tshogpas scanning
    // This means the tshogpas is scanning their own order - mark as delivered directly
    if (orderUserCid === userCid) {
      await updateOrderStatus({ orderId, status: 'delivered', cid: userCid })
      showSuccessAlert('Your order has been marked as delivered!')
      return
    }

    if (status === 'order confirmed' || status === 'confirmed') {
      // Check if order belongs to this tshogpas (as assigned tshogpas or seller)
      if (tshogpasCid === userCid || sellerCid === userCid) {
        // Order belongs to this tshogpas - mark as delivered
        await updateOrderStatus({ orderId, status: 'delivered', cid: userCid })
        showSuccessAlert('Order marked as delivered successfully!')
      } else {
        // Order doesn't belong to this tshogpas - check dispatch address and update to shipped
        try {
          const dispatchAddresses = await fetchUserDispatchAddresses(userCid)
          const defaultAddress = dispatchAddresses.find(addr => addr.isDefault)

          if (!defaultAddress) {
            // No dispatch address - redirect to dispatch address screen
            Alert.alert(
              'Error', 
              'Please add dispatch address', 
              [
                { 
                  text: 'Add Address', 
                  onPress: () => {
                    navigation.navigate('DispatchAddress') // Adjust route name as needed
                  }
                },
                { text: 'Cancel', onPress: () => navigation.goBack() }
              ]
            )
          } else {
            // Has dispatch address - update to shipped and save tshogpas details
            await updateOrderStatus({ orderId, status: 'shipped', cid: userCid })
            await saveTshogpasDetails(orderId, userCid, defaultAddress)
            showSuccessAlert('Order marked as shipped and tshogpas details saved!')
          }
        } catch (error) {
          showAlert('Error', 'Failed to process order: ' + error.message)
        }
      }
    } else if (status === 'Out for Delivery') {
      // Check if order belongs to this tshogpas
      if (tshogpasCid === userCid || sellerCid === userCid) {
        // Order belongs to this tshogpas - mark as delivered
        await updateOrderStatus({ orderId, status: 'delivered', cid: userCid })
        showSuccessAlert('Order marked as delivered successfully!')
      } else {
        showAlert('Error', 'This order does not belong to you')
      }
    } else {
      showAlert('Error', `Cannot process order with status: ${status}`)
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}> 
        <Text>Requesting camera permission…</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.denied}>Camera access denied. Please enable it in settings.</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Top bar with close */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scanner view */}
      <View style={styles.scannerWrap}>
        {isFocused && !processing && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}
        
        {/* Processing overlay */}
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.processingText}>Processing order...</Text>
          </View>
        )}
        
        {/* Simple guide frame */}
        <View style={styles.frame} pointerEvents="none" />
      </View>

      {/* Bottom hint */}
      <View style={styles.bottomBar}>
        <Text style={styles.hint}>
          {processing ? 'Processing...' : 'Align the QR code within the frame to scan'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
  denied: { color: '#fff', textAlign: 'center', marginBottom: 12 },
  topBar: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scannerWrap: { flex: 1, position: 'relative' },
  frame: { position: 'absolute', left: '10%', right: '10%', top: '20%', bottom: '20%', borderColor: '#10B981', borderWidth: 2, borderRadius: 12 },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500'
  },
  bottomBar: { padding: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' },
  hint: { color: '#e5e7eb', textAlign: 'center', marginBottom: 12 },
  testBtn: { 
    backgroundColor: '#3B82F6', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 6,
    marginTop: 8
  },
  testBtnText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  closeBtn: { marginTop: 8, backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '600' },
})
