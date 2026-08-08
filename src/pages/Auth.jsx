import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Squares from '../components/reactbits/Squares/Squares';
import TargetCursor from '../components/reactbits/TargetCursor/TargetCursor';
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
      {/* Scoreboard grid */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-95">
        <Squares
          direction="right"
          speed={1.2}
          squareSize={44}
          borderColor="rgba(233, 240, 234, 0.14)"
          hoverFillColor="rgba(245, 165, 36, 0.16)"
        />
      </div>
      {/* Floodlights removed */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,var(--bg-primary)_90%)]" />

      <SpotlightCard
        spotlightColor="rgba(245, 165, 36, 0.09)"
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative flex flex-col gap-6 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 p-8">
          {/* Scoreboard frame line */}
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent_5%,var(--accent-amber)_50%,transparent_95%)]" />

          {/* Brand */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
              Predict Arena
            </h1>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Predict the future. Climb the ranks.
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            className="grid grid-cols-2 gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-0.5"
            role="tablist"
          >
            <button
              className={`flex items-center justify-center gap-2 rounded-[3px] px-4 py-3 font-heading text-sm font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-[var(--accent-amber)] text-[#0B0E0C]'
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
              className={`flex items-center justify-center gap-2 rounded-[3px] px-4 py-3 font-heading text-sm font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                tab === 'signup'
                  ? 'bg-[var(--accent-amber)] text-[#0B0E0C]'
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
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-no-border)] bg-[var(--color-no-muted)] px-4 py-3 text-center font-mono text-sm leading-snug text-[var(--color-no)]">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!configured}
              className="w-full"
            >
              {tab === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          {!configured && (
            <div className="rounded-[var(--radius-sm)] border border-[rgba(245,165,36,0.25)] bg-[var(--color-warning-muted)] p-3 text-center">
              <p className="font-mono text-xs text-warning">
                Supabase not configured. Create a <code>.env</code> file with your project keys.
              </p>
            </div>
          )}
        </div>
      </SpotlightCard>
      <TargetCursor
        targetSelector=".card, button, a, [role='button'], input, select, textarea"
        cursorColor="#f5a524"
        cursorColorOnTarget="#22c55e"
        spinDuration={2.4}
      />
    </div>
  );
}
