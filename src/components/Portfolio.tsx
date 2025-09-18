import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PortfolioSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%);
  position: relative;
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

const PortfolioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const PortfolioItem = styled(motion.div)`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 4/3;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-10px);
  }
`;

const PortfolioImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const PortfolioOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.9), rgba(176, 196, 222, 0.9));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  text-align: center;
  padding: 2rem;

  h4 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #0a0a0a;
    margin-bottom: 0.5rem;
  }

  p {
    color: #0a0a0a;
    font-weight: 500;
  }

  ${PortfolioItem}:hover & {
    opacity: 1;
  }
`;

const Portfolio: React.FC = () => {
  const portfolioItems = [
    {
      image: '/images/gallery/skateboard-logo.png',
      title: 'Skateboard Brand',
      category: 'Brand Identity Design'
    },
    {
      image: '/images/gallery/beer-product.png',
      title: 'Beer Product',
      category: 'Product Design'
    },
    {
      image: '/images/gallery/kombucha-product.png',
      title: 'Kombucha Brand',
      category: 'Brand Strategy'
    },
    {
      image: '/images/gallery/skiing-logo.png',
      title: 'Skiing Brand',
      category: 'Logo Design'
    },
    {
      image: '/images/gallery/jardim-logo.png',
      title: 'Jardim Brand',
      category: 'Brand Identity'
    },
    {
      image: '/images/gallery/waterman-league-logo.png',
      title: 'Waterman League',
      category: 'Sports Branding'
    }
  ];

  return (
    <PortfolioSection id="portfolio">
      <Container>
        <SectionHeader>
          <SectionTitle
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Our Work
          </SectionTitle>
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Projects that speak for themselves
          </SectionSubtitle>
        </SectionHeader>

        <PortfolioGrid>
          {portfolioItems.map((item, index) => (
            <PortfolioItem
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <PortfolioImage>
                <img src={item.image} alt={item.title} />
                <PortfolioOverlay>
                  <h4>{item.title}</h4>
                  <p>{item.category}</p>
                </PortfolioOverlay>
              </PortfolioImage>
            </PortfolioItem>
          ))}
        </PortfolioGrid>
      </Container>
    </PortfolioSection>
  );
};

export default Portfolio;

