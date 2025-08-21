import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import How from "./pages/How";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ToastProvider from "./components/ui/toast";
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how" element={<How />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;