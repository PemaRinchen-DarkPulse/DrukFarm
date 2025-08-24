import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Features from "./pages/Features";
import Category from "./pages/Category";
import How from "./pages/How";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ToastProvider from "./components/ui/toast";
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Management from './pages/Management';
import Profile from './pages/Profile';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Features />} />
              <Route path="/categories" element={<Category />} />
              <Route path="/how" element={<How />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/management" element={<Management />} />
              <Route path="/profile" element={<Profile />} />
              {/* dashboard removed; management will be the post-login landing */}
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;