import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';
import ThankYou from './pages/ThankYou';
import Policies from './pages/Policies';

function App() {
  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/shipping" element={<Policies defaultSection="shipping" />} />
            <Route path="/terms" element={<Policies defaultSection="terms" />} />
            <Route path="/privacy" element={<Policies defaultSection="privacy" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

