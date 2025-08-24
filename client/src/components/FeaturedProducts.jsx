import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { MapPin, ShoppingCart, CreditCard } from 'lucide-react'
import ProductCard from './ProductCard'
import api from '@/lib/api'

export default function FeaturedProducts(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

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
              rating: p.rating || 0,
              reviews: p.reviews || 0,
              tags: [],
              location: p.categoryName || '',
              image: p.productImageBase64 && mime ? `data:${mime};base64,${p.productImageBase64}` : null
            }
          })
        setItems(top3)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])
  return (
    <section id="featured-products" className="py-16 bg-emerald-50/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-emerald-800">Featured Products</h2>
          <p className="mt-2 text-emerald-700/80">Discover fresh, high-quality produce from our trusted local farmers</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <ProductCard key={p.id || p.title} product={p}>
              <Button variant="outline" size="sm" className="flex-1 inline-flex items-center justify-center gap-2"><ShoppingCart className="w-4 h-4" /> Add to Cart</Button>
              <Button size="sm" className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center justify-center gap-2"><CreditCard className="w-4 h-4" /> Buy Now</Button>
            </ProductCard>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button className="bg-emerald-700 hover:bg-emerald-600 text-white" asChild>
            <Link to="/products">View All Products →</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
