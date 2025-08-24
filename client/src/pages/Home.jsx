import React from 'react'
// Navbar and Footer are provided by the top-level App layout
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import FeaturedProducts from '@/components/FeaturedProducts'
import ShopByCategory from '@/components/ShopByCategory'
import CTA from '@/components/CTA'

export default function Home(){
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <main>
  <Hero />
  <Features />
  <ShopByCategory />
  <FeaturedProducts />
  <Testimonials />
  <CTA />
      </main>
    </div>
  )
}