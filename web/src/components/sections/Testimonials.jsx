import { Star, Quote } from 'lucide-react';
import { Container, SectionHeading, Card } from '../ui';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Adventurer',
    text: 'TravelBu made our honeymoon trip absolutely magical. Every detail was perfectly arranged and the destinations were breathtaking!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    rating: 5,
  },
  {
    id: 2,
    name: 'James Russell',
    role: 'Photographer',
    text: 'As a travel photographer, I need unique locations. TravelBu consistently delivers hidden gems that most agencies overlook.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'Digital Nomad',
    text: 'The seamless booking process and incredible customer support make TravelBu my go-to platform for all trips!',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    rating: 5,
  },
];

const TestimonialCard = ({ testimonial }) => (
  <Card className="shadow-md" padding="p-8">
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: testimonial.rating }).map((_, i) => (
        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <Quote size={24} className="text-primary/20 mb-3" />
    <p className="text-muted text-sm leading-relaxed mb-6">
      {testimonial.text}
    </p>
    <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
      <img
        src={testimonial.avatar}
        alt={testimonial.name}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-dark text-sm">{testimonial.name}</p>
        <p className="text-muted text-xs">{testimonial.role}</p>
      </div>
    </div>
  </Card>
);

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionHeading
          subtitle="Testimonials"
          title="Loved by over million travelers"
          description="Hear from our community of travelers about their incredible experiences with us."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Testimonials;
