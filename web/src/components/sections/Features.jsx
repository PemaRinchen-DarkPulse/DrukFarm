import { TrendingUp, MessageCircle, Truck, Smartphone } from 'lucide-react';
import { Container, SectionHeading } from '../ui';

const features = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Live Market Prices",
    description: "Stay updated with real-time vegetable prices across Bhutan."
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Direct Connection",
    description: "Chat directly with buyers and sellers. No middlemen."
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Easy Logistics",
    description: "Find verified transporters for your route instantly."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile First",
    description: "Designed to work smoothly on any phone, anywhere."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <Container>
        <SectionHeading
          subtitle="Features"
          title="Everything You Need"
          description="Built to make your agricultural business easier and more profitable."
          className="mb-16"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">{feature.title}</h3>
              <p className="text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Features;
