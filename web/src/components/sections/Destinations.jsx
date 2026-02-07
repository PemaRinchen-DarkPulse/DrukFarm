import { MapPin } from 'lucide-react';
import { Container, SectionHeading, Card } from '../ui';

const destinations = [
  {
    id: 1,
    title: 'London, England',
    description: 'The perfect blend of history and modern culture awaits.',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
    rating: 4.8,
  },
  {
    id: 2,
    title: 'Paris, France',
    description: 'Experience the city of lights and romance like never before.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    rating: 4.9,
  },
  {
    id: 3,
    title: 'Bali, Indonesia',
    description: 'Discover tropical paradise with stunning beaches and temples.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    rating: 4.7,
  },
];

const DestinationCard = ({ destination }) => (
  <Card className="group shadow-md overflow-hidden" padding="p-0">
    <Card.Image
      src={destination.image}
      alt={destination.title}
      className="h-64"
    />
    <Card.Content className="p-5">
      <div className="flex items-center gap-2 text-muted text-sm mb-2">
        <MapPin size={14} className="text-primary" />
        <span>{destination.title}</span>
      </div>
      <p className="text-muted text-sm leading-relaxed">
        {destination.description}
      </p>
      <div className="flex items-center gap-1 mt-3">
        <span className="text-yellow-500 text-sm">★</span>
        <span className="text-sm font-medium">{destination.rating}</span>
      </div>
    </Card.Content>
  </Card>
);

const Destinations = () => {
  return (
    <section id="destinations" className="py-20 bg-accent">
      <Container>
        <SectionHeading
          subtitle="Discover"
          title="Recommended popular destinations"
          description="Our curated selection of the world's most breathtaking destinations, handpicked to inspire your next unforgettable adventure."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
          {destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Destinations;
