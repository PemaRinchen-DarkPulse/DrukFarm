import React, { useState } from 'react'
import './Management.css'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

const sampleProducts = [
  {
    id: 1,
    title: 'Organic Red Rice',
    desc: 'Premium red rice from Thimphu hills',
    price: 120,
    unit: 'kg',
    stock: 25,
    image: null
  },
  {
    id: 2,
    title: 'Fresh Chili Peppers',
    desc: 'Spicy chili peppers, handpicked',
    price: 80,
    unit: 'kg',
    stock: 0,
    image: null
  },
  {
    id: 3,
    title: 'Mountain Potatoes',
    desc: 'Crisp mountain potatoes',
    price: 45,
    unit: 'kg',
    stock: 5,
    image: null
  }
]

export default function MyProducts({ onAdd }){
  const [products, setProducts] = useState(sampleProducts)

  const onDelete = (id) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const onEdit = (id) => {
    // placeholder - in real app open modal or navigate to edit form
    alert('Edit product ' + id)
  }

  return (
    <section className="my-products">
      <div className="products-header">
        <h2 className="products-title">My Products</h2>
  <Button className="add-product-btn btn-primary" onClick={() => onAdd ? onAdd() : alert('Add product') }>
          <span className="btn-icon">+</span>
          <span>Add Product</span>
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p, i) => (
          <article key={p.id} className="rounded-lg bg-white shadow-sm border border-emerald-100 overflow-hidden">
            <div className="relative h-64 bg-emerald-50/60">
              {/* tags placeholder - reuse if present */}
              <div className="absolute top-3 left-3 flex gap-2">
                {/* example tag - none in sample */}
              </div>
              {/* stock status in top-right */}
              <div className={`absolute top-3 right-3 rounded-full border px-3 py-1 text-sm ${p.stock > 1 ? 'text-emerald-700 bg-white/70' : p.stock === 0 ? 'text-red-600 bg-white/70' : 'text-amber-700 bg-white/70'}`}>
                {p.stock > 1 ? 'Active' : p.stock === 0 ? 'Out of Stock' : 'Low'}
              </div>
            </div>

            <div className="p-4 bg-white">
              <h3 className="text-lg font-semibold text-emerald-900">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.desc}</p>
              <div className="mt-3 text-sm text-slate-500 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{p.location || 'Your farm'}</span>
              </div>

              <div className="mt-3">
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-2xl font-bold text-emerald-800">Nu. {p.price} <span className="text-lg font-medium text-slate-500">/{p.unit}</span></div>
                  <div className="text-sm font-semibold text-slate-600">Stock: <span className={`stock-inline ${p.stock > 1 ? 'active' : p.stock === 0 ? 'out' : 'low'}`}>{p.stock} {p.unit}</span></div>
                </div>

                <div className="mt-3 product-actions">
                  <div className="actions-left">
                    <Button variant="outline" size="sm" className="inline-flex items-center justify-center gap-2" onClick={() => onEdit(p.id)}>Edit</Button>
                  </div>
                  <div className="actions-right">
                    <Button size="sm" className="inline-flex items-center justify-center gap-2" onClick={() => onDelete(p.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
