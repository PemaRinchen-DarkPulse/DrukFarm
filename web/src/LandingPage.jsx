import React, { useState } from 'react';
import { Sprout, ShoppingCart, Truck, GraduationCap, ChevronRight, Leaf, Users, BarChart3, Clock, CheckCircle2, Menu, X, Heart, Globe, ShieldCheck, Smartphone, AlertCircle, Minus } from 'lucide-react';
import logo from './assets/druk_logo.png';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
    dzongkhag: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDzongkhagOpen, setIsDzongkhagOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const roles = [
    { id: 'farmer', label: 'Farmer', icon: Sprout },
    { id: 'vendor', label: 'Vegetable Vendor', icon: ShoppingCart },
    { id: 'transporter', label: 'Transporter', icon: Truck }
  ];

  const dzongkhags = [
    'Bumthang', 'Chukha', 'Dagana', 'Gasa', 'Haa', 'Lhuentse', 
    'Mongar', 'Paro', 'Pema Gatshel', 'Punakha', 'Samdrup Jongkhar', 
    'Samtse', 'Sarpang', 'Thimphu', 'Trashigang', 'Trashi Yangtse', 
    'Trongsa', 'Tsirang', 'Wangdue Phodrang', 'Zhemgang'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Handle comma-separated URLs
      if (apiUrl.includes(',')) {
        apiUrl = apiUrl.split(',')[0].trim();
      }
      
      // Remove trailing slashes
      apiUrl = apiUrl.replace(/\/+$/, '');

      // Ensure API URL points to the correct endpoint
      if (!apiUrl.endsWith('/api')) {
        apiUrl = `${apiUrl}/api`;
      }

      const response = await fetch(`${apiUrl}/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({ name: '', phone: '', role: '', dzongkhag: '' }); // Clear form
      } else {
        alert(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert("Failed to connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-2xl border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
          <p className="text-gray-600 text-lg mb-8">We've added you to the Druk Farm early access list. We'll contact you when the pilot starts.</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            ← Go back to site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="w-full px-6 md:px-12 lg:px-16">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Druk Farm Logo" className="h-12 md:h-14 w-auto object-contain" />
              <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Druk Farm</span>
            </div>

            {/* Desktop Menu - Centered Links */}
            <div className="hidden md:flex items-center gap-10 absolute left-1/2 transform -translate-x-1/2">
              <a href="#" className="font-semibold text-gray-700 hover:text-primary-600 transition-all hover:scale-105">Home</a>
              <a href="#mission" className="font-semibold text-gray-700 hover:text-primary-600 transition-all hover:scale-105">Our Mission</a>
              <a href="#features" className="font-semibold text-gray-700 hover:text-primary-600 transition-all hover:scale-105">Features</a>
              <a href="#how-it-works" className="font-semibold text-gray-700 hover:text-primary-600 transition-all hover:scale-105">How It Works</a>
            </div>

            {/* Right Side: Button & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' })}
                className="hidden md:block bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
              >
                Join Waitlist
              </button>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-6 absolute w-full shadow-lg">
            <div className="flex flex-col gap-5">
              <a href="#" className="font-semibold text-gray-700 hover:text-primary-600 py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Home</a>
              <a href="#mission" className="font-semibold text-gray-700 hover:text-primary-600 py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Our Mission</a>
              <a href="#features" className="font-semibold text-gray-700 hover:text-primary-600 py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="font-semibold text-gray-700 hover:text-primary-600 py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>How It Works</a>
              <button 
                onClick={() => {
                  document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
                className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-4 rounded-xl font-bold text-center mt-3 hover:shadow-lg transition-all"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 1. Hero Section */}
      <header className="px-6 pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 px-5 py-2 rounded-full text-primary-700 font-semibold mb-8 hover:shadow-md transition-all">
          <span>Connecting Bhutan's Farmers</span>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
          <span className="bg-gradient-to-r from-gray-900 via-primary-800 to-accent-700 bg-clip-text text-transparent">Sell Your Farm Produce</span>
          <br />
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Directly. Fair Prices.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
          Druk Farm connects farmers, vegetable vendors, and transporters on one simple digital platform.
        </p>
        <button 
          onClick={() => document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' })}
          className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-primary-300/50 hover:scale-105 transition-all inline-flex items-center gap-3"
        >
          Join the Waitlist
          <ChevronRight className="w-6 h-6" />
        </button>
      </header>

      {/* 2. Problem & Solution */}
      <section id="problem" className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-10 rounded-3xl border border-gray-200">
            <div className="inline-flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-full text-gray-800 font-bold mb-6">
              <AlertCircle className="w-5 h-5" />
              <span>The Challenge</span>
            </div>
            <ul className="space-y-5">
              {[
                "Farmers don't know fair market prices",
                "Difficulty finding reliable buyers",
                "Produce wasted due to poor logistics",
                "Middlemen reduce farmer income"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">
                    <Minus className="w-5 h-5" />
                  </span>
                  <span className="text-gray-700 font-medium text-lg pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-100 to-accent-100 px-5 py-3 rounded-full text-primary-700 font-bold mb-6">
              <span>Our Solution</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">Transform Agriculture</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              Druk Farm is a digital marketplace that helps farmers <span className="text-primary-600 font-bold">sell directly</span>, 
              get <span className="text-primary-600 font-bold">price transparency</span>, and connect with 
              <span className="text-primary-600 font-bold"> transporters</span> easily.
            </p>
            <ul className="space-y-4">
              {[
                { icon: BarChart3, text: "Real-time market pricing" },
                { icon: Users, text: "Direct farmer-to-buyer connections" },
                { icon: Truck, text: "Integrated logistics network" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="font-semibold">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Mission Section */}
      <section id="mission" className="py-24 px-6 bg-gradient-to-b from-white via-primary-25 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl text-white mb-6 shadow-lg">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">Our Mission</h2>
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium mb-16 max-w-4xl mx-auto">
            "To empower Bhutanese farmers with technology, ensuring fair prices, reducing food waste, and strengthening our nation's food security so every home has access to fresh, local produce."
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "For Bhutan", desc: "Built specifically for our local context, geography, and community needs.", color: "primary" },
              { icon: Users, title: "For Community", desc: "Connecting rural farmers directly with urban markets to help everyone thrive.", color: "accent" },
              { icon: Leaf, title: "For Sustainability", desc: "Reducing supply chain waste means better efficiency and a greener future.", color: "primary" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all group border border-gray-100 hover:border-primary-200">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-${item.color}-100 to-${item.color}-50 mb-5 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section id="how-it-works" className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">How It Works</h2>
            <p className="text-primary-100 text-xl">Simple, Fast, Effective</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                icon: BarChart3, 
                title: "Farmers List Produce", 
                desc: "Post your harvest quantity and price in minutes.",
                step: "01"
              },
              { 
                icon: ShoppingCart, 
                title: "Vendors Place Orders", 
                desc: "Browse and buy fresh produce directly from farmers.",
                step: "02"
              },
              { 
                icon: Truck, 
                title: "Transporters Deliver", 
                desc: "Drivers get notified and deliver produce efficiently.",
                step: "03"
              }
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                <div className="text-7xl font-black text-white/10 absolute -top-8 left-1/2 transform -translate-x-1/2">{step.step}</div>
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/30 transition-all shadow-2xl relative z-10">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-primary-100 text-lg leading-relaxed">{step.desc}</p>
                {i < 2 && (
                  <ChevronRight className="w-8 h-8 text-white/40 hidden lg:block absolute right-0 top-1/2 transform translate-x-16 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-primary-100 px-5 py-2 rounded-full text-primary-700 font-bold mb-4">
              ✨ Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">Everything You Need</h2>
            <p className="text-xl text-gray-600">Built to make your agricultural business easier and more profitable.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Live Market Prices",
                desc: "Stay updated with real-time vegetable prices across Bhutan.",
                color: "primary"
              },
              {
                icon: Users,
                title: "Direct Connection",
                desc: "Chat directly with buyers and sellers. No middlemen.",
                color: "accent"
              },
               {
                icon: Truck,
                title: "Easy Logistics",
                desc: "Find verified transporters for your route instantly.",
                color: "primary"
              },
              {
                icon: Smartphone,
                title: "Mobile First",
                desc: "Designed to work smoothly on any phone, anywhere.",
                color: "accent"
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-white p-8 rounded-2xl hover:shadow-2xl transition-all border border-gray-100 hover:border-primary-200 hover:-translate-y-2">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-50 mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Waitlist Form */}
      <section id="waitlist-form" className="py-24 px-6 bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100/50"></div>
        <div className="max-w-2xl mx-auto relative">
          <div className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl border border-gray-100">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">Join Early Access</h2>
              <p className="text-gray-600 text-lg">Be among the first to transform Bhutanese agriculture.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-primary-500 focus:bg-white outline-none transition-all text-gray-900"
                  placeholder="Sangay Dorji"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-gray-800 mb-2">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-primary-500 focus:bg-white outline-none transition-all text-gray-900"
                  placeholder="17xxxxxx"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-bold text-gray-800 mb-2">I am a...</label>
                  <div className="relative">
                    <div
                      className="w-full px-5 py-4 rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-primary-300 hover:shadow-md focus:border-primary-500 focus:bg-white focus:shadow-lg outline-none transition-all text-gray-900 cursor-pointer font-medium text-base shadow-sm"
                      onClick={() => {
                        setIsRoleOpen(!isRoleOpen);
                        setIsDzongkhagOpen(false);
                      }}
                    >
                      <span className={formData.role ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.role ? roles.find(r => r.id === formData.role)?.label : 'Select Role'}
                      </span>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className={`w-5 h-5 text-primary-500 transition-transform ${isRoleOpen ? '-rotate-90' : 'rotate-90'}`} />
                    </div>
                    
                    {isRoleOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-200 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-[192px] overflow-y-auto">
                          <div
                            className="px-5 py-3 hover:bg-primary-50 cursor-pointer transition-colors text-gray-500 font-medium"
                            onClick={() => {
                              setFormData({...formData, role: ''});
                              setIsRoleOpen(false);
                            }}
                          >
                            Select Role
                          </div>
                          {roles.map((r) => (
                            <div
                              key={r.id}
                              className={`px-5 py-3 hover:bg-primary-50 cursor-pointer transition-colors font-medium ${
                                formData.role === r.id ? 'bg-primary-100 text-primary-700' : 'text-gray-900'
                              }`}
                              onClick={() => {
                                setFormData({...formData, role: r.id});
                                setIsRoleOpen(false);
                              }}
                            >
                              {r.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="dzongkhag" className="block text-sm font-bold text-gray-800 mb-2">Dzongkhag</label>
                  <div className="relative">
                    <div
                      className="w-full px-5 py-4 rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-primary-300 hover:shadow-md focus:border-primary-500 focus:bg-white focus:shadow-lg outline-none transition-all text-gray-900 cursor-pointer font-medium text-base shadow-sm"
                      onClick={() => {
                        setIsDzongkhagOpen(!isDzongkhagOpen);
                        setIsRoleOpen(false);
                      }}
                    >
                      <span className={formData.dzongkhag ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.dzongkhag || 'Select (Optional)'}
                      </span>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className={`w-5 h-5 text-primary-500 transition-transform ${isDzongkhagOpen ? '-rotate-90' : 'rotate-90'}`} />
                    </div>
                    
                    {isDzongkhagOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-200 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-[192px] overflow-y-auto">
                          <div
                            className="px-5 py-3 hover:bg-primary-50 cursor-pointer transition-colors text-gray-500 font-medium"
                            onClick={() => {
                              setFormData({...formData, dzongkhag: ''});
                              setIsDzongkhagOpen(false);
                            }}
                          >
                            Select (Optional)
                          </div>
                          {dzongkhags.map((d) => (
                            <div
                              key={d}
                              className={`px-5 py-3 hover:bg-primary-50 cursor-pointer transition-colors font-medium ${
                                formData.dzongkhag === d ? 'bg-primary-100 text-primary-700' : 'text-gray-900'
                              }`}
                              onClick={() => {
                                setFormData({...formData, dzongkhag: d});
                                setIsDzongkhagOpen(false);
                              }}
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Join Waitlist
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-primary-900 to-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={logo} alt="Druk Farm Logo" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-bold">Druk Farm</span>
          </div>
          <p className="text-gray-300 text-lg mb-2">Built for Bhutan 🇧🇹 | Supporting food security & farmer income</p>
          <p className="text-gray-400">© {new Date().getFullYear()} Druk Farm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
