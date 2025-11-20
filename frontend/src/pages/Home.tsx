import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';

declare global {
  interface Window {
    Sirv?: {
      start: () => void;
    };
  }
}

const Home: React.FC = () => {
  const logoRef = useRef<HTMLDivElement>(null);
  const sirvContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (logoRef.current) {
        const scrolled = window.scrollY;
        const rotation = scrolled * 2.5;
        logoRef.current.style.transform = `rotateY(${rotation}deg)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const scriptSrc = 'https://scripts.sirv.com/sirvjs/v3/sirv.js';
    const triggerSirv = () => {
      if (window.Sirv?.start && sirvContainerRef.current) {
        window.Sirv.start();
      }
    };

    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;

    if (existingScript) {
      triggerSirv();
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.onload = triggerSirv;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  return (
    <div className="home-page" style={{ minHeight: '100vh', paddingTop: '80px' }}>
      {/* Hero Section with Rotating 3D Logo */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.div
            className="logo-3d-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="logo-3d" ref={logoRef}>
              <div className="logo-face logo-front">
                <img
                  src="/images/9thform_logo_white.png"
                  alt="9thform Logo"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo1.png';
                  }}
                />
              </div>
              <div className="logo-face logo-back">
                <img
                  src="/images/9thform_logo_white_flame.png"
                  alt="9thform Logo"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo1.png';
                  }}
                />
              </div>
              <div className="logo-face logo-right">
                <img
                  src="/images/cream_logo.png"
                  alt="9thform Logo"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo1.png';
                  }}
                />
              </div>
              <div className="logo-face logo-left">
                <img
                  src="/images/Surflogo.png"
                  alt="9thform Logo"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo1.png';
                  }}
                />
              </div>
              <div className="logo-face logo-top"></div>
              <div className="logo-face logo-bottom"></div>
            </div>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            9THFORM
            <br />
          </motion.h1>
        </div>

        <div className="hero-scroll-indicator">
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <div className="scroll-line"></div>
            <span>Scroll</span>
          </motion.div>
        </div>
      </section>

      {/* Shop CTA Section */}
      <motion.section
        className="shop-cta-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        <div className="cta-content">
          <h2 className="cta-title">EXPLORE THE COLLECTION</h2>
          <p className="cta-description">
            Premium apparel designed for those who stay in motion.
          </p>
          <Link to="/shop" className="cta-button">
            SHOP NOW
          </Link>
          <div className="cta-sirv-wrapper" ref={sirvContainerRef}>
            <div
              className="Sirv"
              data-src="https://nate1227.sirv.com/hat%20falling/hat%20no%20bcg/Hat%20360/Hat%20360.spin"
            ></div>
          </div>
        </div>
      </motion.section>

      {/* Brand Visual Section */}
      <section className="brand-visual-section">
        <motion.div
          className="visual-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1 }}
        >
          <div className="visual-item">
            <div className="visual-placeholder">
              <img src="/images/Thrown.JPG" alt="Hat thrown" />
            </div>
          </div>
          <div className="visual-item">
            <div className="visual-placeholder">
              <img src="/images/behind_hat.JPG" alt="Rider wearing 9thform hat" />
            </div>
          </div>
          <div className="visual-item">
            <div className="visual-placeholder">
              <img src="/images/Tree_shoot.PNG" alt="Dynamic jump shot" />
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;

