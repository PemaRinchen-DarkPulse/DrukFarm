import {
  Navbar,
  Hero,
  Stats,
  ProblemSolution,
  Mission,
  Features,
  HowItWorks,
  Waitlist,
  Destinations,
  Trips,
  JourneyHelp,
  Testimonials,
  CTA,
  Footer,
} from './components/sections';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      {/* <Stats /> */}
      <ProblemSolution />
      <Mission />
      <HowItWorks />
      <Features />
      <Waitlist />
      <Footer />
      {/* End of Landing Page */}
    </div>
  );
};

export default LandingPage;
