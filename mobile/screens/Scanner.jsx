import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export default function Scanner() {
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    if (!permission) {
      // trigger initial permission fetch
      requestPermission()
    }
  }, [])

  // Reset scanned when screen refocuses
  useEffect(() => {
    if (isFocused) setScanned(false)
  }, [isFocused])

  const handleBarCodeScanned = useCallback(({ type, data }) => {
    if (scanned) return
    setScanned(true)
    // You can handle the scanned data here (navigate, set state, etc.)
    // For now, just close the modal and pass data back if needed later
    // navigation.navigate('SomeScreen', { scannedType: type, scannedData: data })
    navigation.goBack()
  }, [navigation, scanned])

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
          <Icon name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR or Barcode</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scanner view */}
      <View style={styles.scannerWrap}>
        {isFocused && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr', 'pdf417', 'ean13', 'ean8', 'upc_e', 'upc_a', 'code128', 'code39', 'code93', 'itf14'
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}
        {/* Simple guide frame */}
        <View style={styles.frame} pointerEvents="none" />
      </View>

      {/* Bottom hint */}
      <View style={styles.bottomBar}>
        <Text style={styles.hint}>Align the code within the frame to scan</Text>
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
  bottomBar: { padding: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' },
  hint: { color: '#e5e7eb' },
  closeBtn: { marginTop: 8, backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '600' },
})
