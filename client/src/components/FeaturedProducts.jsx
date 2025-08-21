import React from 'react'
import { Button } from '@/components/ui/button'

const products = [
  {
    title: 'Organic Red Rice',
    desc: 'Premium quality red rice grown in the hills of Thimphu',
    location: 'Pema Dorji, Thimphu',
    price: '120',
    unit: 'kg',
    rating: 4.8,
    reviews: 24,
    tags: ['Premium', 'Organic']
  },
  {
    title: 'Fresh Chili Peppers',
    desc: 'Locally grown spicy chili peppers perfect for traditional dishes.',
    location: 'Tenzin Lhamo, Paro',
    price: '80',
    unit: 'kg',
    rating: 4.6,
    reviews: 18,
    tags: ['Organic']
  },
  {
    title: 'Mountain Potatoes',
    desc: 'Fresh potatoes grown in high altitude mountain regions',
    location: 'Karma Tshering, Bumthang',
    price: '45',
    unit: 'kg',
    rating: 4.7,
    reviews: 32,
    tags: []
  }
]

export default function FeaturedProducts(){
  return (
    <section id="featured-products" className="py-16 bg-emerald-50/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-emerald-800">Featured Products</h2>
          <p className="mt-2 text-emerald-700/80">Discover fresh, high-quality produce from our trusted local farmers</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <article key={i} className="rounded-lg bg-white shadow-sm border border-emerald-100 overflow-hidden">
              <div className="p-4">
                <div className="flex gap-2">
                  {p.tags.map((t, idx) => (
                    <span key={idx} className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">{t}</span>
                  ))}
                  <div className="ml-auto rounded-full border p-1 text-emerald-600">♡</div>
                </div>
              </div>

              <div className="h-64 bg-emerald-50/60"></div>

              <div className="p-4 bg-white">
                <h3 className="text-lg font-semibold text-emerald-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.desc}</p>
                <div className="mt-3 text-sm text-slate-500 flex items-center gap-3">
                  <span className="inline-flex items-center gap-2">📍 <span>{p.location}</span></span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-yellow-500 font-medium">★ {p.rating} <span className="text-slate-400 text-sm">({p.reviews} reviews)</span></div>
                    <div className="mt-2 text-2xl font-bold text-emerald-800">Nu. {p.price} <span className="text-lg font-medium text-slate-500">/{p.unit}</span></div>
                  </div>
                  <div className="w-40">
                    <Button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white" size="sm">🛒 Add to Cart</Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button className="bg-emerald-700 hover:bg-emerald-600 text-white">View All Products →</Button>
        </div>
      </div>
    </section>
  )
}
