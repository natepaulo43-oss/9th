import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ContactSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
  position: relative;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const ContactContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SectionTitle = styled(motion.h2)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
`;

const ContactDescription = styled(motion.p)`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #cccccc;
  margin-bottom: 2rem;
`;

const ContactDetails = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(135, 206, 235, 0.05);
  border: 1px solid rgba(135, 206, 235, 0.2);
  border-radius: 15px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(135, 206, 235, 0.4);
    transform: translateX(10px);
  }

  i {
    font-size: 1.2rem;
    color: #87ceeb;
    width: 20px;
  }

  span {
    color: #f5f5dc;
    font-weight: 500;
  }
`;

const ContactForm = styled(motion.form)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(135, 206, 235, 0.05);
  border: 1px solid rgba(135, 206, 235, 0.2);
  border-radius: 20px;
  padding: 2.5rem;
  backdrop-filter: blur(10px);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 1rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;

  &::placeholder {
    color: #888888;
  }

  &:focus {
    outline: none;
    border-color: #87ceeb;
    box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
  }
`;

const Select = styled.select`
  padding: 1rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #87ceeb;
    box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const TextArea = styled.textarea`
  padding: 1rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;

  &::placeholder {
    color: #888888;
  }

  &:focus {
    outline: none;
    border-color: #87ceeb;
    box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
  }
`;

const Button = styled.button<{ fullWidth?: boolean }>`
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #87ceeb, #b0c4de);
  color: #0a0a0a;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  ${props => props.fullWidth ? 'width: 100%;' : ''}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(135, 206, 235, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    time: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <ContactSection id="contact">
      <Container>
        <ContactContent>
          <ContactInfo>
            <SectionTitle
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Get in Touch
            </SectionTitle>
            
            <ContactDescription
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Ready to grow your business? Reach out and let's discuss how we can help 
              you achieve your goals.
            </ContactDescription>

            <ContactDetails
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <ContactItem>
                <i className="fas fa-envelope"></i>
                <span>hello@9thform.com</span>
              </ContactItem>
              <ContactItem>
                <i className="fas fa-phone"></i>
                <span>+1 (720) 557-9316</span>
              </ContactItem>
              <ContactItem>
                <i className="fas fa-map-marker-alt"></i>
                <span>Winter Park, FL</span>
              </ContactItem>
            </ContactDetails>
          </ContactInfo>

          <ContactForm
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
          >
            <FormGroup>
              <Input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Input
                type="tel"
                name="phone"
                placeholder="Your Phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Select
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              >
                <option value="">Best time to reach out</option>
                <option value="morning">Morning (9AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <TextArea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <Button type="submit" fullWidth>
              Send Message
            </Button>
          </ContactForm>
        </ContactContent>
      </Container>
    </ContactSection>
  );
};

export default Contact;

