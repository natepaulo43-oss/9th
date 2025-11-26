import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Contact.css';

type FormState = {
  name: string;
  email: string;
  message: string;
  'bot-field': string;
};

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: '',
    'bot-field': '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const formName = 'contact';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formBody = new URLSearchParams({
        'form-name': formName,
        ...formData,
      }).toString();

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        message: '',
        'bot-field': '',
      });

      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Netlify form submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { name: 'Instagram', url: 'https://instagram.com/9thform', icon: 'fab fa-instagram' },
    { name: 'Email', url: 'mailto:hello@9thform.com,natepaulo43@gmail.com', icon: 'fas fa-envelope' },
    { name: 'Etsy', url: 'https://etsy.com/shop/9thform', icon: 'fab fa-etsy' },
  ];

  return (
    <div className="contact-page">
      <div className="contact-header">
        <motion.h1
          className="contact-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          CONTACT
        </motion.h1>
        <motion.p
          className="contact-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Get in touch with us
        </motion.p>
      </div>

      <div className="contact-content">
        <motion.div
          className="contact-form-container"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <form
            className="contact-form"
            name={formName}
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value={formName} />
            <div hidden>
              <label htmlFor="bot-field">
                Don’t fill this out if you’re human
                <input
                  id="bot-field"
                  name="bot-field"
                  value={formData['bot-field']}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Your message..."
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
            </button>

            {submitStatus === 'success' && (
              <motion.p
                className="submit-message success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Message sent successfully!
              </motion.p>
            )}

            {submitStatus === 'error' && (
              <motion.p
                className="submit-message error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Something went wrong. Please try again.
              </motion.p>
            )}
          </form>
        </motion.div>

        <motion.div
          className="contact-info"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="info-section">
            <h2 className="info-title">CONNECT WITH US</h2>
            <p className="info-description">
              Follow us on social media or reach out directly via email.
            </p>

            <div className="social-links">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <i className={link.icon}></i>
                  <span>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;

