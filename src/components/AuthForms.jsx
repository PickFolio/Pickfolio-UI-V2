import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, BadgeCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';

const hasErrors = (errors) => Object.values(errors).some(Boolean);

const validateLogin = ({ username, password }) => ({
  username: username.trim() ? '' : 'Enter your username.',
  password: password ? '' : 'Enter your password.',
});

const validateRegister = ({ name, username, password }) => ({
  name: name.trim() ? '' : 'Enter your full name.',
  username: username.trim().length >= 3 ? '' : 'Username must be at least 3 characters.',
  password: password.length >= 6 ? '' : 'Password must be at least 6 characters.',
});

function AuthFrame({ title, subtitle, children, switchText, switchAction, switchLabel }) {
  return (
    <main className="auth-page">
      <div className="container auth-grid">
        <Motion.section
          className="card auth-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <div className="stack" style={{ gap: 'var(--space-6)' }}>
            <div className="stack">
              <span className="brand-mark" aria-hidden="true">P</span>
              <div>
                <p className="eyebrow">Pickfolio</p>
                <h1 className="auth-title">{title}</h1>
                <p className="muted" style={{ margin: 'var(--space-3) 0 0' }}>{subtitle}</p>
              </div>
            </div>
            {children}
            <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
              {switchText}{' '}
              <button type="button" className="btn btn-ghost btn-sm" onClick={switchAction}>
                {switchLabel}
              </button>
            </p>
          </div>
        </Motion.section>

        <aside className="card auth-aside">
          <div className="stack">
            <BadgeCheck size={34} color="white" />
            <h1>Build a portfolio before the clock runs out.</h1>
            <p>Join contests, invite friends, trade live Indian equities, and climb a real-time leaderboard.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

export const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsLoading(true);
    setServerError('');
    try {
      await onLoginSuccess(form.username.trim(), form.password, 'WebApp');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFrame
      title="Welcome back."
      subtitle="Sign in to view your contests, portfolio, and live leaderboard."
      switchText="New to Pickfolio?"
      switchAction={onSwitchToRegister}
      switchLabel="Create account"
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {serverError ? <div className="alert alert-error">{serverError}</div> : null}
        <FormField id="username" label="Username" error={errors.username} inputProps={{ value: form.username, onChange: update('username'), autoComplete: 'username', placeholder: 'trader01' }} />
        <FormField id="password" label="Password" error={errors.password} inputProps={{ type: 'password', value: form.password, onChange: update('password'), autoComplete: 'current-password', placeholder: 'Your password' }} />
        <Button type="submit" className="btn-block" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'} <ArrowRight size={18} />
        </Button>
      </form>
    </AuthFrame>
  );
};

export const RegistrationPage = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsLoading(true);
    setServerError('');
    try {
      await onRegisterSuccess({ name: form.name.trim(), username: form.username.trim(), password: form.password });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFrame
      title="Create your account."
      subtitle="Start with virtual cash and compete on decisions, timing, and discipline."
      switchText="Already registered?"
      switchAction={onSwitchToLogin}
      switchLabel="Sign in"
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {serverError ? <div className="alert alert-error">{serverError}</div> : null}
        <FormField id="name" label="Full name" error={errors.name} inputProps={{ value: form.name, onChange: update('name'), autoComplete: 'name', placeholder: 'Aarav Sharma' }} />
        <FormField id="reg-username" label="Username" error={errors.username} inputProps={{ value: form.username, onChange: update('username'), autoComplete: 'username', placeholder: 'aarav' }} />
        <FormField id="reg-password" label="Password" error={errors.password} inputProps={{ type: 'password', value: form.password, onChange: update('password'), autoComplete: 'new-password', placeholder: 'Minimum 6 characters' }} />
        <Button type="submit" className="btn-block" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create account'} <LockKeyhole size={18} />
        </Button>
      </form>
    </AuthFrame>
  );
};
