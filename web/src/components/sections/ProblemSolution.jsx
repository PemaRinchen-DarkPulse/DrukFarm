import { 
  Search, 
  Leaf, 
  Scissors, 
  LineChart, 
  Handshake, 
  Truck,
  ArrowRight
} from 'lucide-react';
import { Container } from '../ui';

const ProblemSolution = () => {
  const challenges = [
    {
      icon: <LineChart className="w-6 h-6 rotate-180" />, // Represents dropping/unknown prices
      title: "Unfair Market Prices",
      challenge: "Farmers don't know fair market prices due to lack of real-time data."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Unreliable Buyers",
      challenge: "Difficulty finding reliable buyers leads to unsold inventory."
    },
    {
      icon: <Leaf className="w-6 h-6" />, // Wasted produce
      title: "Produce Wastage",
      challenge: "Good produce is wasted due to poor logistics and storage."
    },
    {
      icon: <Scissors className="w-6 h-6" />,
      title: "Middlemen Impact",
      challenge: "Middlemen reduce farmer income significantly."
    }
  ];

  const solutions = [
    {
      icon: <LineChart className="w-5 h-5" />,
      text: "Real-time market pricing"
    },
    {
      icon: <Handshake className="w-5 h-5" />,
      text: "Direct farmer-to-buyer connections"
    },
    {
      icon: <Truck className="w-5 h-5" />,
      text: "Integrated logistics network"
    }
  ];

  return (
    <section className="py-20 bg-[#faf8f5] relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/30 skew-x-12 translate-x-1/2 pointer-events-none" />

      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: The Challenge */}
          <div>
            <div className="mb-10">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">The Challenge</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">Why Agriculture Needs Change</h2>
              <p className="text-muted text-lg">
                Traditional farming faces systemic bottlenecks that hurt both farmers and buyers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {challenges.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100/50">
                  <h3 className="font-semibold text-dark mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.challenge}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Our Solution */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 relative z-10">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
                
                <span className="text-primary font-medium text-sm uppercase tracking-wider block mb-2">Our Solution</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Transform Agriculture</h2>
                
                <p className="text-lg text-muted mb-8 text-pretty">
                    Druk Farm is a digital marketplace that helps farmers sell directly, get price transparency, and connect with transporters easily.
                </p>

                <div className="space-y-6">
                    {solutions.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 group">
                            <span className="font-medium text-dark md:text-lg">{item.text}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all cursor-pointer">
                        Learn how it works <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Visual offset background for the card */}
            <div className="absolute top-8 left-8 w-full h-full bg-dark rounded-2xl -z-10 opacity-5 hidden md:block" />
          </div>

        </div>
      </Container>
    </section>
  );
};

export default ProblemSolution;
