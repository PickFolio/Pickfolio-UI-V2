import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginUser } from '../services/authService';
import { LoginPage, RegistrationPage } from '../components/AuthForms';

function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from our context

  const handleLogin = async (username, password, deviceInfo) => {
    const tokens = await loginUser(username, password, deviceInfo);
    login(tokens); // Update the global auth state
    navigate('/'); // Redirect to the homepage
  };

  if (isRegistering) {
    return (
      <RegistrationPage
        onRegisterSuccess={() => setIsRegistering(false)}
        onSwitchToLogin={() => setIsRegistering(false)}
      />
    );
  }

  return (
    <LoginPage
      onLoginSuccess={handleLogin}
      onSwitchToRegister={() => setIsRegistering(true)}
    />
  );
}

export default AuthPage;