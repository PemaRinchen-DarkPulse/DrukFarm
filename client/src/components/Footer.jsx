import React from 'react'

export default function Footer(){
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">FD</div>
              <div>
                <div className="text-base font-semibold text-slate-900 dark:text-white">Farm2Dzong</div>
                <div className="text-sm text-slate-500">Connecting farms & cities — Bhutan</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <nav className="flex gap-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#about" className="hover:underline">About</a>
              <a href="#terms" className="hover:underline">Terms</a>
              <a href="#privacy" className="hover:underline">Privacy</a>
              <a href="#contact" className="hover:underline">Contact</a>
            </nav>

            <div className="flex items-center gap-3">
              <a href="#" aria-label="Facebook" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 5 3.657 9.128 8.438 9.879v-6.99H7.898v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 17 22 12z"/></svg>
              </a>
              <a href="#" aria-label="WhatsApp" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.928 11.928 0 0012 0C5.373 0 .001 5.373 0 12c0 2.11.55 4.085 1.6 5.84L0 24l6.36-1.64A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12 0-1.94-.42-3.78-1.48-5.4zM12 21.5c-1.9 0-3.73-.5-5.32-1.44l-.38-.22-3.78.98.98-3.68-.24-.39A9.489 9.489 0 012.5 12c0-5.24 4.26-9.5 9.5-9.5s9.5 4.26 9.5 9.5-4.26 9.5-9.5 9.5z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm5 5.5A4.5 4.5 0 1110.5 17 4.5 4.5 0 0112 7.5zm5.2-.7a1.05 1.05 0 11-2.1 0 1.05 1.05 0 012.1 0z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-500">© {new Date().getFullYear()} Farm2Dzong. All rights reserved.</div>
      </div>
    </footer>
  )
}
