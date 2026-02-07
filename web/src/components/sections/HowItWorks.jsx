import { UploadCloud, ShoppingBag, Truck } from 'lucide-react';
import { Container, SectionHeading } from '../ui';

const steps = [
  {
    number: "01",
    icon: <UploadCloud className="w-8 h-8" />,
    title: "Farmers List Produce",
    description: "Post your harvest quantity and price in minutes using our simple mobile app."
  },
  {
    number: "02",
    icon: <ShoppingBag className="w-8 h-8" />,
    title: "Vendors Place Orders",
    description: "Browse and buy fresh produce directly from farmers with transparent pricing."
  },
  {
    number: "03",
    icon: <Truck className="w-8 h-8" />,
    title: "Transporters Deliver",
    description: "Drivers get assigned instantly and deliver produce efficiently to the destination."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-[#faf8f5] relative">
      <Container>
        <SectionHeading
          subtitle="How It Works"
          title="Simple, Fast, Effective"
          description="A streamlined process connecting every part of the agricultural supply chain."
          className="mb-20"
        />

        <div className="relative grid md:grid-cols-3 gap-12">
          {/* Connecting Line (Desktop only) */}
          <div className="hidden md:block absolute top-[85px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-primary/30 to-gray-200 -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="relative group flex flex-col items-center text-center">
              
              {/* Number Badge */}
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 shadow-lg flex items-center justify-center mb-8 relative z-10 group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl font-bold font-serif text-gray-300 group-hover:text-primary/40 transition-colors absolute top-1 right-2">
                  {step.number}
                </span>
                <div className="text-primary">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div className="max-w-xs">
                <h3 className="text-xl font-bold text-dark mb-3">{step.title}</h3>
                <p className="text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default HowItWorks;
