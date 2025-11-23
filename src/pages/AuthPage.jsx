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
      login(tokens); // Update the global auth state
      navigate('/'); // Redirect to the homepage
    } catch (error) {
      // Error handling is done in the LoginPage component's local state usually,
      // but we re-throw here if needed or let the component handle it.
      // In your structure, LoginPage handles the try/catch, so we just let it bubble up
      // or we can handle specific global errors here.
      throw error;
    }
  };

  const handleRegister = async (registrationData) => {
    // Use a promise toast for async operations
    await toast.promise(
      registerUser(registrationData.name, registrationData.username, registrationData.password),
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