import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ShoppingCart, CreditCard } from 'lucide-react-native'
import { Button } from './ui/Button'   // your RN button version
import api from '../lib/api'
import { getCurrentCid } from '../lib/auth'

export default function FeaturedProducts() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    const guessMimeFromBase64 = (b64) => {
      if (!b64 || typeof b64 !== 'string') return null
      const s = b64.slice(0, 12)
      if (s.startsWith('/9j/')) return 'image/jpeg'
      if (s.startsWith('iVBORw0KG')) return 'image/png'
      if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) return 'image/gif'
      if (s.startsWith('UklGR') || s.startsWith('RIFF')) return 'image/webp'
      return 'image/jpeg'
    }

    setLoading(true)
    api.fetchProducts()
      .then(list => {
        const top3 = [...list]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3)
          .map(p => {
            const mime = p.productImageBase64 ? guessMimeFromBase64(p.productImageBase64) : null
            return {
              id: p.productId,
              title: p.productName,
              desc: p.description,
              price: p.price,
              unit: p.unit,
              stock: p.stockQuantity,
              rating: p.rating || 0,
              reviews: p.reviews || 0,
              locationLabel: p.sellerLocationLabel || '',
              image: p.productImageBase64 && mime ? `data:${mime};base64,${p.productImageBase64}` : null
            }
          })
        setItems(top3)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (productId) => {
    const cid = getCurrentCid()
    if (!cid) {
      navigation.navigate('Login')
      return
    }
    try {
      await api.addToCart({ productId, quantity: 1, cid })
      // feedback can be added here if you want
    } catch (e) {
      console.error(e)
    }
  }

  const handleBuyNow = (productId) => {
    const cid = getCurrentCid()
    if (!cid) {
      navigation.navigate('Login', { redirectTo: `Buy`, pid: productId })
      return
    }
    navigation.navigate('Buy', { pid: productId })
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text>No Image</Text>
        </View>
      )}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.price}>₹{item.price} / {item.unit}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>

      <View style={styles.actions}>
        <Button variant="outline" size="sm" onPress={() => handleAdd(item.id)}>
          <ShoppingCart size={16} color="#111" /> Add to Cart
        </Button>
        <Button size="sm" onPress={() => handleBuyNow(item.id)} style={{ backgroundColor: '#047857' }}>
          <CreditCard size={16} color="#fff" /> <Text style={{ color: '#fff' }}>Buy Now</Text>
        </Button>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Featured Products</Text>
      <Text style={styles.subHeading}>
        Discover fresh, high-quality produce from our trusted local farmers
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#047857" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* View All Products Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.viewAllText}>View All Products →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ECFDF5', // emerald-50
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065F46', // emerald-800
    textAlign: 'center',
  },
  subHeading: {
    marginTop: 8,
    fontSize: 14,
    color: '#047857', // emerald-700
    textAlign: 'center',
  },
  list: {
    marginTop: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065F46',
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  viewAllBtn: {
    backgroundColor: '#047857',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
