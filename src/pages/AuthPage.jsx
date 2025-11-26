import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginUser, registerUser } from '../services/authService';
import { LoginPage, RegistrationPage } from '../components/AuthForms';
import toast from 'react-hot-toast';

function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (username, password, deviceInfo) => {
    try {
      const tokens = await loginUser(username, password, deviceInfo);
      login(tokens);
      navigate('/');
    } catch (error) {
      throw error;
    }
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

  // Prevent flashing the login form while redirecting
  if (isLoggedIn) return null;

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