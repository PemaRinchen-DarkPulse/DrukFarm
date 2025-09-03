import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, LogOut, Scan, Package } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '@/lib/api'
import { getCurrentCid } from '@/lib/auth'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef(null)

  const role = user?.role || null
  const isFarmer = role === 'farmer'
  const isTransporter = role === 'transporter'

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      if (raw) setUser(JSON.parse(raw))
    } catch {}
    refreshCart()
  }, [])

  useEffect(() => {
    function onAuth() {
      try {
        const raw = localStorage.getItem('currentUser')
        setUser(raw ? JSON.parse(raw) : null)
      } catch {
        setUser(null)
      }
      refreshCart()
    }
    window.addEventListener('authChanged', onAuth)
    const onCart = () => refreshCart()
    window.addEventListener('cartChanged', onCart)
    return () => {
      window.removeEventListener('authChanged', onAuth)
      window.removeEventListener('cartChanged', onCart)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  function logout() {
    try {
      localStorage.removeItem('currentUser')
      window.dispatchEvent(new Event('authChanged'))
    } catch {}
    setUser(null)
    navigate('/')
  }

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  async function refreshCart() {
    try {
      const cid = getCurrentCid()
      if (!cid) {
        setCartCount(0)
        return
      }
      const resp = await api.getCart({ cid })
      const count = Array.isArray(resp?.cart?.items)
        ? resp.cart.items.reduce((s, i) => s + Number(i.quantity || 0), 0)
        : 0
      setCartCount(count)
    } catch {
      setCartCount(0)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* LOGO section */}
            <div className="flex items-center gap-4 ml-2 sm:ml-0 lg:ml-[-40px]">
              <div className="flex items-center space-x-2">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-primary-foreground font-bold"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  FD
                </div>
                <div>
                  <Link to="/" className="text-xl font-semibold text-foreground">
                    DruKFarm
                  </Link>
                  <p className="text-xs text-muted-foreground">Farm to Table — Bhutan</p>
                </div>
              </div>
            </div>

            {/* NAV links (desktop only) */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="text-base lg:text-lg font-medium text-foreground/80 hover:text-foreground"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-base lg:text-lg font-medium text-foreground/80 hover:text-foreground"
              >
                Products
              </Link>
              {user && (
                <Link
                  to="/orders"
                  className="text-base lg:text-lg font-medium text-foreground/80 hover:text-foreground"
                >
                  My Orders
                </Link>
              )}
              <Link
                to="/how"
                className="text-base lg:text-lg font-medium text-foreground/80 hover:text-foreground"
              >
                How It Works
              </Link>
              <Link
                to="/about"
                className="text-base lg:text-lg font-medium text-foreground/80 hover:text-foreground"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-base lg:text-lg font-medium text-foreground/80 hover:text-foreground"
              >
                Contact
              </Link>
            </nav>

            {/* USER / CART section */}
            <div className="flex items-center gap-3 mr-2 sm:mr-0 lg:mr-[-40px]">
              <div className="hidden md:flex items-center gap-2">
                <div className="relative inline-flex">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="mt-1"
                    onClick={() => navigate('/cart')}
                  >
                    <ShoppingCart className="size-7" />
                  </Button>
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full text-primary-foreground text-[11px] leading-[20px] text-center"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {cartCount}
                    </span>
                  )}
                </div>
                {!user ? (
                  <Button
                    variant="ghost"
                    size="lg"
                    className="mt-1"
                    onClick={() => navigate('/login')}
                  >
                    <User className="size-7" />
                  </Button>
                ) : (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex items-center gap-2 rounded-full p-1 hover:bg-muted"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-base"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        {user.name
                          ? user.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                          : <User className="w-5 h-5" />}
                      </div>
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded shadow-lg py-1 z-50">
                        <Link
                          to="/profile"
                          className="block px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                        >
                          My profile
                        </Link>
                        {(isFarmer || isTransporter) && <div className="my-1 border-t border-border" />}
                        {isFarmer || isTransporter ? (
                          <button
                            onClick={() => {
                              setMenuOpen(false)
                              navigate('/management?tab=overview')
                            }}
                            className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                          >
                            Overview
                          </button>
                        ) : null}
                        {isFarmer && (
                          <>
                            <button
                              onClick={() => {
                                setMenuOpen(false)
                                navigate('/management?tab=products')
                              }}
                              className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                            >
                              Products
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpen(false)
                                navigate('/management?tab=orders')
                              }}
                              className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                            >
                              Orders
                            </button>
                          </>
                        )}
                        {isTransporter && (
                          <>
                            <button
                              onClick={() => {
                                setMenuOpen(false)
                                navigate('/management?tab=pickup')
                              }}
                              className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                            >
                              Pick Up
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpen(false)
                                navigate('/management?tab=delivery')
                              }}
                              className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                            >
                              My Delivery
                            </button>
                          </>
                        )}
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted flex items-center gap-2"
                        >
                          <LogOut className="w-5 h-5" /> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                aria-label="Toggle menu"
                className="md:hidden p-2 rounded-md hover:bg-muted transition"
                onClick={() => setOpen(!open)}
              >
                <svg
                  className="w-7 h-7 text-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {open ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all ${open ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
          <div className="px-4 pb-4 space-y-2">
            <Link to="/" onClick={() => setOpen(false)} className="block py-2 rounded-md text-foreground/80 hover:bg-muted">
              Home
            </Link>
            <Link to="/products" onClick={() => setOpen(false)} className="block py-2 rounded-md text-foreground/80 hover:bg-muted">
              Products
            </Link>
            {user && (
              <Link to="/orders" onClick={() => setOpen(false)} className="block py-2 rounded-md text-foreground/80 hover:bg-muted">
                My Orders
              </Link>
            )}
            <Link to="/how" onClick={() => setOpen(false)} className="block py-2 rounded-md text-foreground/80 hover:bg-muted">
              How It Works
            </Link>
            <Link to="/about" onClick={() => setOpen(false)} className="block py-2 rounded-md text-foreground/80 hover:bg-muted">
              About Us
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="block py-2 rounded-md text-foreground/80 hover:bg-muted">
              Contact
            </Link>

            <div className="pt-2 flex flex-col gap-2">
              {!user ? null : (
                <div className="flex flex-col gap-2">
                  <div className="bg-card rounded-md border border-border">
                    {isFarmer || isTransporter ? (
                      <button
                        onClick={() => {
                          setOpen(false)
                          navigate('/management?tab=overview')
                        }}
                        className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                      >
                        Overview
                      </button>
                    ) : null}
                    {isFarmer && (
                      <>
                        <button
                          onClick={() => {
                            setOpen(false)
                            navigate('/management?tab=products')
                          }}
                          className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                        >
                          Products
                        </button>
                        <button
                          onClick={() => {
                            setOpen(false)
                            navigate('/management?tab=orders')
                          }}
                          className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                        >
                          Orders
                        </button>
                      </>
                    )}
                    {isTransporter && (
                      <>
                        <button
                          onClick={() => {
                            setOpen(false)
                            navigate('/management?tab=pickup')
                          }}
                          className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                        >
                          Pick Up
                        </button>
                        <button
                          onClick={() => {
                            setOpen(false)
                            navigate('/management?tab=delivery')
                          }}
                          className="w-full text-left px-3 py-2 text-lg text-foreground/80 hover:bg-muted"
                        >
                          My Delivery
                        </button>
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
  {!(location.pathname === '/login' || location.pathname === '/register') && (
  <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`h-16 grid items-center ${user ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <div className="flex justify-center">
              <button
                aria-label="Open cart"
                onClick={() => navigate('/cart')}
                className="relative inline-flex flex-col items-center justify-center text-foreground/80 hover:text-foreground"
              >
                <ShoppingCart className="w-7 h-7" />
                <span className="text-[11px] leading-none mt-1">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-3 min-w-[20px] h-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] leading-[20px] text-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {user ? (
              <div className="flex justify-center">
                <button
                  aria-label="My orders"
                  onClick={() => navigate('/orders')}
                  className="inline-flex flex-col items-center justify-center text-foreground/80 hover:text-foreground"
                >
                  <Package className="w-7 h-7" />
                  <span className="text-[11px] leading-none mt-1">Orders</span>
                </button>
              </div>
            ) : null}

            <div className="flex justify-center">
              <button
                aria-label="Open scanner"
                onClick={() => navigate('/scan')}
                className="inline-flex flex-col items-center justify-center text-foreground/80 hover:text-foreground"
              >
                <Scan className="w-7 h-7" />
                <span className="text-[11px] leading-none mt-1">Scan</span>
              </button>
            </div>

            {user ? (
              <div className="flex justify-center">
                <button
                  aria-label="Open profile"
                  onClick={() => navigate('/profile')}
                  className="inline-flex flex-col items-center justify-center text-foreground/80 hover:text-foreground"
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                    {user.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                      : <User className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] leading-none mt-1">Profile</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  aria-label="Login"
                  onClick={() => navigate('/login')}
                  className="inline-flex flex-col items-center justify-center text-foreground/80 hover:text-foreground"
                >
                  <User className="w-7 h-7" />
                  <span className="text-[11px] leading-none mt-1">Login</span>
                </button>
              </div>
            )}

            {user ? (
              <div className="flex justify-center">
                <button
                  aria-label="Sign out"
                  onClick={handleSignOut}
                  className="inline-flex flex-col items-center justify-center text-foreground/80 hover:text-foreground"
                >
                  <LogOut className="w-7 h-7" />
                  <span className="text-[11px] leading-none mt-1">Sign out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
  )}
    </>
  )
}
