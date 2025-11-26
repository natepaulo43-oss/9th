import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Instagram', url: 'https://instagram.com/9thform', icon: 'fab fa-instagram' },
    { name: 'Email', url: 'mailto:contact@9thform.com', icon: 'fas fa-envelope' },
    { name: 'Etsy', url: 'https://etsy.com/shop/9thform', icon: 'fab fa-etsy' },
  ];

  const policyLinks = [
    { path: '/contact', label: 'Contact' },
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/shipping', label: 'Shipping Policy' },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-logo">9THFORM</h3>
            <p className="footer-tagline">Action Sports Apparel</p>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4>Connect</h4>
              <div className="social-links">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.name}
                  >
                    <i className={link.icon}></i>
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-section">
              <h4>Policies</h4>
              <ul className="policy-links">
                {policyLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} 9thform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

