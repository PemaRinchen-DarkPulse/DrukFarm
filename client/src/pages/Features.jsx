import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, CreditCard, Search, SlidersHorizontal } from 'lucide-react'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '@/components/ui/toast'
import ProductCard from '@/components/ProductCard'

let initialProducts = []

export default function Features(){
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState(['all'])


  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { show } = useToast()

  const load = () => {
    setLoading(true)
    api.fetchProducts()
      .then(list => {
        const getUser = () => {
          try {
            const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
            return raw ? JSON.parse(raw) : null
          } catch { return null }
        }
        const user = getUser()
        const currentCid = user?.cid || getCurrentCid()
        // Show products to everyone. If a farmer is logged in, hide their own products.
        const visible = ((user?.role === 'farmer' || user?.role === 'tshogpas') && currentCid)
          ? list.filter(p => !p.createdBy || p.createdBy !== currentCid)
          : list
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
      category: p.categoryName || '',
            price: p.price,
            unit: p.unit,
            stock: p.stockQuantity,
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

  // Fetch categories from backend for the filter options
  useEffect(() => {
    api.fetchCategories()
      .then((list = []) => {
        const names = list.map(c => c.categoryName).filter(Boolean)
        setCategoryOptions(['all', ...names])
      })
      .catch(() => setCategoryOptions(['all']))
  }, [])

  // Apply category from URL if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const cat = params.get('category')
      if (cat && cat.trim()) setCategory(cat.trim())
    } catch {}
  }, [location.search])

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
      if(category !== 'all' && (p.category || '').toLowerCase() !== category.toLowerCase()) return false
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
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
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
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p}>
            <Button variant="outline" size="sm" className="inline-flex items-center justify-center gap-2" onClick={()=>handleAdd(p.id)}>
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </Button>
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center justify-center gap-2" onClick={()=>handleBuyNow(p.id)}>
              <CreditCard className="w-4 h-4" /> Buy Now
            </Button>
          </ProductCard>
        ))}
      </div>
    </div>
  )
}
