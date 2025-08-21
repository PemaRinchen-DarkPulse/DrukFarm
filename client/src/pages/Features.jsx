import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, ShoppingCart, CreditCard } from 'lucide-react'

const products = [
  { id: 1, title: 'Organic Red Rice', desc: 'Premium red rice', seller: 'Tashi Farms', price: '120', unit: 'kg', tags: ['Grains', 'Organic'], location: 'Thimphu' },
  { id: 2, title: 'Local Carrots', desc: 'Fresh carrots', seller: 'Pem Organic', price: '45', unit: 'kg', tags: ['Vegetables'], location: 'Paro' },
  { id: 3, title: 'Fresh Chillies', desc: 'Spicy chillies', seller: 'Thimphu Market', price: '60', unit: 'kg', tags: ['Vegetables', 'Spices'], location: 'Thimphu' },
  { id: 4, title: 'Cow Milk', desc: 'Raw fresh milk', seller: 'Nima Dairy', price: '40', unit: 'litre', tags: ['Dairy'], location: 'Bumthang' },
]

export default function Features(){
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = ['all','Vegetables','Fruits','Grains','Spices','Dairy','Processed']

  const filtered = useMemo(()=> {
    return products.filter(p => {
      if(category !== 'all' && !p.tags.includes(category)) return false
      if(query && !(`${p.title} ${p.desc} ${p.seller}`.toLowerCase().includes(query.toLowerCase()))) return false
      return true
    })
  }, [query, category])

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
            <div className="relative h-64 bg-emerald-50/60">
              <div className="absolute top-3 left-3 flex gap-2">
                {p.tags.map((t, idx) => (
                  <span key={idx} className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">{t}</span>
                ))}
              </div>
              <div className="absolute top-3 right-3 rounded-full border p-2 text-emerald-600 bg-white/60">♡</div>
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
