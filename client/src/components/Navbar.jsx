import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, LogOut, Scan, Package } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'

export default function Navbar() {
  function handleSignOut() {
    logout();
    navigate('/login');
  }
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef(null)
  // derive role once user is loaded for conditional menu items
  const role = (() => {
    try {
      if (!user) return null
      return user.role || null
    } catch { return null }
  })()
  const isFarmer = role === 'farmer'
  const isTransporter = role === 'transporter'

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      if (raw) setUser(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  refreshCart()
  }, [])

  useEffect(() => {
    function onAuth() {
      try {
        const raw = localStorage.getItem('currentUser')
        setUser(raw ? JSON.parse(raw) : null)
      } catch (e) { setUser(null) }
      refreshCart()
    }
    window.addEventListener('authChanged', onAuth)
    const onCart = () => refreshCart()
    window.addEventListener('cartChanged', onCart)
    return () => window.removeEventListener('authChanged', onAuth)
  }, [])

  useEffect(() => {
    function onDoc(e) {
  if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  // Auto-close mobile menu and mgmt submenu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  function logout() {
    localStorage.removeItem('currentUser')
  try { window.dispatchEvent(new Event('authChanged')) } catch(e) {}
    setUser(null)
    navigate('/')
  }

  async function refreshCart(){
    try {
      const cid = getCurrentCid()
      if (!cid) { setCartCount(0); return }
      const resp = await api.getCart({ cid })
      const count = Array.isArray(resp?.cart?.items) ? resp.cart.items.reduce((s,i)=>s + Number(i.quantity||0), 0) : 0
      setCartCount(count)
    } catch (e) {
      setCartCount(0)
    }
  }

  return (
    <>
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-md border-b border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-4 ml-2 sm:ml-0">
              <div className="flex items-center space-x-2">
                <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">FD</div>
                <div>
                  <Link to="/" className="text-xl font-semibold text-slate-900 dark:text-slate-100">DruKFarm</Link>
                  <p className="text-xs text-slate-500">Farm to Table — Bhutan</p>
                </div>
              </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">Home</Link>
            <Link to="/products" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">Products</Link>
            {user && (
              <Link to="/orders" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">My Orders</Link>
            )}
            <Link to="/how" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">How It Works</Link>
            <Link to="/about" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">About Us</Link>
            <Link to="/contact" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">Contact</Link>
          </nav>

          <div className="flex items-center gap-3 mr-2 sm:mr-0">
            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative inline-flex">
                <Button variant="ghost" size="lg" className="mt-1" onClick={()=>navigate('/cart')}><ShoppingCart className="size-7" /></Button>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-600 text-white text-[11px] leading-[20px] text-center">{cartCount}</span>
                )}
              </div>
              {!user ? (
                <Button variant="ghost" size="lg" className="mt-1" onClick={() => navigate('/login')}>
                  <User className="size-7" />
                </Button>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-base">{user.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : <User className="w-5 h-5" />}</div>
                  </button>
          {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border rounded shadow-lg py-1 z-50">
                      <Link to="/profile" className="block px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">My profile</Link>
                      {/* Role-based management shortcuts moved under profile */}
                      {(isFarmer || isTransporter) && (<div className="my-1 border-t" />)}
                      {isFarmer || isTransporter ? (
                        <button onClick={() => { setMenuOpen(false); navigate('/management?tab=overview') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Overview</button>
                      ) : null}
                      {isFarmer && (
                        <>
                          <button onClick={() => { setMenuOpen(false); navigate('/management?tab=products') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Products</button>
                          <button onClick={() => { setMenuOpen(false); navigate('/management?tab=orders') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Orders</button>
                        </>
                      )}
                      {isTransporter && (
                        <>
                          <button onClick={() => { setMenuOpen(false); navigate('/management?tab=pickup') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Pick Up</button>
                          <button onClick={() => { setMenuOpen(false); navigate('/management?tab=delivery') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">My Delivery</button>
                        </>
                      )}
                      <div className="my-1 border-t" />
                      <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100 flex items-center gap-2"><LogOut className="w-5 h-5" /> Sign out</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setOpen(!open)}
            >
              <svg className="w-7 h-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <Link to="/" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Home</Link>
                <Link to="/products" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Products</Link>
                {user && (
                  <Link to="/orders" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">My Orders</Link>
                )}
              <Link to="/how" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">How It Works</Link>
              <Link to="/about" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">About Us</Link>
              <Link to="/contact" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Contact</Link>

              {/* Mobile auth buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {/* Cart moved to bottom dock on mobile; hide profile/name, sign out, and login/register here */}
                {!user ? (
                  <></>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="bg-white rounded-md border">
                      {isFarmer || isTransporter ? (
                        <button onClick={() => { setOpen(false); navigate('/management?tab=overview') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Overview</button>
                      ) : null}
                      {isFarmer && (
                        <>
                          <button onClick={() => { setOpen(false); navigate('/management?tab=products') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Products</button>
                          <button onClick={() => { setOpen(false); navigate('/management?tab=orders') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Orders</button>
                        </>
                      )}
                      {isTransporter && (
                        <>
                          <button onClick={() => { setOpen(false); navigate('/management?tab=pickup') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">Pick Up</button>
                          <button onClick={() => { setOpen(false); navigate('/management?tab=delivery') }} className="w-full text-left px-3 py-2 text-lg text-slate-700 hover:bg-slate-100">My Delivery</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
    </header>

    {/* Mobile bottom dock */}
  <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 backdrop-blur dark:bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`h-16 grid items-center ${user ? 'grid-cols-5' : 'grid-cols-3'}`}>
          {/* Col 1: Cart */}
          <div className="flex justify-center">
            <button aria-label="Open cart" onClick={()=>navigate('/cart')} className="relative inline-flex flex-col items-center justify-center text-slate-700 hover:text-slate-900">
              <ShoppingCart className="w-7 h-7" />
              <span className="text-[11px] leading-none mt-1">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-3 min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-600 text-white text-[11px] leading-[20px] text-center">{cartCount}</span>
              )}
            </button>
          </div>

          {/* Col 2 (logged in) or skipped (logged out) */}
          {user ? (
            <div className="flex justify-center">
              <button aria-label="My orders" onClick={()=>navigate('/orders')} className="inline-flex flex-col items-center justify-center text-slate-700 hover:text-slate-900">
                <Package className="w-7 h-7" />
                <span className="text-[11px] leading-none mt-1">Orders</span>
              </button>
            </div>
          ) : null}

          {/* Center column: Scan (always centered) */}
          <div className="flex justify-center">
            <button aria-label="Open scanner" onClick={()=>navigate('/scan')} className="inline-flex flex-col items-center justify-center text-slate-700 hover:text-slate-900">
              <Scan className="w-7 h-7" />
              <span className="text-[11px] leading-none mt-1">Scan</span>
            </button>
          </div>

          {/* Col 4 (logged in) or Col 2 (logged out): Auth */}
          {user ? (
            <div className="flex justify-center">
              <button aria-label="Open profile" onClick={()=>navigate('/profile')} className="inline-flex flex-col items-center justify-center text-slate-700 hover:text-slate-900">
                <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                  {user.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : <User className="w-4 h-4" />}
                </div>
                <span className="text-[11px] leading-none mt-1">Profile</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button aria-label="Login" onClick={()=>navigate('/login')} className="inline-flex flex-col items-center justify-center text-slate-700 hover:text-slate-900">
                <User className="w-7 h-7" />
                <span className="text-[11px] leading-none mt-1">Login</span>
              </button>
            </div>
          )}

          {/* Col 5 (logged in only): Sign out */}
          {user ? (
            <div className="flex justify-center">
              <button aria-label="Sign out" onClick={handleSignOut} className="inline-flex flex-col items-center justify-center text-slate-700 hover:text-slate-900">
                <LogOut className="w-7 h-7" />
                <span className="text-[11px] leading-none mt-1">Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {/* Optional spacer for iOS safe-area could be added here if needed */}
    </nav>
    </>
  )
}
