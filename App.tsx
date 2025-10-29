import React, { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

  const handleLogin = () => {
    // Placeholder logic for login
    setIsAuthenticated(true);
  };

  const handleSignup = () => {
    // Placeholder logic for signup
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return authScreen === 'login' ? (
      <LoginScreen onLogin={handleLogin} onSwitchToSignup={() => setAuthScreen('signup')} />
    ) : (
      <SignupScreen onSignup={handleSignup} onSwitchToLogin={() => setAuthScreen('login')} />
    );
  }

  return <ChatInterface />;
}
