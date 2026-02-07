import { ArrowUpRight } from 'lucide-react';
import { Container, Button } from '../ui';

const CTA = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80"
              alt="Beach sunset"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-dark/75" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 py-16 md:py-20 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-lg">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                Let&apos;s explore the beauty of the world
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Join us for an exclusive 30% discount on your next adventure. Limited time offer for early explorers.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowUpRight size={20} />}
              className="shrink-0"
            >
              Get Started
            </Button>
          </div>

          {/* Decorative images */}
          <div className="absolute -bottom-4 -right-4 w-28 h-28 rounded-2xl overflow-hidden opacity-60 hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CTA;
