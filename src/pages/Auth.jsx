import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import ClickSpark from '../components/reactbits/ClickSpark/ClickSpark';
import Aurora from '../components/reactbits/Aurora/Aurora';
import BlurText from '../components/reactbits/BlurText/BlurText';
import SpotlightCard from '../components/reactbits/SpotlightCard/SpotlightCard';

/**
 * Auth — Login / Sign Up page.
 *
 * Supports email + password authentication.
 * OAuth providers can be added later via Supabase.
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
      setError('');
      setTab('login');
      alert('Check your email for the confirmation link!');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] p-4">
      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <Aurora colorStops={['#4f7df5', '#a855f7', '#22c55e']} amplitude={1} blend={0.6} speed={0.8} />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--bg-primary)_85%)]" />

      <SpotlightCard
        spotlightColor="rgba(79, 125, 245, 0.18)"
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col gap-6 bg-[var(--bg-secondary)]/90 p-8">
          {/* Brand */}
          <div className="flex flex-col items-center gap-2 text-center">
            <BlurText
              text="Predict Arena"
              delay={120}
              animateBy="words"
              direction="top"
              className="font-heading text-2xl font-bold tracking-tight text-[var(--text-primary)]"
            />
            <p className="text-sm text-[var(--text-secondary)]">
              Predict the future. Climb the ranks.
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            className="grid grid-cols-2 gap-0.5 rounded-lg bg-[var(--bg-tertiary)] p-0.5"
            role="tablist"
          >
            <button
              className={`flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-sm font-medium transition-colors font-body cursor-pointer ${
                tab === 'login'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => { setTab('login'); setError(''); }}
              role="tab"
              aria-selected={tab === 'login'}
            >
              <LogIn size={16} />
              Login
            </button>
            <button
              className={`flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-sm font-medium transition-colors font-body cursor-pointer ${
                tab === 'signup'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => { setTab('signup'); setError(''); }}
              role="tab"
              aria-selected={tab === 'signup'}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          {/* Email Form */}
          <form
            className="flex flex-col gap-4"
            onSubmit={tab === 'login' ? handleEmailLogin : handleEmailSignUp}
          >
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
              <div className="rounded-lg border border-[var(--color-no-border)] bg-[var(--color-no-muted)] px-4 py-3 text-center text-sm leading-snug text-[var(--color-no)]">
                {error}
              </div>
            )}

            <ClickSpark
              sparkColor="#4f7df5"
              className="relative w-full"
            >
              <Button
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!configured}
                className="w-full"
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </ClickSpark>
          </form>

          {!configured && (
            <div className="rounded-lg border border-[rgba(245,158,11,0.2)] bg-[var(--color-warning-muted)] p-3 text-center">
              <p className="text-xs text-warning">
                Supabase not configured. Create a <code>.env</code> file with your project keys.
              </p>
            </div>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
}
