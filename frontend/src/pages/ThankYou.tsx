import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './ThankYou.css';
import { Link, useSearchParams } from 'react-router-dom';

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  if (window.location.hostname === 'localhost') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Production traffic stays same-origin and is proxied via Netlify redirects.
  return '';
};

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

const ThankYou: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyOrder = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/stripe/verify-session'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Order verification failed:', data.error);
          setError(data.error);
        } else {
          console.log('Order verified successfully:', data);
        }
      } catch (err) {
        console.error('Error verifying order:', err);
        setError('Failed to verify order');
      } finally {
        setVerifying(false);
      }
    };

    verifyOrder();
  }, [searchParams]);

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
        {verifying && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Processing your order...
          </p>
        )}
        {error && (
          <p style={{ fontSize: '14px', color: '#ff6b6b', marginTop: '10px' }}>
            Note: There was an issue processing your order details, but your payment was successful. 
            Please contact support if you don't receive a confirmation email.
          </p>
        )}
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
