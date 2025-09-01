import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, ShoppingCart, CreditCard, Search, SlidersHorizontal } from 'lucide-react'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '@/components/ui/toast'

let initialProducts = []

export default function Features(){
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const categories = ['all','Vegetables','Fruits','Grains','Spices','Dairy','Processed']

  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { show } = useToast()

  const load = () => {
    setLoading(true)
    api.fetchProducts()
      .then(list => {
        const currentCid = getCurrentCid()
        const visible = currentCid ? list.filter(p => !p.createdBy || p.createdBy !== currentCid) : list
        const guessMimeFromBase64 = (b64) => {
          if (!b64 || typeof b64 !== 'string') return null
          const s = b64.slice(0, 12)
          if (s.startsWith('/9j/')) return 'image/jpeg'
          if (s.startsWith('iVBORw0KG')) return 'image/png'
          if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) return 'image/gif'
          if (s.startsWith('UklGR') || s.startsWith('RIFF')) return 'image/webp'
          return 'image/jpeg'
        }
        setProducts(visible.map(p => {
          const mime = p.productImageBase64 ? guessMimeFromBase64(p.productImageBase64) : null
          const vg = (p.sellerLocationVillageGewog || '').trim()
          const dz = (p.sellerDzongkhag || '').trim()
          const loc = (vg && dz) ? `${vg}, ${dz}` : (p.sellerLocationLabel || vg || dz || '')
          return {
            id: p.productId,
            title: p.productName,
            desc: p.description,
            price: p.price,
            unit: p.unit,
            stock: p.stockQuantity,
            tags: [],
            location: loc,
            image: p.productImageBase64 && mime ? `data:${mime};base64,${p.productImageBase64}` : null
          }
        }))
      })
      .catch(e => console.error(e))
      .finally(()=> setLoading(false))
  }

  useEffect(()=>{
    load()
    const onAuthChanged = () => load()
    window.addEventListener('authChanged', onAuthChanged)
    return () => window.removeEventListener('authChanged', onAuthChanged)
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

  const filtered = useMemo(()=> {
    return products.filter(p => {
      if(category !== 'all' && (!p.tags || !p.tags.includes(category))) return false
      if(query && !(`${p.title} ${p.desc}`.toLowerCase().includes(query.toLowerCase()))) return false
      return true
    })
  }, [query, category, products])

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
    <div className="max-w-7xl mx-auto p-6 overflow-x-hidden">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-emerald-900">Products</h1>
            <p className="text-slate-600">Browse produce listed by local Bhutanese farmers.</p>
          </div>

          {/* Inline filters on md+ */}
          <div className="hidden md:flex items-center gap-3 min-w-0 w-full md:w-auto md:max-w-xl">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                placeholder="Search products, sellers..."
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <select
              value={category}
              onChange={(e)=>setCategory(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Toggle button on mobile */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              aria-expanded={showFilters}
              aria-controls="mobile-filters"
              className="inline-flex items-center gap-2 w-full"
              onClick={()=>setShowFilters(v=>!v)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Mobile filter panel */}
        <div id="mobile-filters" className={`md:hidden ${showFilters ? 'mt-3 grid' : 'hidden'} grid-cols-1 gap-3`}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              placeholder="Search products, sellers..."
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <select
            value={category}
            onChange={(e)=>setCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <article key={p.id} className="rounded-lg bg-white shadow-sm border border-emerald-100 overflow-hidden">
            <div className="relative h-48 bg-emerald-50/60 overflow-hidden">
              <div className="absolute top-3 left-3 flex gap-2">
                {p.tags.map((t, idx) => (
                  <span key={idx} className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">{t}</span>
                ))}
              </div>
              <div className="absolute top-3 right-3 rounded-full border p-2 text-emerald-600 bg-white/60">♡</div>
              {p.image ? (
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>

              <div className="p-4 bg-white">
                <h3 className="text-lg font-semibold text-emerald-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.desc}</p>
                <div className="mt-3 text-sm text-slate-500 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{p.location}</span>
                </div>

                <div className="mt-3">
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <div className="text-2xl font-bold text-emerald-800">Nu. {p.price} <span className="text-lg font-medium text-slate-500">/{p.unit}</span></div>
                    <div className="text-sm font-medium text-slate-600">Stock: {p?.stock ?? 0} {p.unit}</div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1 inline-flex items-center justify-center gap-2" onClick={()=>handleAdd(p.id)}><ShoppingCart className="w-4 h-4" /> Add to Cart</Button>
                    <Button size="sm" className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center justify-center gap-2" onClick={()=>handleBuyNow(p.id)}><CreditCard className="w-4 h-4" /> Buy Now</Button>
                  </div>
                </div>
              </div>
          </article>
        ))}
      </div>
    </div>
  )
}
