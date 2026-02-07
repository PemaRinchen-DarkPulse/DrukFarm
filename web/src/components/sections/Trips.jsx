import { ArrowRight } from 'lucide-react';
import { Container, Button } from '../ui';

const Trips = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-48">
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"
                  alt="Backpackers traveling"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-64">
                <img
                  src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80"
                  alt="Mountain lake"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl overflow-hidden h-64">
                <img
                  src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&q=80"
                  alt="Urban exploration"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-48">
                <img
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80"
                  alt="Scenic landscape"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-primary font-medium text-sm uppercase tracking-wider mb-3">
              Why Choose Us
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-dark leading-tight mb-6">
              TravelBu trips for modern travellers
            </h2>
            <p className="text-muted text-base leading-relaxed mb-4">
              Your ultimate travel companion for crafting perfect journeys to the
              world&apos;s most stunning destinations. We curate personalized trips
              that blend adventure, culture, and relaxation.
            </p>
            <p className="text-muted text-base leading-relaxed mb-8">
              From hidden gems to iconic landmarks, every journey is designed to
              create lasting memories while ensuring comfort and authenticity in
              your travels.
            </p>
            <Button variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              Explore More
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Trips;
