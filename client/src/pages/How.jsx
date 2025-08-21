import React from 'react'
import { Truck, ShoppingCart, UserCheck, Box } from 'lucide-react'

const steps = [
  { icon: UserCheck, title: 'Sign up & create profile', desc: 'Farmers, restaurants and consumers create accounts and set preferences.' },
  { icon: Box, title: 'Create listings', desc: 'Farmers list produce with photos, availability, and prices.' },
  { icon: ShoppingCart, title: 'Browse & order', desc: 'Buyers browse listings, place orders and communicate with sellers.' },
  { icon: Truck, title: 'Delivery & pickup', desc: 'Arrange pickup or local delivery using our logistics partners.' },
]

export default function How(){
  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">How DruKFarm Works</h1>
        <p className="text-slate-600 mt-2">A simple, transparent way to connect local farmers with buyers — efficient, fair, and sustainable.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((s, idx) => {
          const Icon = s.icon
          return (
            <div key={idx} className="bg-white rounded-lg p-6 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          )
        })}
      </div>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-3">For Farmers</h3>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li>List your harvest with clear photos and quantities.</li>
            <li>Set prices and available pickup/delivery times.</li>
            <li>Accept orders, communicate with buyers, and manage inventory.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-3">For Buyers (Consumers, Restaurants, Hotels)</h3>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li>Discover fresh, local produce from nearby farms.</li>
            <li>Order in small or bulk quantities with simple payment options.</li>
            <li>Rate sellers and track order history for better sourcing.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
