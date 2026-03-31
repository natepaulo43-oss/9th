import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseEnabled } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isFirebaseEnabled || !auth) {
      setError('Firebase authentication is not configured. Please contact the administrator.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>Admin Login</Title>
        <Subtitle>9thform Order Management</Subtitle>
        
        <Form onSubmit={handleLogin}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@9thform.com"
              required
              disabled={loading}
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </InputGroup>

          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </LoginButton>
        </Form>
      </LoginCard>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" fill="%23000000"/%3E%3Cpath d="M0 0h1v1H0z" fill="%23ffffff" opacity="0.03"/%3E%3C/svg%3E');
    opacity: 0.4;
    pointer-events: none;
  }
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(25px);
  padding: 48px;
  width: 100%;
  max-width: 420px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.07), transparent 60%);
    opacity: 0.8;
    pointer-events: none;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
`;

const Title = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 8px 0;
  color: #ffffff;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #888888;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 32px 0;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #ffffff;
`;

const Input = styled.input`
  padding: 12px 16px;
  font-size: 15px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #888888;
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.02);
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoginButton = styled.button`
  padding: 14px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: #ffffff;
  border: 2px solid #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    transition: left 0.3s ease;
    z-index: -1;
  }

  &:hover:not(:disabled) {
    color: #ffffff;
  }
  
  &:hover:not(:disabled)::before {
    left: 0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  font-size: 14px;
`;

export default AdminLogin;
