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

  const handleRegister = async (registrationData) => {
    // Use a promise toast for async operations
    await toast.promise(
      registerUser(registrationData),
      {
        loading: 'Creating account...',
        success: () => {
          setIsRegistering(false); // Switch to login on success
          return <b>Registration successful! Please log in.</b>;
        },
        error: (err) => <b>{err.message || 'Registration failed.'}</b>,
      }
    );
  };

  if (isRegistering) {
    return (
      <RegistrationPage
        onRegisterSuccess={handleRegister}
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