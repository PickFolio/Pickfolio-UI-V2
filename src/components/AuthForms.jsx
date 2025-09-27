import { useState } from 'react';

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
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1 className="app-title">PickFolio</h1>
                    <p className="subtitle">Log in to join the battle.</p>
                </div>

                <div className="login-box">
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username</label>
                            <input
                                className="form-input"
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="submit-button"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="register-link">
                    Don't have an account?{" "}
                    <button onClick={onSwitchToRegister} className="register-button">
                        Sign Up
                    </button>
                </p>
            </div>
        </div>

    );
};

// You can copy your RegistrationPage component here as well, structured similarly
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
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
           <div className="w-full max-w-sm">
               <div className="text-center mb-8">
                   <h1 className="text-4xl font-black text-teal-400">PickFolio</h1>
                   <p className="text-gray-400 mt-2">Create your account.</p>
               </div>
               <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
                   <form onSubmit={handleSubmit}>
                       {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                       <div className="mb-4">
                           <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                           <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                       </div>
                       <div className="mb-4">
                           <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="reg-username">Username</label>
                           <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full" type="text" id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                       </div>
                       <div className="mb-6">
                           <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="reg-password">Password</label>
                           <input className="bg-gray-700 text-white focus:outline-none focus:shadow-outline border border-gray-600 rounded-lg py-3 px-4 block w-full" type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                       </div>
                       <button type="submit" disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-teal-800">
                           {isLoading ? 'Creating Account...' : 'Create Account'}
                       </button>
                   </form>
               </div>
                <p className="text-center text-gray-500 text-sm mt-6">
                   Already have an account? <button onClick={onSwitchToLogin} className="text-teal-400 hover:text-teal-300 font-bold">Log In</button>
               </p>
           </div>
       </div>
    );
};
