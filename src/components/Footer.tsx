import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const FooterSection = styled.footer`
  background: #000000;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4rem 0 2rem;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 4rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FooterBrand = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  img {
    height: 40px;
    width: 50px;
    filter: brightness(0) invert(1);
    margin-bottom: 1rem;
  }

  p {
    color: #d3d3d3;
    line-height: 1.6;
    max-width: 300px;
  }
`;

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FooterLinkSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h4 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #f5f5dc;
    margin-bottom: 0.5rem;
  }

  a {
    color: #d3d3d3;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;

    &:hover {
      color: #87ceeb;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  background: rgba(135, 206, 235, 0.1);
  border: 1px solid rgba(135, 206, 235, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d3d3d3;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #87ceeb, #b0c4de);
    color: #0a0a0a;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(135, 206, 235, 0.4);
  }

  i {
    font-size: 1.1rem;
  }
`;

const FooterBottom = styled(motion.div)`
  border-top: 1px solid rgba(135, 206, 235, 0.2);
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;

  p {
    color: #d3d3d3;
    font-size: 0.9rem;
    margin: 0;
  }
`;

const FooterLegal = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;

  a {
    color: #d3d3d3;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s ease;

    &:hover {
      color: #87ceeb;
    }
  }
`;

const Footer: React.FC = () => {
  return (
    <FooterSection>
      <Container>
        <FooterContent>
          <FooterBrand
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <img src="/images/9thform_logo_white.png" alt="9th Form" />
            <p>Helping businesses grow through strategic design and innovation.</p>
          </FooterBrand>

          <FooterLinks>
            <FooterLinkSection>
              <h4>Services</h4>
              <a href="#services">Growth Strategy</a>
              <a href="#services">Brand Building</a>
              <a href="#services">Innovation</a>
            </FooterLinkSection>

            <FooterLinkSection>
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#portfolio">Portfolio</a>
              <a href="#contact">Contact</a>
            </FooterLinkSection>

            <FooterLinkSection>
              <h4>Connect</h4>
              <SocialLinks>
                <SocialLink href="#" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </SocialLink>
                <SocialLink href="#" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </SocialLink>
                <SocialLink href="#" aria-label="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </SocialLink>
                <SocialLink href="#" aria-label="Dribbble">
                  <i className="fab fa-dribbble"></i>
                </SocialLink>
              </SocialLinks>
            </FooterLinkSection>
          </FooterLinks>
        </FooterContent>

        <FooterBottom
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <p>&copy; 2025 9th Form. All rights reserved.</p>
          <p>We're working on something great. Stay tuned!</p>
          <FooterLegal>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </FooterLegal>
        </FooterBottom>
      </Container>
    </FooterSection>
  );
};

export default Footer;

