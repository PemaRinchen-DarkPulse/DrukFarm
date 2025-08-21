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

export default function Category(){
  return (
    <section className="py-16 bg-emerald-50/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800">Categories</h1>
          <p className="mt-2 text-emerald-700/80">Browse products by category</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link key={cat.id} to={`/categories/${cat.id}`} className="group block bg-white rounded-lg shadow-sm border border-emerald-50 p-6 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 text-2xl">🥬</div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800">{cat.title}</h3>
                  <p className="text-sm text-slate-500">{cat.desc}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full">{cat.count} products</div>
                <div className="text-emerald-600 font-medium group-hover:underline">View products →</div>
              </div>
            </Link>
          ))}

          {/* add category card */}
          <div className="flex items-center justify-center">
            <Link to="/categories/add" className="block w-full max-w-sm text-center bg-white border-dashed border-2 border-emerald-100 rounded-lg p-6 hover:bg-emerald-50 transition">
              <div className="text-3xl text-emerald-700 mb-2">＋</div>
              <div className="font-semibold text-emerald-800">Add More Category</div>
              <div className="text-sm text-slate-500 mt-1">Create a new product category</div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
