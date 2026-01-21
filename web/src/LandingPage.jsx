import React, { useState } from 'react';
import { Sprout, ShoppingCart, Truck, GraduationCap, ChevronRight, Leaf, Users, BarChart3, Clock, CheckCircle2, Menu, X, Heart, Globe, ShieldCheck, Smartphone } from 'lucide-react';
import logo from './assets/logo.png';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
      <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-druk-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-druk-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-earth-900 mb-2">Thank You!</h2>
          <p className="text-earth-600 mb-6">We've added you to the Druk Farm early access list. We'll contact you when the pilot starts.</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="text-druk-green-600 font-medium hover:text-druk-green-700"
          >
            Go back to site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-earth-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-earth-100">
        <div className="w-full px-8 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Druk Farm Logo" className="h-12 md:h-14 w-auto object-contain" />
              <span className="text-xl lg:text-2xl font-bold text-earth-900">Druk Farm</span>
            </div>

            {/* Desktop Menu - Centered Links */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <a href="#" className="font-medium lg:text-lg text-earth-600 hover:text-druk-green-600 transition-colors">Home</a>
              <a href="#mission" className="font-medium lg:text-lg text-earth-600 hover:text-druk-green-600 transition-colors">Our Mission</a>
              <a href="#features" className="font-medium lg:text-lg text-earth-600 hover:text-druk-green-600 transition-colors">Features</a>
              <a href="#how-it-works" className="font-medium lg:text-lg text-earth-600 hover:text-druk-green-600 transition-colors">How It Works</a>
            </div>

            {/* Right Side: Button & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' })}
                className="hidden md:block bg-druk-green-600 text-white px-5 py-2 rounded-lg font-semibold lg:text-lg hover:bg-druk-green-700 transition-colors shadow-sm"
              >
                Join Waitlist
              </button>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-earth-600 hover:bg-earth-100"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-earth-100 px-4 py-4 shadow-lg absolute w-full">
            <div className="flex flex-col gap-4">
              <a href="#" className="font-medium text-earth-700 py-2" onClick={() => setIsMenuOpen(false)}>Home</a>
              <a href="#mission" className="font-medium text-earth-700 py-2" onClick={() => setIsMenuOpen(false)}>Our Mission</a>
              <a href="#features" className="font-medium text-earth-700 py-2" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="font-medium text-earth-700 py-2" onClick={() => setIsMenuOpen(false)}>How It Works</a>
              <button 
                onClick={() => {
                  document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
                className="bg-druk-green-600 text-white px-5 py-3 rounded-lg font-semibold text-center mt-2"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 1. Hero Section */}
      <header className="px-4 pt-8 pb-16 md:pt-16 md:pb-24 max-w-6xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-earth-900 mb-6">
          Sell Your Farm Produce Directly. <br className="hidden md:block" />
          <span className="text-druk-green-600">Fair Prices. Less Waste.</span>
        </h1>
        <p className="text-lg md:text-xl text-earth-600 max-w-2xl mx-auto mb-10">
          Druk Farm connects farmers, vegetable sellers, and transporters on one simple digital platform.
        </p>
        <button 
          onClick={() => document.getElementById('waitlist-form').scrollIntoView({ behavior: 'smooth' })}
          className="bg-druk-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:bg-druk-green-700 transition-colors transform hover:scale-105"
        >
          Join the Waitlist
        </button>
      </header>

      {/* 2. Problem & Solution */}
      <section id="problem" className="bg-earth-50 py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-earth-100">
            <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center">
              The Problem
            </h2>
            <ul className="space-y-4">
              {[
                "Farmers don't know fair market prices",
                "Difficulty finding reliable buyers",
                "Produce wasted due to poor logistics",
                "Middlemen reduce farmer income"
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-3 mt-0.5">×</span>
                  <span className="text-earth-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="inline-block p-3 rounded-xl bg-druk-green-100 text-druk-green-700 mb-4">
              <Leaf className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Solution</h2>
            <p className="text-lg text-earth-600 leading-relaxed">
              Druk Farm is a digital marketplace that helps farmers <span className="text-druk-green-700 font-semibold">sell directly</span>, 
              get <span className="text-druk-green-700 font-semibold">price transparency</span>, and connect with 
              <span className="text-druk-green-700 font-semibold"> transporters</span> easily.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Mission Section */}
      <section id="mission" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-druk-green-50 rounded-full text-druk-green-600 mb-6">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-3xl font-bold text-earth-900 mb-6">Our Mission</h2>
          <p className="text-xl md:text-2xl text-earth-700 leading-relaxed font-medium mb-8">
            "To empower Bhutanese farmers with technology, ensuring fair prices, reducing food waste, and strengthening our nation's food security so every home has access to fresh, local produce."
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="bg-earth-50 p-6 rounded-xl border border-earth-100">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-5 h-5 text-druk-green-600" />
                <h3 className="font-bold text-earth-900">For Bhutan</h3>
              </div>
              <p className="text-earth-600">Built specifically for our local context, geography, and community needs.</p>
            </div>
            <div className="bg-earth-50 p-6 rounded-xl border border-earth-100">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-druk-green-600" />
                <h3 className="font-bold text-earth-900">For Community</h3>
              </div>
              <p className="text-earth-600">Connecting rural farmers directly with urban markets to help everyone thrive.</p>
            </div>
            <div className="bg-earth-50 p-6 rounded-xl border border-earth-100">
              <div className="flex items-center gap-3 mb-3">
                <Leaf className="w-5 h-5 text-druk-green-600" />
                <h3 className="font-bold text-earth-900">For Sustainability</h3>
              </div>
              <p className="text-earth-600">Reducing supply chain waste means better efficiency and a greener future.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section id="how-it-works" className="bg-earth-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: BarChart3, 
                title: "Farmers List Produce", 
                desc: "Post your harvest quantity and price." 
              },
              { 
                icon: ShoppingCart, 
                title: "Vendors Place Orders", 
                desc: "Browse and buy fresh produce directly." 
              },
              { 
                icon: Truck, 
                title: "Transporters Deliver", 
                desc: "Drivers get notified to pick up and deliver." 
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8 text-druk-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-earth-300">{step.desc}</p>
                {i < 2 && (
                  <ChevronRight className="w-8 h-8 text-earth-700 hidden md:block absolute transform translate-x-40 mt-4 opacity-50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Features Section */}
      <section id="features" className="py-20 px-4 bg-earth-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-earth-900 mb-4">Everything You Need</h2>
            <p className="text-earth-600">Built to make your agricultural business easier.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Live Market Prices",
                desc: "Stay updated with real-time vegetable prices across Bhutan."
              },
              {
                icon: Users,
                title: "Direct Connection",
                desc: "Chat directly with buyers and sellers. No middlemen."
              },
               {
                icon: Truck,
                title: "Easy Logistics",
                desc: "Find verified transporters for your route instantly."
              },
              {
                icon: Smartphone,
                title: "Mobile First",
                desc: "Designed to work smoothly on any phone, anywhere."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-earth-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-druk-green-100 rounded-lg flex items-center justify-center text-druk-green-600 mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-earth-900 mb-2">{feature.title}</h3>
                <p className="text-earth-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Waitlist Form */}
      <section id="waitlist-form" className="py-20 px-4 bg-druk-green-50">
        <div className="max-w-xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-earth-900 mb-2">Join the Early Access List</h2>
            <p className="text-earth-600">We’re building this with Bhutanese farmers. Be part of the pilot.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-earth-700 mb-1">Full Name</label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3 rounded-lg border border-earth-300 focus:ring-2 focus:ring-druk-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Sangay Dorji"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-earth-700 mb-1">Phone Number</label>
              <input
                type="tel"
                id="phone"
                required
                className="w-full px-4 py-3 rounded-lg border border-earth-300 focus:ring-2 focus:ring-druk-green-500 focus:border-transparent outline-none transition-all"
                placeholder="17xxxxxx"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-earth-700 mb-1">I am a...</label>
                <select
                  id="role"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-earth-300 focus:ring-2 focus:ring-druk-green-500 focus:border-transparent outline-none transition-all bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dzongkhag" className="block text-sm font-medium text-earth-700 mb-1">Dzongkhag</label>
                <select
                  id="dzongkhag"
                  className="w-full px-4 py-3 rounded-lg border border-earth-300 focus:ring-2 focus:ring-druk-green-500 focus:border-transparent outline-none transition-all bg-white"
                  value={formData.dzongkhag}
                  onChange={e => setFormData({...formData, dzongkhag: e.target.value})}
                >
                  <option value="">Select (Optional)</option>
                  {dzongkhags.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-druk-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:bg-druk-green-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>👉 Join Waitlist</>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="text-center py-8 text-earth-500 text-sm">
        <p>Built for Bhutan 🇧🇹 | Supporting food security & farmer income</p>
        <p className="mt-2 text-earth-400">© {new Date().getFullYear()} Druk Farm</p>
      </footer>
    </div>
  );
};

export default LandingPage;
