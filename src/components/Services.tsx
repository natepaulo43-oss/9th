import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ServicesSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(180deg, 
    #1a1a2e 0%, 
    #16213e 30%, 
    #0a0a0a 70%, 
    #000000 100%
  );
  position: relative;
  margin-top: -2rem;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const SectionTitle = styled(motion.h2)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #f5f5dc;
  margin-bottom: 1rem;
`;

const SectionSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: #d3d3d3;
  max-width: 600px;
  margin: 0 auto;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const ServiceCard = styled(motion.div)`
  background: rgba(135, 206, 235, 0.05);
  border: 1px solid rgba(135, 206, 235, 0.2);
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #87ceeb, #b0c4de);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-10px);
    border-color: rgba(135, 206, 235, 0.4);
    box-shadow: 0 20px 40px rgba(135, 206, 235, 0.15);

    &::before {
      transform: scaleX(1);
    }
  }
`;

const ServiceIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #87ceeb, #b0c4de);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }
`;

const ServiceTitle = styled.h3`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #f5f5dc;
  margin-bottom: 1rem;
`;

const ServiceDescription = styled.p`
  color: #d3d3d3;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const ServiceFeatures = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

const FeatureTag = styled.span`
  background: rgba(135, 206, 235, 0.15);
  color: #87ceeb;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(135, 206, 235, 0.3);
`;

const Services: React.FC = () => {
  const services = [
    {
      icon: '/images/9thform_logo_all_white_transparent_text_v3.png',
      title: 'Business Growth Strategy',
      description: 'We work closely with you to design a roadmap that unlocks your potential and charts a path toward sustainable growth.',
      features: ['Strategic Planning', 'Market Analysis', 'Growth Metrics']
    },
    {
      icon: '/images/9thform_logo_all_white_transparent_text_v3.png',
      title: 'Brand Building',
      description: 'We help you craft an authentic brand identity that resonates with your audience and sets you apart from the competition.',
      features: ['Brand Identity', 'Visual Design', 'Brand Strategy']
    },
    {
      icon: '/images/9thform_logo_all_white_transparent_text_v3.png',
      title: 'Innovation & Creativity',
      description: 'We encourage innovative thinking and deliver creative solutions to keep your business ahead of the curve.',
      features: ['Creative Solutions', 'Innovation Labs', 'Future Planning']
    }
  ];

  return (
    <ServicesSection id="services">
      <Container>
        <SectionHeader>
          <SectionTitle
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            What We Do
          </SectionTitle>
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Strategic solutions for modern businesses
          </SectionSubtitle>
        </SectionHeader>

        <ServicesGrid>
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <ServiceIcon>
                <img src={service.icon} alt={service.title} />
              </ServiceIcon>
              <ServiceTitle>{service.title}</ServiceTitle>
              <ServiceDescription>{service.description}</ServiceDescription>
              <ServiceFeatures>
                {service.features.map((feature, featureIndex) => (
                  <FeatureTag key={featureIndex}>{feature}</FeatureTag>
                ))}
              </ServiceFeatures>
            </ServiceCard>
          ))}
        </ServicesGrid>
      </Container>
    </ServicesSection>
  );
};

export default Services;

