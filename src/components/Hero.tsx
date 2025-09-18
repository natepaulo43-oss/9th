import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  background: linear-gradient(180deg, 
    #0a0a0a 0%, 
    #1a1a2e 40%, 
    #16213e 80%, 
    #1a1a2e 100%
  );
  overflow: hidden;
`;

const HeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const HeroTitle = styled(motion.h1)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
`;

const TitleLine = styled.span<{ highlight?: boolean }>`
  display: block;
  color: ${props => props.highlight ? '#87ceeb' : '#f5f5dc'};
  background: ${props => props.highlight ? 'linear-gradient(135deg, #87ceeb, #b0c4de)' : 'none'};
  background-clip: ${props => props.highlight ? 'text' : 'none'};
  -webkit-background-clip: ${props => props.highlight ? 'text' : 'none'};
  -webkit-text-fill-color: ${props => props.highlight ? 'transparent' : 'inherit'};
`;

const HeroDescription = styled(motion.p)`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #d3d3d3;
  max-width: 500px;
  margin: 0;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Button = styled.a<{ variant: 'primary' | 'secondary' }>`
  padding: 1rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  display: inline-block;
  text-align: center;
  min-width: 150px;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #87ceeb, #b0c4de);
    color: #0a0a0a;
    border: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(135, 206, 235, 0.4);
    }
  ` : `
    background: transparent;
    color: #f5f5dc;
    border: 2px solid #696969;

    &:hover {
      border-color: #87ceeb;
      color: #87ceeb;
      transform: translateY(-2px);
    }
  `}
`;

const HeroVisual = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoContainer = styled(motion.div)`
  position: relative;
  z-index: 2;
`;

const HeroLogo = styled.img`
  width: 100%;
  max-width: 400px;
  height: auto;
  filter: drop-shadow(0 20px 40px rgba(135, 206, 235, 0.3));
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
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.15), rgba(176, 196, 222, 0.1));
  filter: blur(40px);

  ${props => {
    switch (props.variant) {
      case 1:
        return `
          width: 300px;
          height: 300px;
          top: 10%;
          left: -10%;
        `;
      case 2:
        return `
          width: 200px;
          height: 200px;
          top: 50%;
          right: -5%;
        `;
      case 3:
        return `
          width: 150px;
          height: 150px;
          bottom: 20%;
          left: 20%;
        `;
      default:
        return '';
    }
  }}
`;

const Hero: React.FC = () => {
  return (
    <HeroSection id="home">
      <BackgroundElements>
        <BackgroundShape
          variant={1}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <BackgroundShape
          variant={2}
          animate={{
            scale: [1, 0.8, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <BackgroundShape
          variant={3}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </BackgroundElements>

      <HeroContainer>
        <HeroContent>
          <HeroTitle
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <TitleLine>Helping Businesses</TitleLine>
            <TitleLine highlight>Grow & Thrive</TitleLine>
          </HeroTitle>

          <HeroDescription
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            At 9thform we help businesses grow by creating clear and effective growth strategies. Our mission is to give brands the tools, ideas and direction they need to reach the next level.
          </HeroDescription>

          <ButtonGroup
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button variant="primary" href="#contact">
              Get Started
            </Button>
            <Button variant="secondary" href="#services">
              Our Services
            </Button>
          </ButtonGroup>
        </HeroContent>

        <HeroVisual>
          <LogoContainer
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <HeroLogo src="/images/9thform_logo_white_flame.png" alt="9th Form Logo" />
          </LogoContainer>
        </HeroVisual>
      </HeroContainer>
    </HeroSection>
  );
};

export default Hero;

