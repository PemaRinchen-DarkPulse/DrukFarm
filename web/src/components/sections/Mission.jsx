import { Container } from '../ui';

const Mission = () => {
  const values = [
    {
      title: "For Bhutan",
      description: "Built specifically for our local context, geography, and community needs."
    },
    {
      title: "For Community",
      description: "Connecting rural farmers directly with urban markets to help everyone thrive."
    },
    {
      title: "For Sustainability",
      description: "Reducing supply chain waste means better efficiency and a greener future."
    }
  ];

  return (
    <section id="mission" className="py-20 bg-white relative">
      <Container>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left: Manifesto/Mission Statement */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <div>
              <span className="text-primary font-medium text-sm uppercase tracking-wider mb-2 block">Our Mission</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight text-dark">
                Empowering farmers, securing our future.
              </h2>
              <div className="relative pl-8 border-l-4 border-primary/20">
                <p className="text-xl md:text-2xl font-serif text-muted italic leading-relaxed">
                  "To empower Bhutanese farmers with technology, ensuring fair prices, reducing food waste, and strengthening our nation's food security so every home has access to fresh, local produce."
                </p>
              </div>
            </div>
          </div>

          {/* Right: Values Grid */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <div className="grid gap-6">
              {values.map((item, index) => (
                <div 
                  key={index} 
                  className="group p-8 rounded-2xl bg-[#faf8f5] hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <div>
                    <h3 className="text-xl font-bold text-dark mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
};

export default Mission;
