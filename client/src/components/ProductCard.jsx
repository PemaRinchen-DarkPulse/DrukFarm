import React from 'react'
import { MapPin } from 'lucide-react'

export default function ProductCard({ product, children }){
  const locationLabel = product.locationLabel || product.location || ''
  return (
    <article className="product-card h-full rounded-lg bg-white shadow-sm border border-emerald-100 overflow-hidden">
      <div className="product-image relative bg-emerald-50/60">
        {/* tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          {(product.tags || []).map((t, idx) => (
            <span key={idx} className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">{t}</span>
          ))}
        </div>
        {/* favorite/status */}
        <div className="absolute top-3 right-3 rounded-full border p-2 text-emerald-600 bg-white/60">♡</div>
        {product.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      <div className="p-4 bg-white product-body">
        <div className="product-top">
          <h3 className="text-lg font-semibold text-emerald-900 product-title">{product.title}</h3>
          <p className="mt-2 text-sm text-slate-600 product-desc">{product.desc}</p>
          <div className="mt-3 text-sm text-slate-500 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{locationLabel || 'Your farm'}</span>
          </div>
        </div>

        <div className="product-bottom mt-3 flex flex-col">
          <div className="text-yellow-500 font-medium">★ {product.rating || '4.8'} <span className="text-slate-400 text-sm">({product.reviews || '0'} reviews)</span></div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold text-emerald-800">
              Nu. {product.price} <span className="text-lg font-medium text-slate-500">/{product.unit}</span>
            </div>
            <div className="text-sm font-medium text-slate-600">
              Stock: {product?.stock ?? 0} {product?.unit || ''}
            </div>
          </div>

          <div className="mt-3 card-actions">
            {children}
          </div>
        </div>
      </div>
    </article>
  )
}
