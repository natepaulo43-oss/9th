import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const AboutSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
  position: relative;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const AboutContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const AboutText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SectionTitle = styled(motion.h2)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #f5f5dc;
  margin-bottom: 1rem;
`;

const AboutDescription = styled(motion.p)`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #d3d3d3;
  margin-bottom: 2rem;
`;

const Stats = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const Stat = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: rgba(135, 206, 235, 0.05);
  border: 1px solid rgba(135, 206, 235, 0.2);
  border-radius: 15px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(135, 206, 235, 0.4);
    transform: translateY(-5px);
  }

  h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #87ceeb, #b0c4de);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }

  p {
    color: #d3d3d3;
    font-weight: 500;
    font-size: 0.9rem;
  }
`;

const AboutVisual = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AboutImage = styled(motion.img)`
  width: 100%;
  max-width: 500px;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 212, 255, 0.2);
  }
`;


const About: React.FC = () => {
  return (
    <AboutSection id="about">
      <Container>
        <AboutContent>
          <AboutText>
            <SectionTitle
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Why Choose 9thForm?
            </SectionTitle>
            
            <AboutDescription
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              At 9thform, we go beyond building websites. We work closely with you to understand your goals and create tools that help your business grow. Every project is built with purpose, so your brand not only looks good but has the support it needs to succeed.
            </AboutDescription>

            <Stats
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Stat>
                <h3>50+</h3>
                <p>Projects Completed</p>
              </Stat>
              <Stat>
                <h3>100%</h3>
                <p>Client Satisfaction</p>
              </Stat>
              <Stat>
                <h3>3+</h3>
                <p>Years Experience</p>
              </Stat>
            </Stats>
          </AboutText>

          <AboutVisual>
            <AboutImage
              src="/images/gallery/skateboarder-photo.png"
              alt="Our Team"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            />
          </AboutVisual>
        </AboutContent>
      </Container>
    </AboutSection>
  );
};

export default About;

