import React from 'react';
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from 'react-feather';

const Footer = () => {
  return (
    <footer className="py-5" style={{ backgroundColor: "#0a192f", marginTop: "auto" }}>
      <div className="container">
        <div className="row">
          {/* About Us Section */}
          <div className="col-md-4 mb-4">
            <h5 className="mb-3 text-white">About Us</h5>
            <p className="text-muted">
              We are dedicated to providing the best products and services to our customers. Our mission is to make your shopping experience seamless and enjoyable.
            </p>
            <div className="d-flex">
              <a href="#" className="text-white me-3">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white me-3">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Useful Links Section */}
          <div className="col-md-4 mb-4">
            <h5 className="mb-3 text-white">Useful Links</h5>
            <ul className="list-unstyled">
              <li><a href="#" className="text-muted text-decoration-none">Home</a></li>
              <li><a href="#" className="text-muted text-decoration-none">About Us</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Services</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Contact</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact Information Section */}
          <div className="col-md-4 mb-4">
            <h5 className="mb-3 text-white">Contact Us</h5>
            <ul className="list-unstyled text-muted">
              <li className="mb-2">
                <MapPin size={16} className="me-2" />
                123 Main Street, City, Country
              </li>
              <li className="mb-2">
                <Phone size={16} className="me-2" />
                +123 456 7890
              </li>
              <li className="mb-2">
                <Mail size={16} className="me-2" />
                info@example.com
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="row mt-5">
          <div className="col text-center">
            <p className="text-muted mb-0">&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        a.text-muted:hover {
          color: #ffffff !important; /* White color on hover */
          text-decoration: underline;
        }
        .text-muted {
          color: #a8b2d1 !important; /* Light gray for better readability */
        }
      `}</style>
    </footer>
  );
};

export default Footer;