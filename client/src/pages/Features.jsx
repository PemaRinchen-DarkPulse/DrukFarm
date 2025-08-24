import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, ShoppingCart, CreditCard } from 'lucide-react'
import api from '@/lib/api'

let initialProducts = []

export default function Features(){
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = ['all','Vegetables','Fruits','Grains','Spices','Dairy','Processed']

  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    setLoading(true)
    api.fetchProducts()
      .then(list => {
        const guessMimeFromBase64 = (b64) => {
          if (!b64 || typeof b64 !== 'string') return null
          const s = b64.slice(0, 12)
          if (s.startsWith('/9j/')) return 'image/jpeg'
          if (s.startsWith('iVBORw0KG')) return 'image/png'
          if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) return 'image/gif'
          if (s.startsWith('UklGR') || s.startsWith('RIFF')) return 'image/webp'
          return 'image/jpeg'
        }
        setProducts(list.map(p => {
          const mime = p.productImageBase64 ? guessMimeFromBase64(p.productImageBase64) : null
          return {
            id: p.productId,
            title: p.productName,
            desc: p.description,
            price: p.price,
            unit: p.unit,
            tags: [],
            location: p.categoryName || '' ,
            image: p.productImageBase64 && mime ? `data:${mime};base64,${p.productImageBase64}` : null
          }
        }))
      })
      .catch(e => console.error(e))
      .finally(()=> setLoading(false))
  }, [])

  const filtered = useMemo(()=> {
    return products.filter(p => {
      if(category !== 'all' && (!p.tags || !p.tags.includes(category))) return false
      if(query && !(`${p.title} ${p.desc}`.toLowerCase().includes(query.toLowerCase()))) return false
      return true
    })
  }, [query, category, products])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-slate-600">Browse produce listed by local Bhutanese farmers.</p>
        </div>

        <div className="flex items-center gap-3">
          <input placeholder="Search products, sellers..." value={query} onChange={(e)=>setQuery(e.target.value)} className="border rounded-md px-3 py-2" />
          <select value={category} onChange={(e)=>setCategory(e.target.value)} className="border rounded-md px-3 py-2">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <article key={p.id} className="rounded-lg bg-white shadow-sm border border-emerald-100 overflow-hidden">
            <div className="relative h-64 bg-emerald-50/60 overflow-hidden">
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
                  <div className="mt-2 text-2xl font-bold text-emerald-800">Nu. {p.price} <span className="text-lg font-medium text-slate-500">/{p.unit}</span></div>
                  <div className="mt-3 flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1 inline-flex items-center justify-center gap-2"><ShoppingCart className="w-4 h-4" /> Add to Cart</Button>
                    <Button size="sm" className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center justify-center gap-2"><CreditCard className="w-4 h-4" /> Buy Now</Button>
                  </div>
                </div>
              </div>
          </article>
        ))}
      </div>
    </div>
  )
}
