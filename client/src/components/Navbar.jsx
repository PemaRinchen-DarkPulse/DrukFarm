import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mgmtOpen, setMgmtOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef(null)
  const mgmtRef = useRef(null)

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
  if (mgmtRef.current && !mgmtRef.current.contains(e.target)) setMgmtOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  // Auto-close mobile menu and mgmt submenu on route change
  useEffect(() => {
    setOpen(false)
    setMgmtOpen(false)
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
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-md border-b border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-4 -ml-4 sm:-ml-6 lg:-ml-15">
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
              <div className="relative" ref={mgmtRef}>
                <button
                  type="button"
                  className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                  onClick={() => setMgmtOpen(o => !o)}
                >
                  Management
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {mgmtOpen && (
                  <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-slate-900 border rounded shadow-lg py-1 z-50">
                    <button onClick={() => { setMgmtOpen(false); navigate('/management?tab=overview') }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Overview</button>
                    {user?.role === 'farmer' && (
                      <>
                        <button onClick={() => { setMgmtOpen(false); navigate('/management?tab=products') }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Products</button>
                        <button onClick={() => { setMgmtOpen(false); navigate('/management?tab=orders') }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Orders</button>
                      </>
                    )}
                    {user?.role === 'transporter' && (
                      <>
                        <button onClick={() => { setMgmtOpen(false); navigate('/management?tab=pickup') }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Pick Up</button>
                        <button onClick={() => { setMgmtOpen(false); navigate('/management?tab=delivery') }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">My Delivery</button>
                      </>
                    )}
                    {(!user?.role || (user?.role !== 'farmer' && user?.role !== 'transporter')) && (
                      <button onClick={() => { setMgmtOpen(false); navigate('/management?tab=orders') }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">My Orders</button>
                    )}
                  </div>
                )}
              </div>
            )}
            <Link to="/how" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">How It Works</Link>
            <Link to="/about" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">About Us</Link>
            <Link to="/contact" className="text-base lg:text-lg font-medium text-slate-700 hover:text-slate-900">Contact</Link>
          </nav>

          <div className="flex items-center gap-3 -mr-4 sm:-mr-6 lg:-mr-15">
            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative inline-flex">
                <Button variant="ghost" size="lg" className="mt-1" onClick={()=>navigate('/cart')}><ShoppingCart className="size-7" /></Button>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-600 text-white text-[11px] leading-[20px] text-center">{cartCount}</span>
                )}
              </div>
              {!user ? (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">Register</Link>
                  </Button>
                </>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-base">{user.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : <User className="w-5 h-5" />}</div>
                  </button>
          {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border rounded shadow-lg py-1 z-50">
                      <Link to="/profile" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">My profile</Link>
                      <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><LogOut className="w-5 h-5" /> Sign out</button>
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
                  <div className="bg-white rounded-md border">
                    <button onClick={() => setMgmtOpen(o=>!o)} className="w-full text-left px-3 py-2 text-slate-700 flex items-center justify-between">
                      <span>Management</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {mgmtOpen && (
                      <div className="px-1 pb-2">
                        <button onClick={() => { setMgmtOpen(false); setOpen(false); navigate('/management?tab=overview') }} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">Overview</button>
                        {user?.role === 'farmer' && (
                          <>
                            <button onClick={() => { setMgmtOpen(false); setOpen(false); navigate('/management?tab=products') }} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">Products</button>
                            <button onClick={() => { setMgmtOpen(false); setOpen(false); navigate('/management?tab=orders') }} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">Orders</button>
                          </>
                        )}
                        {user?.role === 'transporter' && (
                          <>
                            <button onClick={() => { setMgmtOpen(false); setOpen(false); navigate('/management?tab=pickup') }} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">Pick Up</button>
                            <button onClick={() => { setMgmtOpen(false); setOpen(false); navigate('/management?tab=delivery') }} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">My Delivery</button>
                          </>
                        )}
                        {(!user?.role || (user?.role !== 'farmer' && user?.role !== 'transporter')) && (
                          <button onClick={() => { setMgmtOpen(false); setOpen(false); navigate('/management?tab=orders') }} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">My Orders</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              <Link to="/how" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">How It Works</Link>
              <Link to="/about" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">About Us</Link>
              <Link to="/contact" onClick={()=>setOpen(false)} className="block py-2 rounded-md text-slate-700 hover:bg-slate-100">Contact</Link>

              {/* Mobile auth buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative inline-flex">
                    <Button variant="ghost" size="lg" className="px-3 py-2" onClick={()=>{ setOpen(false); navigate('/cart') }}><ShoppingCart className="size-9" /></Button>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-600 text-white text-[11px] leading-[20px] text-center">{cartCount}</span>
                    )}
                  </div>
                </div>
        {!user ? (
                  <>
          <Button variant="outline" size="sm" asChild><Link to="/login" onClick={()=>setOpen(false)}>Login</Link></Button>
          <Button size="sm" asChild><Link to="/register" onClick={()=>setOpen(false)}>Register</Link></Button>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
          <Link to="/profile" onClick={()=>setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100"><div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-base">{user.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : <User className="w-5 h-5" />}</div> <span className="text-sm">{user.name}</span></Link>
                    <button onClick={logout} className="px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-2"><LogOut className="w-5 h-5" /> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
    </header>
  )
}
