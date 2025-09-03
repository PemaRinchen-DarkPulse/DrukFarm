import React from 'react'
import { Button } from '@/components/ui/button'

export default function CTA() {
  return (
  <section className="relative overflow-hidden py-16 text-white" style={{ background: 'linear-gradient(90deg, #66BB6A, #4CAF50, #43A047)' }}>
      <div className="mx-auto w-full max-w-4xl px-6 text-center">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-sm">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to grow with DruKFarm?</h2>
          <p className="mt-3 text-base md:text-lg text-white/90">Sign up as a buyer or farmer and start connecting today.</p>

          <div className="mt-6 flex flex-col sm:flex-row items-center sm:justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-white/95 text-green-600 font-semibold" asChild>
  <a href="#signup" className="no-underline">Sign up — it's free</a>
</Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white/10" asChild>
              <a href="#download" className="no-underline"><span className="text-white">Download App</span></a>
            </Button>
          </div>
        </div>
      </div>

      {/* Seamless wave divider into footer */}
  <div aria-hidden className="pointer-events-none select-none absolute inset-x-0 bottom-0">
  <svg className="block w-full h-16 md:h-20" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#4CAF50' }}>
          <path d="M0,0V46.29c47.79,22,98.81,29,148.5,17.39C230,50.33,284,16.66,339.28,3.69c56.79-13.43,117.63,1.17,172.57,17.39C598.66,43.79,652,74,708.07,85.27c60.66,12.61,117.12-3.39,172.57-22.17C948.32,42.62,1004.69,21.18,1065.23,9.21,1122.92-2.08,1182.4-1.71,1200,0V120H0Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
