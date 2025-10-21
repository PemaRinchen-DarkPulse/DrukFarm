import React, { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../../lib/api'
import { getCurrentCid } from '../../lib/auth'
import ProductCard from '../products/ProductCard'

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
    const cid = getCurrentCid()
    api.fetchProducts({ cid, includeOwn: false })
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
    } catch (e) {
      console.error(e)
    }
  }

  const handleBuyNow = (productId) => {
    const cid = getCurrentCid()
    if (!cid) {
      navigation.navigate('Login', { redirectTo: 'Buy', pid: productId })
      return
    }
  const prod = items.find(i => i.id === productId)
  navigation.navigate('Buy', { productId, product: prod })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Featured Products</Text>
      <Text style={styles.subHeading}>
        Discover fresh, high-quality produce from our trusted local farmers
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#047857" />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <ProductCard
              key={item.id?.toString?.() || String(item.id)}
              item={item}
              onAdd={handleAdd}
              onBuy={handleBuyNow}
              onWish={async (pid) => {
                const cid = getCurrentCid()
                if (!cid) { navigation.navigate('Login'); return }
                try { await api.addToWishlist({ productId: pid, cid }) } catch(e) { console.warn(e?.message||e) }
              }}
              onOpen={(prod) => {
                // map to the Product Detail expectations
                navigation.navigate('Product Detail', {
                  productId: prod?.id,
                  product: {
                    id: prod?.id,
                    name: prod?.title,
                    image: prod?.image,
                    stock: prod?.stock,
                    unit: prod?.unit,
                    rating: prod?.rating,
                    farmer: '',
                    locationLabel: prod?.locationLabel,
                  },
                })
              }}
            />
          ))}
        </View>
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
    flex: 1,
    gap: 16, // Added to control spacing between all direct children
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065F46',
    textAlign: 'center',
  },
  subHeading: {
    // marginTop removed
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
  },
  list: {
    // marginTop and paddingBottom removed
  },
  footer: {
    // marginTop removed
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