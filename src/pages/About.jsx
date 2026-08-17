import { Mail } from 'lucide-react';

const PANEL = 'rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5';

const STEPS = [
  { step: '01', title: 'Browse markets', desc: 'Fresh questions drop every day: sports, tech, pop culture, politics, memes. Read the criteria, check the odds, find your angle.' },
  { step: '02', title: 'Place your prediction', desc: 'Put coins on the side you believe in. The crowd\'s money moves the odds in real time, so every call shifts the market.' },
  { step: '03', title: 'Earn rewards', desc: 'Call it right and you win coins and XP, plus streak and quest bonuses. Wrong? You only lose what you risked.' },
  { step: '04', title: 'Climb the ranks', desc: 'Rise from Unranked to Analyst, Strategist, Forecaster, Visionary, Prophet and Omniscient. Every season, the race starts over.' },
  { step: '05', title: 'Community markets', desc: 'Got a hot question of your own? Propose it, stake coins, and win the crowd. Top proposals go live as real markets.' },
];

export default function About() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.04em] text-[var(--text-primary)]">
          About Yay or Nay
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Yay or Nay is a prediction market game where you bet virtual coins on real-world
          outcomes, climb ranks, and prove you can see the future. No real money, ever.
          Just reputation, streaks, and the thrill of being right.
        </p>
      </div>

      <section>
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-[var(--accent-amber)]">
          How It Works
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {STEPS.map((rule) => (
            <div key={rule.step} className={`${PANEL} flex gap-4`}>
              <span className="pt-0.5 font-mono text-xs font-semibold text-[var(--accent-amber)]">{rule.step}</span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold uppercase tracking-[0.04em] text-[var(--text-primary)]">
                  {rule.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                  {rule.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-[var(--accent-amber)]">
          No Real Money
        </h2>
        <div className={`${PANEL} mt-3`}>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Everything on Yay or Nay is play money. Coins are virtual, winnings are virtual,
            and nothing on this platform can be bought with or cashed out into real currency.
            It is a game of skill and opinion, a free playground for testing how well you read
            the world.
          </p>
        </div>
        <div className={`${PANEL} mt-2`}>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Market outcomes are resolved from real-world results with clear resolution criteria,
            and every resolution can be disputed. If you believe a call is wrong, open a dispute
            and our team will review it.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-[var(--accent-amber)]">
          Contact
        </h2>
        <div className={`${PANEL} mt-3`}>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Feedback, complaints, suggestions, bug reports: we read everything. Found a market
            that resolved unfairly? Want a new category? Think the app is missing a feature?
            Drop us a line:
          </p>
          <a
            href="mailto:yayornay67@gmail.com"
            className="flex w-fit cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent-amber)] px-5 py-3 font-heading text-sm font-semibold text-[#0B0E0C] transition-colors duration-150 hover:bg-[var(--accent-amber-hover)]"
          >
            <Mail size={16} />
            yayornay67@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}