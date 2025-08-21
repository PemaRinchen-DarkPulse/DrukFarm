import React from 'react'

const reviews = [
  { name: 'Tashi (Farmer)', quote: 'Farm2Dzong doubled my orders last season. Fair prices and fast payments.' },
  { name: 'Sonam (Restaurant)', quote: 'I get fresher produce and I can order exactly what I need — no middleman.' },
  { name: 'Pema (Consumer)', quote: 'The app is easy to use and the delivery is surprisingly fast.' },
]

export default function Testimonials() {
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Success stories</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Hear from farmers and buyers who use Farm2Dzong.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {reviews.map((r, i) => (
            <blockquote key={i} className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
              <p className="text-slate-700 dark:text-slate-200">“{r.quote}”</p>
              <footer className="mt-4 text-sm text-slate-500 dark:text-slate-400">— {r.name}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
