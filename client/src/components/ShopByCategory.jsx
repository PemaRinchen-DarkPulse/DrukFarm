import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'

export default function ShopByCategory(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
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
  const mapped = cats.slice(0, 3).map(c => {
          const mime = guessMimeFromBase64(c.imageBase64)
          const count = countMap[String(c.categoryId)] || 0
          return {
            id: c.categoryId,
            title: c.categoryName,
            desc: c.description,
            count,
            // Use data URL for background
            bg: c.imageBase64 && mime ? `data:${mime};base64,${c.imageBase64}` : null,
          }
        })
        setItems(mapped)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
  <section id="categories" className="py-16 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-emerald-800">Shop by Category</h2>
          <p className="mt-2 text-emerald-700/80">Explore our wide range of fresh, locally sourced agricultural products</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(loading ? Array.from({ length: 3 }).map((_, idx) => ({ id: `sk-${idx}`, title: '\u00A0', desc: '\u00A0', bg: null })) : items)
            .map((cat, idx) => (
              <article
                key={cat.id}
                className={`relative overflow-hidden rounded-lg shadow-sm border border-emerald-50 bg-white p-6 text-center h-48 sm:h-56 lg:h-64 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow ${idx >= 3 ? 'hidden sm:block' : ''}`}
                style={cat.bg ? { backgroundImage: `url('${cat.bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                onClick={() => { if (!loading) navigate(`/products?category=${encodeURIComponent(cat.title || '')}`) }}
              >
                {/* subtle overlay for readability when image exists */}
                {cat.bg ? <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div> : null}

                <div className="relative">
                  <h3 className={`font-semibold drop-shadow mb-2 leading-tight ${cat.bg ? 'text-white' : 'text-emerald-700'} text-2xl sm:text-3xl`}>{cat.title || (loading ? 'Loading…' : '')}</h3>
                  <p className={`mb-4 line-clamp-2 ${cat.bg ? 'text-white/95 drop-shadow-md' : 'text-slate-600'} text-lg sm:text-xl`}>{cat.desc || (loading ? ' ' : '')}</p>
                  {/* Product count badge */}
                  {typeof cat.count === 'number' ? (
                    <div className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${cat.bg ? 'bg-white/85 text-emerald-900' : 'bg-emerald-50 text-emerald-800'}`}>
                      {cat.count > 0 ? `${cat.count}+` : '0'} products
                    </div>
                  ) : null}
                </div>
              </article>
            ))}

          {/* Removed Add Category card */}
        </div>

        <div className="mt-8 text-center">
          <Link to="/categories" className="inline-flex items-center gap-2 rounded-md border bg-white px-5 py-3 text-sm font-medium shadow-sm hover:bg-emerald-50">Browse All Categories →</Link>
        </div>
      </div>
    </section>
  )
}
