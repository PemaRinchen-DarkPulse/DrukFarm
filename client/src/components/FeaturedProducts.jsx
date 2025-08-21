import React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { MapPin, ShoppingCart, CreditCard } from 'lucide-react'

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
              <div className="relative h-64 bg-emerald-50/60">
                {/* tags */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {p.tags.map((t, idx) => (
                    <span key={idx} className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">{t}</span>
                  ))}
                </div>
                {/* favorite */}
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
                  <div className="text-yellow-500 font-medium">★ {p.rating} <span className="text-slate-400 text-sm">({p.reviews} reviews)</span></div>
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

        <div className="mt-8 text-center">
          <Button className="bg-emerald-700 hover:bg-emerald-600 text-white" asChild>
            <Link to="/products">View All Products →</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
