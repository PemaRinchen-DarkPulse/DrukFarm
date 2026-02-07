import { useState } from 'react';
import { ArrowRight, CheckCircle2, Phone, MapPin, Tractor, ShoppingCart, Truck, Loader2 } from 'lucide-react';
import { Button, Container } from '../ui';

const dzongkhags = [
  "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Chukha", 
  "Samtse", "Sarpang", "Tsirang", "Dagana", "Haa", "Gasa", 
  "Bumthang", "Trongsa", "Zhemgang", "Mongar", "Lhuentse", 
  "Trashigang", "Trashi Yangtse", "Pema Gatshel", "Samdrup Jongkhar"
];

// Waitlist Component
const Waitlist = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dzongkhag: '',
    role: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.role) {
      setStatus('error');
      setMessage('Please fill in all required fields (Name, Phone, Role).');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const baseUrl = envUrl.replace(/\/$/, '');
      const endpoint = baseUrl.endsWith('/api') 
        ? `${baseUrl}/waitlist` 
        : `${baseUrl}/api/waitlist`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully joined the waitlist!');
        setFormData({ name: '', phone: '', dzongkhag: '', role: '' });

        // Show form again after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to join waitlist.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Is the server running?');
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const selectRole = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  return (
    <section id="waitlist" className="py-24 bg-dark relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-blue-500 blur-[100px]" />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Supporting Content */}
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Coming Soon
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Join the revolution in <span className="text-primary">agriculture.</span>
            </h2>
            
            <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
              We're building the future of farming in Bhutan. Be the first to get access to fair market prices and direct buyer connections.
            </p>

            <div className="space-y-4 mb-10">
              {[
                "Early access to the marketplace",
                "Zero commission for first 3 months",
                "Priority support & onboarding"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex -space-x-3">
                    {[1,2,3].map((_,i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-dark bg-gray-600 flex items-center justify-center overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div>
                    <p className="text-white font-medium">500+ Farmers & Buyers</p>
                    <p className="text-sm text-gray-400">have already joined the waitlist.</p>
                </div>
            </div> */}
          </div>

          {/* Waitlist Form Card */}
          <div className="lg:w-1/2 w-full">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-2xl relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-dark mb-2">Secure your spot</h3>
                <p className="text-muted">Tell us who you are and we'll keep you posted.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {status === 'success' ? (
                  <div className="bg-green-50 text-green-600 p-4 rounded-xl text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-bold">{message}</p>
                  </div>
                ) : (
                  <>
                    {status === 'error' && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {message}
                      </div>
                    )}

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            type="tel" 
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="17xxxxxx"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="dzongkhag" className="block text-sm font-medium text-gray-700 mb-1">Dzongkhag</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select 
                            id="dzongkhag"
                            value={formData.dzongkhag}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white appearance-none text-gray-700"
                          >
                            <option value="">Select</option>
                            {dzongkhags.sort().map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">I am a...</label>
                      <div className="grid grid-cols-3 gap-3">
                          <button 
                            type="button" 
                            onClick={() => selectRole('farmer')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all group ${
                              formData.role === 'farmer' 
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <Tractor className={`w-6 h-6 mb-1 ${formData.role === 'farmer' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                            <span className={`text-xs font-medium ${formData.role === 'farmer' ? 'text-primary' : 'text-gray-600 group-hover:text-dark'}`}>Farmer</span>
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={() => selectRole('vendor')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all group ${
                              formData.role === 'vendor' 
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <ShoppingCart className={`w-6 h-6 mb-1 ${formData.role === 'vendor' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                            <span className={`text-xs font-medium ${formData.role === 'vendor' ? 'text-primary' : 'text-gray-600 group-hover:text-dark'}`}>Buyer</span>
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={() => selectRole('transporter')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all group ${
                              formData.role === 'transporter' 
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <Truck className={`w-6 h-6 mb-1 ${formData.role === 'transporter' ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                            <span className={`text-xs font-medium ${formData.role === 'transporter' ? 'text-primary' : 'text-gray-600 group-hover:text-dark'}`}>Partner</span>
                          </button>
                      </div>
                    </div>

                    <Button className="w-full mt-4" size="lg" disabled={status === 'loading'}>
                      {status === 'loading' ? (
                        <>Joining... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                      ) : (
                        <>Join Waitlist <ArrowRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </>
                )}
                
                <p className="text-center text-xs text-muted mt-4">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
};

export default Waitlist;
