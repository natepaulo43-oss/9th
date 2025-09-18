import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import FuzzyText from './FuzzyText';

const BrandSection = styled.section`
  padding: 8rem 0;
  background: linear-gradient(180deg, 
    #1a1a2e 0%, 
    #16213e 25%, 
    #0a0a0a 50%, 
    #16213e 75%, 
    #1a1a2e 100%
  );
  position: relative;
  overflow: hidden;
  margin-top: -2rem;
  margin-bottom: -2rem;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
`;

const BrandContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 2;
`;

const BrandTop = styled(motion.div)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  color: #f5f5dc;
  line-height: 0.8;
`;

const BrandBottom = styled(motion.div)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  background: linear-gradient(135deg, #87ceeb, #b0c4de);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 0.8;
`;

const BackgroundElements = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
`;

const BackgroundShape = styled(motion.div)<{ variant: number }>`
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 196, 222, 0.05));
  filter: blur(60px);

  ${props => {
    switch (props.variant) {
      case 1:
        return `
          width: 400px;
          height: 400px;
          top: 20%;
          left: -10%;
        `;
      case 2:
        return `
          width: 300px;
          height: 300px;
          top: 60%;
          right: -15%;
        `;
      case 3:
        return `
          width: 200px;
          height: 200px;
          bottom: 20%;
          left: 20%;
        `;
      default:
        return '';
    }
  }}
`;

const BrandSectionComponent: React.FC = () => {

  return (
    <BrandSection>
      <BackgroundElements>
        <BackgroundShape
          variant={1}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <BackgroundShape
          variant={2}
          animate={{
            scale: [1, 0.7, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <BackgroundShape
          variant={3}
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </BackgroundElements>

      <Container>
        <BrandContent>
          <BrandTop
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <FuzzyText 
              fontSize="clamp(3rem, 8vw, 6rem)" 
              color="#f5f5dc" 
              fontWeight="700"
              baseIntensity={0.15}
              hoverIntensity={0.3}
            >
              9TH
            </FuzzyText>
          </BrandTop>
          <BrandBottom
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <FuzzyText 
              fontSize="clamp(3rem, 8vw, 6rem)" 
              color="#87ceeb" 
              fontWeight="700"
              baseIntensity={0.2}
              hoverIntensity={0.4}
            >
              FORM
            </FuzzyText>
          </BrandBottom>
        </BrandContent>
      </Container>
    </BrandSection>
  );
};

export default BrandSectionComponent;
