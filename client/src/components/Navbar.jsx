import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-md border-b border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">FD</div>
                <div>
                  <Link to="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Farm2Dzong</Link>
                  <p className="text-xs text-slate-500">Farm to Table — Bhutan</p>
                </div>
              </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-slate-700 hover:text-slate-900">Home</Link>
            <Link to="/features" className="text-sm font-medium text-slate-700 hover:text-slate-900">Crop Listings</Link>
            <Link to="/how" className="text-sm font-medium text-slate-700 hover:text-slate-900">How It Works</Link>
            <Link to="/about" className="text-sm font-medium text-slate-700 hover:text-slate-900">About Us</Link>
            <Link to="/contact" className="text-sm font-medium text-slate-700 hover:text-slate-900">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>

            <button
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setOpen(!open)}
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
          <div className={`md:hidden transition-all ${open ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
            <div className="px-4 pb-4 space-y-2">
              <Link to="/" className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Home</Link>
              <Link to="/features" className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Crop Listings</Link>
              <Link to="/how" className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">How It Works</Link>
              <Link to="/about" className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">About Us</Link>
              <Link to="/contact" className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Contact</Link>

              {/* Mobile auth buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild><Link to="/login">Login</Link></Button>
                <Button size="sm" asChild><Link to="/register">Register</Link></Button>
              </div>
            </div>
          </div>
    </header>
  )
}
