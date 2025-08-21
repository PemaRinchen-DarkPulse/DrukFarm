import React from 'react'
import { Button } from '@/components/ui/button'

export default function CTA() {
  return (
    <section className="py-16 bg-emerald-600 text-white">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold">Ready to grow with Farm2Dzong?</h2>
        <p className="mt-3 text-lg">Sign up as a buyer or farmer and start connecting today.</p>

        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" asChild><a href="#signup">Sign up — it's free</a></Button>
          <Button variant="outline" size="lg" asChild><a href="#download">Download App</a></Button>
        </div>
      </div>
    </section>
  )
}
