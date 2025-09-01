import React from 'react'
import { Link } from 'react-router-dom'

function Stat({label, children}){
  return (
    <div className="flex-1 text-center">
  <div className="text-2xl font-bold text-primary">{children}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export default function About(){
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <section className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-semibold mb-2">About DrukFarm</h1>
        <p className="text-foreground/80 mb-4">DrukFarm connects Bhutanese farmers directly to local buyers and marketplaces. We make it easier to sell fresh produce, get fair prices, and build sustainable farm businesses through simple digital tools and community support.</p>
  <div className="flex gap-4 mt-4 p-4 rounded bg-accent/30">
          <Stat label="Farmers supported">1,200+</Stat>
          <Stat label="Produce categories">24</Stat>
          <Stat label="Local partners">35</Stat>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
          <p className="text-foreground/80">To empower smallholder farmers in Bhutan with simple, reliable digital tools and market access so they can increase incomes, reduce waste, and strengthen local food systems.</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2">Our Vision</h2>
          <p className="text-foreground/80">A thriving, resilient Bhutanese agricultural sector where farmers receive fair prices and communities have access to fresh, locally-grown food year-round.</p>
        </div>
      </section>

      <section className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-3">Our Values</h2>
        <ul className="grid sm:grid-cols-2 gap-4 text-foreground/80">
          <li className="p-3 border border-border rounded">Community-first: we prioritize farmer and consumer needs.</li>
          <li className="p-3 border border-border rounded">Transparency: fair pricing and clear processes.</li>
          <li className="p-3 border border-border rounded">Sustainability: supporting practices that protect land and water.</li>
          <li className="p-3 border border-border rounded">Simplicity: tools that are easy to use and maintain.</li>
        </ul>
      </section>

      <section className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Meet the Team</h2>
        <div className="max-w-md">
          <article className="flex items-center gap-3 p-3">
            <a href="https://pemarinchen.vercel.app" target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 inline-block">
              <div className="w-full h-full text-primary-foreground flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: 'var(--primary)' }}>PR</div>
            </a>
            <div>
              <div className="font-semibold">Pema Rinchen <a href="https://pemarinchen.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm ml-2 text-primary">Portfolio</a></div>
              <div className="text-sm text-muted-foreground">Founder · Developer · Operator</div>
              <div className="text-sm text-muted-foreground mt-1">I build and run DrukFarm — from the product to partnerships — to help Bhutanese farmers reach local markets.</div>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-3">Get Involved / Contact</h2>
        <p className="text-foreground/80 mb-4">Want to partner, buy produce, or learn how to list your farm? Reach out — we’re happy to help.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/contact" className="inline-block text-primary-foreground px-4 py-2 rounded bg-primary">Contact Us</Link>
          <Link to="/register" className="inline-block px-4 py-2 rounded border border-primary text-primary bg-transparent">Register Your Farm</Link>
        </div>
      </section>

      <section className="text-sm text-muted-foreground">
        <p>Last updated: August 2025</p>
      </section>
    </main>
  )
}
