import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { ShoppingCart, CreditCard, Heart, MapPin, Star } from 'lucide-react-native'
import api from '../../lib/api'
import { getCurrentCid } from '../../lib/auth'

export default function ProductCard({ item, onAdd, onBuy, onWish }) {
  const handleWish = async () => {
    try {
      if (typeof onWish === 'function') return onWish(item.id)
      const cid = getCurrentCid()
      if (!cid) return
      await api.addToWishlist({ productId: item.id, cid })
    } catch (e) {
      console.warn('Wishlist error:', e?.message || e)
    }
  }
  return (
    <View style={styles.card}>
      <View>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text>No Image</Text>
          </View>
        )}

  {/* Wishlist Heart */}
  <TouchableOpacity style={styles.heartBtn} onPress={handleWish}>
          <Heart size={20} color="#047857" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>

      {/* Location */}
      <View style={styles.row}>
        <MapPin size={14} color="#047857" />
        <Text style={styles.location}>{item.locationLabel}</Text>
      </View>

      {/* Rating + Reviews */}
      <View style={styles.row}>
        <Star size={14} color="#FBBF24" />
        <Text style={styles.rating}>
          {item.rating} ({item.reviews} reviews)
        </Text>
      </View>

      {/* Price + Stock */}
      <View style={styles.rowBetween}>
        <Text style={styles.price}>Nu. {item.price} / {item.unit}</Text>
        <Text style={styles.stock}>Stock: {item.stock}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onAdd(item.id)}
        >
          <ShoppingCart size={16} color="#047857" />
          <Text style={styles.actionText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onBuy(item.id)}
        >
          <CreditCard size={16} color="#047857" />
          <Text style={styles.actionText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  location: {
    marginLeft: 4,
    fontSize: 12,
    color: '#374151',
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    color: '#374151',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  stock: {
    fontSize: 12,
    color: '#4b5563',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
})