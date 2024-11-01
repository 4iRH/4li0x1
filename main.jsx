import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  opacity: 0;
  animation: ${fadeIn} 1s forwards;
  animation-delay: ${props => props.delay || '0s'};
  max-width: 1200px;
  margin: 0 auto;
`;

const ProfileSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 4rem 2rem;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const GlobalStyle = createGlobalStyle`
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    color: #1d1d1f;
    -webkit-font-smoothing: antialiased;
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  max-width: 800px;
  background: rgba(255,255,255,0.9);
  border-radius: 24px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.08);
`;

const Title = styled.h1`
  color: #1d1d1f;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
`;

const ErrorMessage = styled.div`
  color: #424245;
  font-size: 1.2rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const Suggestions = styled.div`
  text-align: left;
  padding-left: 2rem;
  
  ul {
    margin: 1rem 0;
    list-style-type: none;
  }
  
  li {
    margin: 1rem 0;
    color: #424245;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    
    &:before {
      content: "•";
      color: #0071e3;
      font-weight: bold;
      margin-right: 10px;
    }
  }
`;

const ErrorCode = styled.div`
  color: #86868b;
  font-size: 0.9rem;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  &:after {
    content: "©";
    font-size: 0.8rem;
    vertical-align: super;
  }
`;

const App = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <GlobalStyle />
      <Container>
        <ErrorContainer>
          <Title>Connection Not Available</Title>
          <ErrorMessage>We're unable to establish a connection to localhost:8080</ErrorMessage>
          <Suggestions>
            Try these steps:
            <ul>
              <li>Verify your network connection is active</li>
              <li>Check your proxy settings and firewall configuration</li>
              <li>Restart your system and try again</li>
            </ul>
          </Suggestions>
          <ErrorCode>ERR_CONNECTION_REFUSED</ErrorCode>
        </ErrorContainer>
      </Container>
    </>
  );
};

// Update the rendering
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
