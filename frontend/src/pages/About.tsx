import React from 'react';
import { motion } from 'framer-motion';
import './About.css';

const About: React.FC = () => {
  const sections = [
    {
      title: 'WHO WE ARE',
      content: '9thform is an action sports apparel brand born from the streets, waves, and mountains. We create premium gear for those who live life on the edge and push boundaries every day.',
    },
    {
      title: 'OUR MISSION',
      content: 'To deliver high-quality, stylish apparel that embodies the spirit of action sports culture. We believe in authenticity, quality craftsmanship, and designs that speak to the heart of the action sports community.',
    },
    {
      title: 'OUR VISION',
      content: 'To become a leading voice in action sports fashion, inspiring athletes and enthusiasts worldwide through innovative design and uncompromising quality.',
    },
    {
      title: 'INSPIRATION',
      content: 'Drawing from the raw energy street culture, the freedom of surfing, and the thrill of snow sports, 9thform captures the essence of action sports culture in every piece we create.',
    },
  ];

  const visualAsset = {
    src: '/images/longways_frog.jpg',
    alt: '9thform brand graphic',
  };

  return (
    <div className="about-page">
      <div className="about-header">
        <motion.h1
          className="about-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          ABOUT
        </motion.h1>
      </div>

      <div className="about-body">
        <div className="about-content">
          {sections.map((section, index) => (
            <motion.section
              key={index}
              className="about-section"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <h2 className="section-title">{section.title}</h2>
              <p className="section-content">{section.content}</p>
            </motion.section>
          ))}
        </div>

        <motion.div
          className="about-visual"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
        >
          <div className="visual-block">
            <img
              className="visual-image"
              src={visualAsset.src}
              alt={visualAsset.alt}
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;

