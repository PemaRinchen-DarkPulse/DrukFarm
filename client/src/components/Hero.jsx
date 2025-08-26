import React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/heroimage.jpg'

export default function Hero() {
  return (
  <section id="home" className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900">

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900 dark:text-white">Connecting Farmers to Markets in Bhutan</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-700 dark:text-slate-300">DruKFarm connects Bhutanese farmers directly with urban consumers, restaurants, and hotels — fair prices, fresh produce, and traceable logistics.</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/products">Shop Now</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/register">Join as Farmer</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="inline-flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 rounded-full px-3 py-2 shadow-sm">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 8 4-16 3 8h4" /></svg>
                <span className="text-sm text-slate-700 dark:text-slate-200">Fresh from the valley — average delivery 24–48 hours</span>
              </div>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <div className="rounded-2xl bg-white shadow-lg overflow-hidden ring-1 ring-slate-100 dark:bg-slate-800">
              <img src={heroImage} alt="Bhutan farm" className="w-full h-80 object-cover sm:h-96" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
