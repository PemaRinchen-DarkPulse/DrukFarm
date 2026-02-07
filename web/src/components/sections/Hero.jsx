import { ArrowRight } from 'lucide-react';
import { Button, Container } from '../ui';
import heroImg from '../../assets/images/hero.jpg';

const Hero = () => {
  return (
    <section id="home" className="relative flex items-center min-h-[100dvh]">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Beautiful mountain landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/80 via-dark/60 to-dark/30" />
      </div>

      <Container className="relative z-10 pt-24 pb-20">
        <div className="max-w-3xl">
          <h1 className=" text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Grown by Farmers, <span className="text-primary">Trusted by Vendors</span> & <span className="block sm:inline">Enjoyed by Communities.</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
            Druk Farm is building a fair, sustainable food system that supports local farmers, empowers vegetable vendors, and delivers fresh produce to Bhutanese households.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="primary" 
              size="lg" 
              icon={<ArrowRight size={18} />}
              onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
