import React from 'react'
import { Link } from 'react-router-dom'

const categories = [
  { id: 'veg', title: 'Vegetables', desc: 'Fresh leafy greens and root vegetables', count: '120+' },
  { id: 'fruits', title: 'Fruits', desc: 'Seasonal fruits and berries', count: '80+' },
  { id: 'grains', title: 'Grains & Rice', desc: 'Traditional rice varieties and cereals', count: '45+' },
  { id: 'spices', title: 'Spices & Herbs', desc: 'Aromatic spices and medicinal herbs', count: '60+' },
  { id: 'dairy', title: 'Dairy Products', desc: 'Fresh milk, cheese and dairy items', count: '25+' },
  { id: 'processed', title: 'Processed Foods', desc: 'Traditional preserved and processed foods', count: '35+' },
]

export default function ShopByCategory(){
  return (
  <section id="categories" className="py-16 bg-[url('/')] bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-emerald-800">Shop by Category</h2>
          <p className="mt-2 text-emerald-700/80">Explore our wide range of fresh, locally sourced agricultural products</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <article
              key={cat.id}
              className={`bg-white rounded-lg shadow-sm border border-emerald-50 p-6 text-center ${idx >= 3 ? 'hidden sm:block' : ''}`}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4">🥕</div>
              <h3 className="font-semibold text-emerald-700 mb-2">{cat.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{cat.desc}</p>
              <div className="inline-block text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full">{cat.count} products</div>
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
