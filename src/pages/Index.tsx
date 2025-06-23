
import { useState } from 'react';
import { AuthSection } from '@/components/AuthSection';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  if (!isAuthenticated) {
    return <AuthSection onAuthSuccess={(userData) => {
      setIsAuthenticated(true);
      setUser(userData);
    }} />;
  }

  return <Dashboard user={user} onLogout={() => {
    setIsAuthenticated(false);
    setUser(null);
  }} />;
};

export default Index;
