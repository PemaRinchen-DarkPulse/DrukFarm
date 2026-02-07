import { Send, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { Container } from '../ui';

const footerLinks = {
  Company: [
    { label: 'About Us', href: '#mission' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Platform: [
    { label: 'Marketplace', href: '#features' },
    { label: 'For Farmers', href: '#waitlist' },
    { label: 'For Buyers', href: '#waitlist' },
    { label: 'Transport', href: '#features' },
  ],
  Support: [
    { label: 'FAQ', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

const socialIcons = [
  { icon: <Instagram size={18} />, href: '#', label: 'Instagram' },
  { icon: <Twitter size={18} />, href: '#', label: 'Twitter' },
  { icon: <Facebook size={18} />, href: '#', label: 'Facebook' },
  { icon: <Youtube size={18} />, href: '#', label: 'Youtube' },
];

const Footer = () => {
  return (
    <footer className="bg-light pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <span className="text-xl font-bold text-dark">Druk Farm</span>
            </div>
            <p className="text-muted text-sm leading-relaxed mb-6 max-w-xs">
              Empowering Bhutan&apos;s agriculture with technology. A fair, sustainable marketplace for farmers, vendors, and transporters.
            </p>
            {/* Newsletter */}
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-l-full text-sm focus:outline-none focus:border-primary"
              />
              <button className="px-5 py-3 bg-primary text-white rounded-r-full hover:bg-primary-dark transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-dark mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted text-sm hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted text-sm">
            © 2026 Druk Farm. All rights reserved.
          </p>Druk Farm
          <div className="flex items-center gap-4">
            {socialIcons.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
