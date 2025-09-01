import React from 'react'

const features = [
  { title: 'Direct Crop Listings', desc: 'Farmers can list produce directly with photos, harvest date, and price.', icon: '🌾' },
  { title: 'Online Ordering', desc: 'Restaurants and consumers place orders online with delivery options.', icon: '🛒' },
  { title: 'Logistics Tracking', desc: 'Realtime tracking of shipments from farm to doorstep.', icon: '📦' },
  { title: 'Secure Payments', desc: 'Integrated secure payments with receipts and refunds.', icon: '🔒' },
  { title: 'SMS Order Support', desc: 'Orders and confirmations via SMS for low-connectivity areas.', icon: '📩' },
]

export default function Features() {
  return (
    <section id="features" className="py-16 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Platform features</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">All tools farmers and buyers need to transact directly and efficiently.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl p-6 bg-emerald-50 dark:bg-slate-800/60 hover:shadow-lg transition">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-100 text-emerald-700 text-xl mx-auto">{f.icon}</div>
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white text-center">{f.title}</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-center">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
