import React from 'react'
import { Button } from '@/components/ui/button'

const sample = [
  { id: 1, name: 'Organic Red Rice', price: 'Nu 120/kg', seller: 'Tashi Farms' },
  { id: 2, name: 'Local Carrots', price: 'Nu 45/kg', seller: 'Pem Organic' },
  { id: 3, name: 'Fresh Chillies', price: 'Nu 60/kg', seller: 'Thimphu Market' },
]

export default function Features(){
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Crop Listings</h1>
      <p className="text-slate-600 mb-6">Browse produce listed by local Bhutanese farmers.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sample.map(item=> (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="h-36 bg-emerald-50 rounded-md mb-3 flex items-center justify-center text-emerald-700 font-medium">Image</div>
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-slate-500">{item.seller}</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-medium">{item.price}</div>
              <Button size="sm">View</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
