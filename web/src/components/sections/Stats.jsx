import { Users, Globe, Award } from 'lucide-react';
import { Container } from '../ui';

const stats = [
  { icon: <Users size={28} />, value: '500+', label: 'Customers' },
  { icon: <Globe size={28} />, value: '200+', label: 'Destinations' },
  { icon: <Award size={28} />, value: '10+', label: 'Awards' },
];

const Stats = () => {
  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-muted text-sm font-medium uppercase tracking-wider">
            We worth
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="text-primary">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-dark">{stat.value}</p>
                  <p className="text-muted text-sm">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Stats;
