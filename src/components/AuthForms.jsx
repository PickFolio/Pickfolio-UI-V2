import { useState } from 'react';
import styles from './AuthForms.module.css';

export const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // We'll call the onLoginSuccess function passed from AuthPage
            await onLoginSuccess(username, password, "WebApp");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authBox}>
                <div className={styles.header}>
                    <h1 className={styles.title}>PickFolio</h1>
                    <p className={styles.subtitle}>Log in to join the battle.</p>
                </div>
                <div className={styles.formBox}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className={styles.error}>{error}</div>}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="username">Username</label>
                            <input className={styles.input} type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">Password</label>
                            <input className={styles.input} type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={isLoading} className={styles.button}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                 <p className={styles.switchText}>
                    Don't have an account? 
                    <button onClick={onSwitchToRegister} className={styles.switchButton}> Sign Up</button>
                </p>
            </div>
        </div>
    );
};


export const RegistrationPage = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
       e.preventDefault();
       setIsLoading(true);
       setError(null);
       try {
           const response = await fetch(`${AUTH_API_URL}/register`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ name, username, password }),
           });
           if (!response.ok) {
               const data = await response.json();
               throw new Error(data.message || 'Registration failed');
           }
           onRegisterSuccess();
       } catch (err) {
           setError(err.message);
       } finally {
           setIsLoading(false);
       }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authBox}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Join the battle today.</p>
                </div>
                <div className={styles.formBox}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className={styles.error}>{error}</div>}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="name">Full Name</label>
                            <input className={styles.input} type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="reg-username">Username</label>
                            <input className={styles.input} type="text" id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="reg-password">Password</label>
                            <input className={styles.input} type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={isLoading} className={styles.button}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
                 <p className={styles.switchText}>
                    Already have an account?
                    <button onClick={onSwitchToLogin} className={styles.switchButton}> Log In</button>
                </p>
            </div>
        </div>
    );
};