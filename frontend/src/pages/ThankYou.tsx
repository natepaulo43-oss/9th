import React from 'react';
import { motion } from 'framer-motion';
import './ThankYou.css';
import { Link } from 'react-router-dom';

const ThankYou: React.FC = () => {
  return (
    <div className="thankyou-page">
      <motion.div
        className="thankyou-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="success-icon"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
        >
          <span>✔</span>
        </motion.div>
        <h1>Order Confirmed</h1>
        <p>
          Thank you for supporting 9thform. Your payment is complete and an order confirmation has been
          sent to your email.
        </p>
        <div className="thankyou-actions">
          <Link to="/shop" className="thankyou-btn">
            Back to Shop
          </Link>
          <Link to="/" className="thankyou-btn secondary">
            Explore Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ThankYou;
