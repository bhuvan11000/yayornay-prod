import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Beams from '../components/reactbits/Beams/Beams';
import TargetCursor from '../components/reactbits/TargetCursor/TargetCursor';

/**
 * Auth — Login / Sign Up page.
 *
 * Supports email + password authentication.
 * OAuth providers can be added later via Supabase.
 *
 * Redirects to / on successful authentication.
 */

const RULES = [
  { step: '01', title: 'Browse markets', desc: 'Fresh questions drop every day: sports, tech, pop culture, politics, memes. Read the criteria, check the odds, find your angle.' },
  { step: '02', title: 'Place your prediction', desc: 'Put coins on the side you believe in. The crowd\'s money moves the odds in real time, so every call shifts the market.' },
  { step: '03', title: 'Earn rewards', desc: 'Call it right and you win coins + XP, plus streak and quest bonuses. Wrong? You only lose what you risked.' },
  { step: '04', title: 'Climb the ranks', desc: 'Rise from Unranked to Analyst, Strategist, Forecaster, Visionary, Prophet and Omniscient. Every season, the race starts over.' },
  { step: '05', title: 'Community markets', desc: 'Got a hot question of your own? Propose it, stake coins, and win the crowd. Top proposals go live as real markets.' },
];

const formVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function Auth() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative flex min-h-screen bg-[var(--bg-primary)]">
      {/* ── Left Panel: Brand Hero ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--border-subtle)] bg-black lg:flex lg:w-[52%]">
        {/* Beams background — same as Home jumbotron */}
        <div className="absolute inset-0 opacity-100">
          <Beams beamNumber={8} lightColor="#f5a524" speed={1.4} noiseIntensity={1.2} scale={0.18} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />

        {/* Top amber accent line */}
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_10%,var(--accent-amber)_50%,transparent_90%)]" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-12 xl:px-16">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex size-10 items-center justify-center bg-[var(--accent-amber)] font-heading text-lg font-bold text-[#0B0E0C]">
              Y/N
            </div>
            <span className="font-heading text-lg font-bold tracking-[0.06em]">
              <span className="text-[var(--color-yes)]">Yay</span>
              <span className="mx-1 text-[var(--accent-amber)]">or</span>
              <span className="text-[var(--color-no)]">Nay</span>
            </span>
          </div>

          {/* How It Works */}
          <div className="flex items-center gap-2.5 mb-6">
            <span className="mb-[2px] inline-block size-1.5 bg-[var(--accent-amber)]" />
            <div>
              <p className="eyebrow">The rules</p>
              <h1 className="font-heading text-xl font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
                How It Works
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-[1px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--border-subtle)]">
            {RULES.map((rule, i) => (
              <motion.div
                key={rule.step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.2, duration: 0.3 }}
                className="flex gap-4 bg-[var(--bg-secondary)]/90 px-5 py-4"
              >
                <span className="font-mono text-xs font-semibold text-[var(--accent-amber)] pt-0.5">{rule.step}</span>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold uppercase tracking-[0.04em] text-[var(--text-primary)]">
                    {rule.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                    {rule.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-12">
        {/* Subtle dot grid background (matches body pattern) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(233, 240, 234, 0.03) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Mobile brand header (visible on < lg) */}
        <div className="relative z-10 mb-8 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center bg-[var(--accent-amber)] font-heading text-base font-bold text-[#0B0E0C]">
              Y/N
            </div>
            <span className="font-heading text-lg font-bold tracking-[0.06em]">
              <span className="text-[var(--color-yes)]">Yay</span>
              <span className="mx-1 text-[var(--accent-amber)]">or</span>
              <span className="text-[var(--color-no)]">Nay</span>
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Predict the future. Climb the ranks.
          </p>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[400px]">
          {/* Section header with eyebrow — same pattern as Home */}
          <div className="mb-6 flex items-center gap-2.5">
            <span className="mb-[2px] inline-block size-1.5 bg-[var(--accent-amber)]" />
            <div>
              <p className="eyebrow">Make your move</p>
              <h2 className="font-heading text-xl font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>
          </div>

          {/* Form — wrapped in card-style container */}
          <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
            {/* Top accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_20%,var(--accent-amber)_50%,transparent_80%)]" />

            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-4"
                onSubmit={tab === 'login' ? handleEmailLogin : handleEmailSignUp}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <Mail size={12} className="mr-1.5 inline-block -translate-y-px" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="player@yayornay.gg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <Lock size={12} className="mr-1.5 inline-block -translate-y-px" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {tab === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="font-mono text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-amber)]"
                      onClick={async () => {
                        if (!configured) return;
                        if (!email) { setError('Enter your email first.'); return; }
                        setLoading(true);
                        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
                        setLoading(false);
                        if (resetErr) setError(resetErr.message);
                        else setError('');
                        if (!resetErr) alert('Check your email for the reset link!');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-[var(--radius-sm)] border border-[var(--color-no-border)] bg-[var(--color-no-muted)] px-4 py-2.5 text-center font-mono text-xs leading-snug text-[var(--color-no)]">
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={!configured}
                  className="mt-1 w-full"
                >
                  {tab === 'login' ? (
                    <>
                      Play Now
                      <ChevronRight size={16} className="ml-1" />
                    </>
                  ) : (
                    <>
                      Join Now
                      <ChevronRight size={16} className="ml-1" />
                    </>
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            {!configured && (
              <div className="mt-4 rounded-[var(--radius-sm)] border border-[rgba(245,165,36,0.25)] bg-[var(--color-warning-muted)] p-3 text-center">
                <p className="font-mono text-xs text-warning">
                  Supabase not configured. Create a <code>.env</code> file with your project keys.
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {tab === 'login' ? 'New to Yay or Nay?' : 'Already a player?'}
            </span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          {/* Toggle prompt */}
          <button
            onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 font-heading text-sm font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            {tab === 'login' ? (
              <>
                <UserPlus size={15} />
                Create an Account
              </>
            ) : (
              <>
                <LogIn size={15} />
                Sign In Instead
              </>
            )}
          </button>

          {/* Footer text (mobile only) */}
          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] lg:hidden">
            Free to play · No real money · Just reputation
          </p>
        </div>
      </div>

      <TargetCursor
        targetSelector=".card, button, a, [role='button'], input, select, textarea"
        cursorColor="#f5a524"
        cursorColorOnTarget="#22c55e"
        spinDuration={2.4}
      />
    </div>
  );
}
