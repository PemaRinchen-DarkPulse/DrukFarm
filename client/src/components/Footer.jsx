import React from 'react'
import { MapPin, Mail, Phone } from 'lucide-react'

export default function Footer(){
  return (
    <footer className="bg-emerald-700 text-emerald-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: brand + contact */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold">FD</div>
              <div>
                <div className="text-lg font-semibold">DruKFarm</div>
              </div>
            </div>
            <p className="text-sm text-emerald-100/90 mb-4">Connecting Bhutanese farmers directly with urban consumers, restaurants, and hotels. Fresh, local, sustainable.</p>

            <ul className="text-sm space-y-3">
              <li className="flex items-center gap-2 opacity-90"><MapPin className="w-4 h-4" /> Thimphu, Bhutan</li>
              <li className="flex items-center gap-2 opacity-90"><Mail className="w-4 h-4" /> contact@drukfarm.bt</li>
              <li className="flex items-center gap-2 opacity-90"><Phone className="w-4 h-4" /> +975 1234 5678</li>
            </ul>
          </div>

          {/* Middle: quick links */}
          <div>
            <h4 className="text-base font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm opacity-95">
              <li><a href="/features" className="hover:underline">Browse Products</a></li>
              <li><a href="/register" className="hover:underline">Sell Your Crops</a></li>
              <li><a href="/about" className="hover:underline">About Us</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>

          {/* Right: support */}
          <div>
            <h4 className="text-base font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm opacity-95">
              <li><a href="/help" className="hover:underline">Help Center</a></li>
              <li><a href="/terms" className="hover:underline">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/farmers-guide" className="hover:underline">Farmer's Guide</a></li>
            </ul>
          </div>
        </div>

    <hr className="my-6 border-emerald-600/40" />

  <div className="text-center text-sm opacity-90">© {new Date().getFullYear()} DruKFarm. All rights reserved. Made with <span aria-hidden>❤</span> in Bhutan.</div>
      </div>
    </footer>
  )
}
