import React from 'react'
import { MapPin, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
  <footer className="relative bg-primary text-primary-foreground">
      {/* Decorative gradient */}
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_30%)] pointer-events-none"
        aria-hidden
      />
      
  <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand / About */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/90 flex items-center justify-center text-primary-foreground font-bold">
                FD
              </div>
              <div className="text-lg font-semibold">DruKFarm</div>
            </div>
            <h4 className="text-base font-semibold">About</h4>
            <p className="text-sm leading-relaxed opacity-90">
              Connecting Bhutanese farmers directly with urban consumers,
              restaurants, and hotels. Fresh, local, sustainable.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="text-base font-semibold">Quick Links</h4>
            <ul className="space-y-3 text-sm opacity-95">
              <li><Link to="/features" className="hover:underline">Browse Products</Link></li>
              <li><Link to="/register" className="hover:underline">Sell Your Crops</Link></li>
              <li><Link to="/about" className="hover:underline">About Us</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-5">
            <h4 className="text-base font-semibold">Support</h4>
            <ul className="space-y-3 text-sm opacity-95">
              <li><Link to="/help" className="hover:underline">Help Center</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link to="/farmers-guide" className="hover:underline">Farmer's Guide</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="space-y-5">
            <h4 className="text-base font-semibold">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 opacity-90">
                <MapPin className="w-4 h-4" /> Thimphu, Bhutan
              </li>
              <li className="flex items-center gap-2 opacity-90">
                <Mail className="w-4 h-4" /> contact@drukfarm.bt
              </li>
              <li className="flex items-center gap-2 opacity-90">
                <Phone className="w-4 h-4" /> +975 1234 5678
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
  <hr className="my-8 border-white/20" />

        {/* Bottom note */}
        <div className="text-center text-sm opacity-90">
          © {new Date().getFullYear()} DruKFarm. All rights reserved. Made with{" "}
          <span aria-hidden>❤</span> in Bhutan.
        </div>
      </div>
    </footer>
  )
}
