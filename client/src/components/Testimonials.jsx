import React from 'react'

const reviews = [
  { name: 'Tashi (Farmer)', quote: 'DruKFarm doubled my orders last season. Fair prices and fast payments.' },
  { name: 'Sonam (Restaurant)', quote: 'I get fresher produce and I can order exactly what I need — no middleman.' },
  { name: 'Pema (Consumer)', quote: 'The app is easy to use and the delivery is surprisingly fast.' },
]

export default function Testimonials() {
  return (
    <section className="py-16 bg-background">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Success stories</h2>
  <p className="mt-2 text-muted-foreground">Hear from farmers and buyers who use DruKFarm.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {reviews.map((r, i) => (
            <blockquote key={i} className="rounded-xl bg-card p-6 shadow-sm">
              <p className="text-foreground/90">“{r.quote}”</p>
              <footer className="mt-4 text-sm text-muted-foreground">— {r.name}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
