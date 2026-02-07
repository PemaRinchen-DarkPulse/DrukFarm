import { MapPin, Ticket, CreditCard } from 'lucide-react';
import { Container, SectionHeading, Card } from '../ui';

const steps = [
  {
    icon: <MapPin size={32} />,
    title: 'Find your destination',
    description: 'Explore a wide range of destinations across the globe and discover the perfect spot.',
  },
  {
    icon: <Ticket size={32} />,
    title: 'Book a ticket',
    description: 'Secure your trip with our flexible booking options and best price guarantee.',
  },
  {
    icon: <CreditCard size={32} />,
    title: 'Pay and enjoy your adventure',
    description: 'Easy and secure payment methods so you can focus on enjoying the journey.',
  },
];

const JourneyHelp = () => {
  return (
    <section className="py-20 bg-accent">
      <Container>
        <SectionHeading
          subtitle="Easy Steps"
          title="How we can help your journey"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="text-center shadow-sm border border-gray-100"
              padding="p-8"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-6">
                {step.icon}
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Step {index + 1}
              </span>
              <h3 className="text-lg font-bold text-dark mt-2 mb-3">
                {step.title}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default JourneyHelp;
