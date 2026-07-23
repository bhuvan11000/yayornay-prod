import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Github, Chrome, LogIn, UserPlus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import styles from './Auth.module.css';

/**
 * Auth — Login / Sign Up page.
 *
 * Supports:
 * - Email + password authentication
 * - Google OAuth
 * - GitHub OAuth
 *
 * Redirects to / on successful authentication.
 */
export default function Auth() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect home
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const configured = isSupabaseConfigured();

  /**
   * Handle email + password sign in.
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!configured) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      // Auth store's onAuthStateChange handler will pick up the session
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle email + password sign up.
   */
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!configured) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      // Show confirmation message if email confirmation is enabled
      setError(''); // clear any previous error
      setTab('login'); // switch to login tab
      alert('Check your email for the confirmation link!');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OAuth sign in (Google or GitHub).
   */
  const handleOAuthSignIn = async (provider) => {
    if (!configured) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <h1 className={styles.logo}>Predict Arena</h1>
          <p className={styles.subtitle}>Predict the future. Climb the ranks.</p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
            role="tab"
            aria-selected={tab === 'login'}
          >
            <LogIn size={16} />
            Login
          </button>
          <button
            className={`${styles.tab} ${tab === 'signup' ? styles.tabActive : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
            role="tab"
            aria-selected={tab === 'signup'}
          >
            <UserPlus size={16} />
            Sign Up
          </button>
        </div>

        {/* OAuth Buttons */}
        <div className={styles.oauthButtons}>
          <button
            className={styles.oauthButton}
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
          >
            <Chrome size={18} />
            Continue with Google
          </button>
          <button
            className={styles.oauthButton}
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
          >
            <Github size={18} />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <span className={styles.dividerLine} />
        </div>

        {/* Email Form */}
        <form className={styles.form} onSubmit={tab === 'login' ? handleEmailLogin : handleEmailSignUp}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText={tab === 'signup' ? 'At least 6 characters' : undefined}
          />

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!configured}
            className={styles.submitButton}
          >
            {tab === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        {!configured && (
          <div className={styles.configWarning}>
            <p className="text-xs text-warning">
              Supabase not configured. Create a <code>.env</code> file with your project keys.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
