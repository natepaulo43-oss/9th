import React from 'react';
import styled from 'styled-components';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrandSection from './components/BrandSection';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

function App() {
  return (
    <AppContainer>
      <Navbar />
      <Hero />
      <BrandSection />
      <Services />
      <Portfolio />
      <About />
      <Contact />
      <Footer />
    </AppContainer>
  );
}

export default App;

