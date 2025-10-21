import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, ShoppingCart, CreditCard } from 'lucide-react'
import ProductCard from './ProductCard'
import api from '@/lib/api'
import { resolveProductImage } from '@/lib/image'
import { getCurrentCid } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'

export default function FeaturedProducts(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { show } = useToast()

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
          .map(p => ({
            id: p.productId,
            title: p.productName,
            desc: p.description,
            price: p.price,
            unit: p.unit,
            stock: p.stockQuantity,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            tags: [],
            locationLabel: p.sellerLocationLabel || '',
            image: resolveProductImage(p),
          }))
        setItems(top3)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])
  
  const handleAdd = async (productId) => {
    const cid = getCurrentCid()
    if (!cid) {
      navigate('/login', { state: { from: location }, replace: true })
      return
    }
    try {
      await api.addToCart({ productId, quantity: 1, cid })
      show('Added to cart')
    } catch (e) {
      const msg = e?.status === 409 ? 'This product is already in your cart' : (e?.body?.error || e.message || 'Failed to add to cart')
      show(msg, { variant: 'error' })
    }
  }

  const handleBuyNow = async (productId) => {
    const cid = getCurrentCid()
    if (!cid) {
      navigate('/login', { state: { from: location, redirectTo: `/buy?pid=${productId}` }, replace: true })
      return
    }
    // Directly navigate to buy page; do not add to cart
    navigate(`/buy?pid=${productId}`)
  }
  return (
    <section id="featured-products" className="py-16 bg-emerald-50/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-emerald-800">Featured Products</h2>
          <p className="mt-2 text-emerald-700/80">Discover fresh, high-quality produce from our trusted local farmers</p>
        </div>

  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((p) => (
            <ProductCard key={p.id || p.title} product={p}>
              <Button variant="outline" size="sm" className="inline-flex items-center justify-center gap-2" onClick={()=>handleAdd(p.id)}><ShoppingCart className="w-4 h-4" /> Add to Cart</Button>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center justify-center gap-2" onClick={()=>handleBuyNow(p.id)}><CreditCard className="w-4 h-4" /> Buy Now</Button>
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
