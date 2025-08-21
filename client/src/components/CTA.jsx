import React from 'react'
import { Button } from '@/components/ui/button'

export default function CTA() {
  return (
    <section className="pt-16 pb-0 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white">
  <div className="mx-auto w-full max-w-4xl px-6 text-center rounded-t-lg shadow-none py-8 bg-emerald-700 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold">Ready to grow with DruKFarm?</h2>
        <p className="mt-3 text-lg">Sign up as a buyer or farmer and start connecting today.</p>

        <div className="mt-6 flex flex-col sm:flex-row items-center sm:justify-center gap-3">
          <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-white/95" asChild>
            <a href="#signup" className="no-underline">Sign up — it's free</a>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border border-white text-white hover:bg-white/10" asChild>
            <a href="#download" className="no-underline"><span className="text-white">Download App</span></a>
          </Button>
        </div>
      </div>
    </section>
  )
}
