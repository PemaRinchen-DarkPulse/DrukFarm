import React, { useState } from 'react'
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export default function Contact(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const { show } = useToast()

  function isValidEmail(e){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }

  const handleSubmit = (e) =>{
    e.preventDefault()
    if(!name || !isValidEmail(email) || !message){
      show('Please fill name, valid email and a message')
      return
    }

    // demo submit
    show('Message sent — we will get back to you shortly')
    setName(''); setEmail(''); setSubject(''); setMessage('')
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Contact</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: socials/contact info */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Get in touch</h2>
          <p className="text-sm text-slate-600 mb-4">Reach out for partnerships, support, or media inquiries.</p>

          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-600" />
              <a href="mailto:contact@drukfarm.bt" className="hover:underline">contact@drukfarm.bt</a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-emerald-600" />
              <a href="tel:+97512345678" className="hover:underline">+975 1234 5678</a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Thimphu, Bhutan</span>
            </li>
          </ul>

          <div className="mt-6">
            <h3 className="font-medium mb-3">Follow us</h3>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Facebook" className="p-2 rounded-md hover:bg-slate-100"><Facebook className="w-5 h-5 text-emerald-600" /></a>
              <a href="#" aria-label="Instagram" className="p-2 rounded-md hover:bg-slate-100"><Instagram className="w-5 h-5 text-emerald-600" /></a>
              <a href="#" aria-label="Message" className="p-2 rounded-md hover:bg-slate-100"><MessageCircle className="w-5 h-5 text-emerald-600" /></a>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>

            <Input placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            <textarea placeholder="Message" value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full border rounded-md p-3 min-h-[140px]" />

            <div className="flex justify-end">
              <Button type="submit">Send message</Button>
            </div>
          </form>
        </div>
      </div>

      {/* Map below */}
      <div className="mt-8 rounded-lg overflow-hidden shadow-sm">
        <iframe
          title="Thimphu map"
          src="https://www.google.com/maps?q=thimphu,+bhutan&output=embed"
          className="w-full h-72"
          loading="lazy"
        />
      </div>
    </div>
  )
}
