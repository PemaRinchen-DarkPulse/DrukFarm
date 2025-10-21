import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Category(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

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
    Promise.all([api.fetchCategories(), api.fetchProducts({ cid, includeOwn: false })])
      .then(([cats = [], prods = []]) => {
        const countMap = prods.reduce((acc, p) => {
          const key = String(p.categoryId || '')
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
        const mapped = cats.map(c => {
          const mime = guessMimeFromBase64(c.imageBase64)
          const count = countMap[String(c.categoryId)] || 0
          return {
            id: c.categoryId,
            title: c.categoryName,
            desc: c.description,
            count,
            bg: c.imageBase64 && mime ? `data:${mime};base64,${c.imageBase64}` : null,
          }
        })
        setItems(mapped)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  let cards = (loading ? Array.from({ length: 6 }).map((_, i) => ({ id: `sk-${i}`, title: '\u00A0', desc: '\u00A0', bg: null, count: 0 })) : items)
  if (!loading && query) {
    const q = query.toLowerCase()
    cards = cards.filter(c => `${c.title} ${c.desc}`.toLowerCase().includes(q))
  }
  if (!loading) {
    cards = [...cards].sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'count') return (b.count || 0) - (a.count || 0)
      return 0
    })
  }

  return (
    <section className="py-16 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-emerald-900">Categories</h1>
              <p className="text-slate-600">Browse products by category.</p>
            </div>

            {/* Inline filters on md+ */}
            <div className="hidden md:flex items-center gap-3 min-w-0 w-full md:w-auto md:max-w-xl">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  placeholder="Search categories..."
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e)=>setSortBy(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="name">Sort: Name</option>
                <option value="count">Sort: Product Count</option>
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
                placeholder="Search categories..."
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e)=>setSortBy(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="name">Sort: Name</option>
              <option value="count">Sort: Product Count</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.length === 0 && !loading ? (
            <div className="col-span-full text-center text-slate-500">No categories yet.</div>
          ) : (
      cards.map((cat) => (
              <article
                key={cat.id}
        className={`relative overflow-hidden rounded-lg shadow-sm border border-emerald-50 bg-white p-6 text-center h-48 sm:h-56 lg:h-64 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow`}
                style={cat.bg ? { backgroundImage: `url('${cat.bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        onClick={() => { if (!loading) navigate(`/products?category=${encodeURIComponent(cat.title || '')}`) }}
              >
                {cat.bg ? <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div> : null}

                <div className="relative">
                  <h3 className={`font-semibold drop-shadow mb-2 leading-tight ${cat.bg ? 'text-white' : 'text-emerald-700'} text-2xl sm:text-3xl`}>{cat.title || (loading ? 'Loading…' : '')}</h3>
                  <p className={`mb-4 line-clamp-2 ${cat.bg ? 'text-white/95 drop-shadow-md' : 'text-slate-600'} text-lg sm:text-xl`}>{cat.desc || (loading ? ' ' : '')}</p>
                  {typeof cat.count === 'number' ? (
                    <div className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${cat.bg ? 'bg-white/85 text-emerald-900' : 'bg-emerald-50 text-emerald-800'}`}>
                      {cat.count > 0 ? `${cat.count}+` : '0'} products
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
