# Yay or Nay (Predict Arena)

A gamified prediction market game where you bet virtual coins on real-world outcomes, climb global ranks, and prove you can see the future. No real money, just bragging rights.

Players start with 1,000 virtual coins, read AI-generated prediction markets across sports, tech, politics, pop culture, and memes, and buy YES/NO shares on the outcome they believe in. Every correct call earns coins and XP. Coins determine your rank, XP determines your level, and both feed into a global leaderboard with a monthly seasonal reset.

---

## Table of Contents

- [Core Loop](#core-loop)
- [Features](#features)
- [Market Types](#market-types)
- [The Economy](#the-economy)
- [Progression: Ranks and Levels](#progression-ranks-and-levels)
- [Leaderboard](#leaderboard)
- [Quests and Achievements](#quests-and-achievements)
- [Prediction Pricing (AMM)](#prediction-pricing-amm)
- [Market Resolution and Disputes](#market-resolution-and-disputes)
- [Seasons](#seasons)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scheduled Jobs](#scheduled-jobs)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## Core Loop

```
Log in
  |
  v
Claim daily reward (manual button, rank-scaled)
  |
  v
Check today's AI-generated markets and community markets
  |
  v
Browse, research, make predictions (spend coins)
  |
  v
Markets resolve over time, win coins or lose stake
  |
  v
Earn XP, level up, climb global ranks
  |
  v
Check leaderboard and compare with everyone
  |
  v
Complete daily and weekly quests for bonus rewards
  |
  v
End of month, seasonal coin deduction and rank shakeup
  |
  v
Repeat
```

---

## Features

- AI-generated prediction markets every day, using the Gemini API
- LMSR automated market maker (AMM) pricing for YES/NO shares
- Community market proposals with upvote/downvote voting
- Coin-based ranks that go up and down in real time
- XP-based levels that only go up
- Global leaderboard with Coins, Accuracy, Profit, and Streak tabs
- 15 one-time achievements with coin and XP rewards
- Daily and weekly quests with progress tracking
- Rank-scaled daily login rewards with manual claim
- Monthly seasons with a 25% coin deduction and end-of-season rewards
- Betting streaks with bragging rights
- Real-time price updates via Supabase Realtime
- Dark, trading-dashboard inspired UI with game-like polish

---

## Market Types

### AI-Generated Markets (Daily Feed)

A GitHub Actions cron job runs daily at 04:00 UTC and calls a Netlify function, which prompts the Gemini API to generate a batch of prediction markets. Markets are written as draft rows with an `opens_at` timestamp, then a second cron job (`publish-markets`, 06:30 UTC daily) flips them live once they open.

The generation prompt includes:

- Target categories (Sports, Tech, Pop Culture, Politics, Memes)
- Today's date for context
- Constraints: objectively resolvable questions with a close date within 1 to 7 days
- Structured JSON output
- Example markets for quality guidance
- Recent active market titles to avoid duplicates

Safety rails:

- Gemini output is validated against a JSON schema before insertion
- Markets that fail validation are logged and skipped
- Max 15 markets per day to avoid overwhelming players
- Admins can flag and delete inappropriate markets

### Community-Created Markets

Players can propose their own markets in the Community tab.

Flow:

```
Player submits a proposal (title, category, close date)
  |
  v
Market enters Pending status, visible but not tradeable
  |
  v
Other players upvote or downvote the proposal (level 3+)
  |
  v
If upvotes reach the approval threshold, the market goes LIVE
If downvoted below the threshold, the proposal is rejected
  |
  v
Resolution: AI resolves via Gemini or admin resolves manually
```

Rules:

- Proposing costs coins, scaled by rank (50 for Unranked up to 5,000 for Omniscient)
- The stake is refunded with a bonus if the proposal is approved
- Approval requires level 3 to vote and level 5 to propose
- Approved community markets pay the creator a rank-scaled reward, plus participation bonuses when 25, 50, or 100+ players join

---

## The Economy

### Coins

| Action | Coins |
|---|---|
| Sign up bonus | +1,000 |
| Daily login (rank-scaled) | +50 to +1,000 |
| Sunday login bonus (3x daily) | +150 to +3,000 |
| Correct prediction payout | (shares x 1.00) minus cost basis |
| Wrong prediction | stake lost, shares go to zero |
| Sell shares early | revenue from the AMM, profit or loss |
| Quest completion (daily) | +25 to +100 |
| Quest completion (weekly) | +100 to +500 |
| Achievement unlock | +50 to +500 |
| Community market approved | +75 to +7,500 (rank-scaled) |

### Daily Login Rewards

Daily rewards are not automatic. Players see a "Claim Daily Reward" button and must click it to receive coins and XP. If they skip a day, they get nothing for that day. Sunday pays 3x the weekday amount.

| Rank | Mon-Sat Coins | Mon-Sat XP | Sunday Coins | Sunday XP |
|---|---|---|---|---|
| Unranked | 50 | 5 | 150 | 15 |
| Analyst | 75 | 8 | 225 | 24 |
| Strategist | 100 | 10 | 300 | 30 |
| Forecaster | 150 | 15 | 450 | 45 |
| Visionary | 250 | 25 | 750 | 75 |
| Prophet | 500 | 50 | 1,500 | 150 |
| Omniscient | 1,000 | 100 | 3,000 | 300 |

Inactivity lock: if a player has not placed a bet in the last 7 days, daily rewards are locked. The claim button instead shows "Place a bet to reactivate rewards". This prevents passive coin farming.

### Betting Streaks

To keep a streak alive, a player must place at least one prediction per day. Streaks track consecutive days with a bet, not consecutive correct predictions. They give no coin or XP reward, they exist purely for bragging rights and achievements. Missing a day resets the streak to zero.

---

## Progression: Ranks and Levels

Two parallel systems:

| Track | Based On | Direction | Purpose |
|---|---|---|---|
| Rank | Coin balance | Goes up and down | Competitive standing, leaderboard |
| Level | XP (cumulative) | Only goes up | Experience, feature unlocks |

### Track 1: Coin-Based Ranks

Your rank is determined by your current coin balance. Lose coins and you drop rank instantly, with no grace period.

| Rank | Min Coins | Color |
|---|---|---|
| Unranked | less than 2,500 | Gray |
| Analyst | 2,500 | Green |
| Strategist | 5,000 | Blue |
| Forecaster | 10,000 | Purple |
| Visionary | 25,000 | Gold |
| Prophet | 75,000 | Red |
| Omniscient | 250,000 | Iridescent gradient |

The rank badge is shown next to the username everywhere: leaderboard, profiles, and market pages. The leaderboard only lists ranked players (2,500+ coins).

### Track 2: XP Levels

XP only goes up. Levels unlock features and show experience.

| Action | XP |
|---|---|
| Place a prediction | +10 |
| Correct prediction | +25 base, scaled by confidence |
| Wrong prediction | +5 (you still tried) |
| Daily login | +10 |
| Complete a daily quest | +50 |
| Complete a weekly quest | +200 |
| Achievement unlock | 50 to 500 |
| Community market created and goes live | +100 |

Confidence multiplier: betting at 2x, 3x, or 5x confidence multiplies the base XP for a correct call (up to +125 XP at 5x). Wrong calls always give +5.

Level curve: XP required for level N is `floor(100 * 1.5^(N-1))`, so level 2 needs 100 XP, level 5 needs 738, level 10 needs 5,688, and level 20 needs 337,204.

| Level | Unlock |
|---|---|
| 1 | Predict on AI markets, view leaderboard |
| 3 | Vote on community proposals |
| 5 | Submit community market proposals |
| 8 | Daily quest slots increase from 3 to 4 |
| 10 | Weekly quest slots increase from 2 to 3 |

---

## Leaderboard

A single global ranking with an entry requirement of 2,500+ coins.

Tabs:

| Tab | Ranked By |
|---|---|
| Coins (default) | Current coin balance |
| Accuracy | Win rate, minimum 20 predictions |
| Profit | Net coin profit all-time |
| Streak | Current consecutive correct predictions |

Time filters: All-time, This Month, This Week.

---

## Quests and Achievements

### Quests

Daily quests (3 per day, randomly selected, 4 at level 8):

| Quest | Target | Reward |
|---|---|---|
| Make a Prediction | Place 1 prediction | 25 XP, 25 coins |
| Triple Threat | Place 3 predictions | 75 XP, 50 coins |
| Category Explorer | Predict in 2 different categories | 50 XP, 50 coins |
| Confident Call | Place a prediction at 3x+ confidence | 50 XP, 25 coins |
| Community Voice | Vote on 3 community proposals | 25 XP, 25 coins |

Weekly quests (2 per week, randomly selected, 3 at level 10):

| Quest | Target | Reward |
|---|---|---|
| Winning Week | 5 correct predictions this week | 200 XP, 200 coins |
| Active Trader | 15 predictions this week | 150 XP, 150 coins |
| Category Master | Win 3 predictions in a single category | 200 XP, 150 coins |
| Streak Builder | Achieve a 5-day betting streak | 150 XP, 100 coins |

Quests reset at midnight UTC (daily) and Monday 00:00 UTC (weekly). Progress bars show completion status.

### Achievements (15 one-time unlocks)

| Achievement | Condition | XP | Coins |
|---|---|---|---|
| First Prediction | Place your first prediction | 50 | 100 |
| On a Roll | 3-day betting streak | 100 | 150 |
| Hot Streak | 7-day betting streak | 250 | 300 |
| Unstoppable | 15-day betting streak | 500 | 500 |
| Iron Will | 30-day betting streak | 750 | 750 |
| Diversified | Predict in 5 different categories | 100 | 100 |
| Contrarian | Win while in the under 10% minority | 300 | 250 |
| Whale | Reach Forecaster rank (10,000 coins) | 200 | 0 |
| Early Bird | Predict within the first hour of a market opening | 75 | 50 |
| Century | Make 100 total predictions | 300 | 200 |
| Sharp Eye | 70%+ accuracy over 50+ predictions | 400 | 300 |
| Market Maker | Get a community market proposal approved | 200 | 150 |
| Trendsetter | Create a community market with 50+ participants | 400 | 300 |
| Ranked Up | Reach Analyst rank (2,500 coins) | 100 | 100 |
| Rising Star | Reach Strategist rank (5,000 coins) | 250 | 250 |

---

## Prediction Pricing (AMM)

Every market uses the LMSR (Logarithmic Market Scoring Rule) and starts at 50/50.

```
Price(YES) = e^(q_yes / b) / (e^(q_yes / b) + e^(q_no / b))
Price(NO)  = 1 - Price(YES)
```

- `q_yes`, `q_no` are the total shares outstanding for each outcome
- `b` is the liquidity parameter, 100 for all markets

Cost to buy shares:

```
Cost = b * ln(e^((q_yes + shares) / b) + e^(q_no / b)) - b * ln(e^(q_yes / b) + e^(q_no / b))
```

The cost increases as more people buy the same side, which is built-in price discovery. When a market resolves, each winning share pays 1.00 coin and losing shares pay zero. Shares can also be sold back to the AMM before resolution, at a profit or loss depending on the current price.

---

## Market Resolution and Disputes

Resolved markets (and cancelled markets) are purged from the active database after 7 weeks by the `purge-expired-markets` cron.

Resolution flow:

- Expired markets (closes_at passed) are checked by the `dispute.js` flow and admin review
- Each resolution records the outcome and a source
- Payouts are applied to every prediction on the market atomically via PostgreSQL functions
- Failed resolution attempts are tracked on the market row so markets can be retried

Disputes:

- After resolution, players can file a dispute within the 24-hour dispute window
- One dispute per player per market
- Disputed markets go into review and are handled manually by an admin

---

## Seasons

Seasons prevent economy inflation and keep the leaderboard dynamic.

- Each season lasts exactly 1 calendar month
- At 00:00 UTC on the 1st of each month, a new season begins
- At season start, 25% of every player's coins are deducted (the "seasonal tax")
- Coins never drop below 1,000

Deduction formula:

```
new_coins = max(1000, floor(coins * 0.75))
```

End-of-season rewards (distributed before the deduction):

| Position | Coin Bonus | XP Bonus | Special Reward |
|---|---|---|---|
| 1st | +5,000 | +1,000 | Exclusive "Season N Champion" badge |
| 2nd | +3,000 | +750 | Exclusive "Season N Runner-Up" badge |
| 3rd | +2,000 | +500 | Exclusive "Season N Top 3" badge |
| 4th-10th | +1,000 | +250 | none |

Seasonal badges are permanent and unique to each season. After the rewards, ranks are recalculated for all players, and many drop, forcing active play to maintain standing.

---

## Tech Stack

### Frontend

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 6 |
| Routing | React Router v7 |
| State | Zustand |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Animations | Framer Motion, GSAP |
| Charts | Lightweight Charts (TradingView) |
| 3D | Three.js, @react-three/fiber, OGL |
| Icons | Lucide React |
| Toasts | Sonner |
| Fonts | Geist Variable |

### Backend

| Layer | Choice |
|---|---|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email, Google, GitHub, JWT-based) |
| Realtime | Supabase Realtime (live prices, leaderboard) |
| Serverless | Netlify Functions |
| AI | Gemini API (market generation, resolution checks) |
| Cron | GitHub Actions scheduled workflows |

### Deployment

| Layer | Choice |
|---|---|
| Hosting | Netlify (CDN + serverless functions) |
| CI/CD | Netlify auto-deploy from GitHub |
| Database | Supabase cloud project |

The entire stack, including AI-generated markets, runs on free tiers: Netlify free plan, Supabase free tier, GitHub Actions free minutes, and the Gemini API free tier.

---

## Architecture

```
Frontend (React SPA on Netlify CDN)
  React Router v7  ->  Zustand  ->  TanStack Query
          |            |             |
          +--- Supabase Auth (JWT)   |
          +--- Supabase Realtime subscriptions
          +--- Netlify Functions (/api/*)
                     |
Backend (Supabase)
  PostgreSQL database with RLS policies
  PostgreSQL functions for all writes (atomic, row-locked)
  Supabase Realtime for live updates
                     |
External services
  GitHub Actions cron -> Netlify Functions -> Gemini API
```

Key data flow for placing a prediction:

```
Player clicks "Buy YES"
  |
  v
Frontend POSTs to /api/predict with market id, position, coins, confidence
  |
  v
Netlify function verifies auth and balance
  |
  v
Reads current market state (q_yes, q_no, b)
  |
  v
Computes shares received and new prices with LMSR
  |
  v
Single transaction: insert prediction, deduct coins, add XP, update market
  |
  v
Check achievements and update quest progress
  |
  v
Commit, then broadcast new prices via Supabase Realtime
```

---

## Project Structure

```
├── src/                       # Frontend (React SPA)
│   ├── components/
│   │   ├── community/         # Proposal cards, vote buttons, propose form
│   │   ├── gamification/      # Rank badges, XP bar, quest cards, level up modal
│   │   ├── layout/            # Header, mobile dock, ticker, protected routes
│   │   ├── leaderboard/       # Podium, player rows, leaderboard table
│   │   ├── market/            # Market cards, price charts, prediction/sell forms
│   │   ├── reactbits/         # Aurora, DecryptedText, ShinyText, ScrollVelocity
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # TanStack Query hooks for every API endpoint
│   ├── lib/                   # amm.js, ranks.js, levels.js, rewards.js, api.js
│   ├── pages/                 # Home, Markets, MarketDetail, Community, Leaderboard,
│   │                          # Profile, Quests, Achievements, MyPredictions, Auth,
│   │                          # Settings, About
│   ├── stores/                # Zustand stores (auth, ui)
│   └── config/                # Supabase client config
├── netlify/functions/         # Serverless backend
│   ├── _shared/               # amm, auth, cors, ranks, levels, rewards, quests,
│   │                          # achievements, supabase client
│   ├── predict.js             # Place a prediction
│   ├── sell.js                # Sell shares back to the AMM
│   ├── claim-reward.js        # Claim daily login reward
│   ├── community-propose.js   # Submit a market proposal
│   ├── community-vote.js      # Vote on a proposal
│   ├── dispute.js             # File a dispute on a resolved market
│   ├── generate-markets.js    # Gemini market generation (cron)
│   ├── publish-markets.js     # Publish draft markets (cron)
│   ├── purge-expired-markets.js # Remove old resolved/cancelled markets (cron)
│   ├── reset-quests.js        # Reset daily/weekly quests (cron)
│   ├── season-transition.js   # Monthly season rollover (cron)
│   ├── assign-quests.js       # Assign daily/weekly quests
│   ├── leaderboard.js         # Leaderboard queries
│   ├── login.js / onboard.js  # Auth and profile onboarding
│   ├── update-profile.js      # Profile updates
│   ├── user.js                # User data
│   └── admin-delete-market.js # Admin market removal
├── supabase/
│   ├── production_schema.sql  # Consolidated schema (tables, RLS, functions, seed)
│   └── migrations/            # 001-012 incremental migrations
├── .github/workflows/         # Cron workflows (daily markets, season, quests, purge)
├── netlify.toml               # Build config, /api/* routing, function timeouts
└── vite.config.js             # Vite config with manual chunk splitting
```

---

## Getting Started

Prerequisites: Node.js 20+, a Supabase project, and a Netlify account.

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up the database. Open the Supabase SQL editor and run the consolidated script:

```bash
supabase/production_schema.sql
```

3. Configure environment variables (see below).

4. Run locally:

```bash
npm run dev
```

Or with Netlify functions locally:

```bash
npm run dev:netlify
```

Build for production:

```bash
npm run build
```

---

## Environment Variables

See `.env.example`. Frontend variables are safe to expose; backend variables must only be set in the Netlify dashboard.

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key (RLS protects data) |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key, never expose |
| `GEMINI_API_KEY` | Backend | Gemini API key for market generation |
| `CRON_SECRET` | Backend | Shared secret for cron-authenticated functions |

---

## Scheduled Jobs

GitHub Actions workflows trigger Netlify functions with the cron secret.

| Workflow | Schedule | Function |
|---|---|---|
| daily-markets.yml | Daily 04:00 UTC | generate-markets |
| publish-markets (via daily-markets cron) | Daily 06:30 UTC | publish-markets |
| purge-expired-markets.yml | Daily 03:00 UTC | purge-expired-markets |
| reset-quests.yml | Daily 00:00 UTC + Monday | reset-quests |
| season-transition.yml | 1st of month 00:00 UTC | season-transition |

All workflows also support manual triggering via `workflow_dispatch` for testing.

---

## Database Schema

The database is PostgreSQL on Supabase with row-level security. All writes go through PostgreSQL functions so they are atomic and row-locked. Main tables:

| Table | Purpose |
|---|---|
| `users` | Profile, coins, XP, level, rank, stats, streaks, login tracking |
| `markets` | Prediction markets, AMM state (q_yes, q_no, b), prices, status, resolution |
| `predictions` | Individual bets: position, shares, entry price, confidence, payout, result |
| `community_proposals` | Pending proposals with stake amount and vote counts |
| `proposal_votes` | Up/down votes on proposals |
| `achievements` | Static achievement definitions |
| `user_achievements` | Unlocked achievements per user |
| `quests` | Daily and weekly quest templates with criteria |
| `user_quests` | Per-user quest assignment, progress, completion |
| `market_price_history` | Price snapshots for charts |
| `market_disputes` | Disputes filed on resolved markets |

---

## Deployment

The site deploys automatically from the `main` branch to Netlify. `netlify.toml` configures:

- Build command `npm run build`, publish directory `dist`
- Functions directory `netlify/functions` with esbuild bundling
- `NODE_VERSION = 20` build environment
- API routing: `/api/*` rewrites to `/.netlify/functions/*`
- Extended timeouts for AI-related functions (30s for generate-markets and season-transition, 10s for publish-markets)
- SPA catch-all redirect in `public/_redirects` (production only)

The Vite config splits vendor code into manual chunks (react, react-query, charts, motion, supabase) for better caching.

---

## License and Disclaimer

Everything on Yay or Nay is play money. Coins are virtual, winnings are virtual, and no real money is ever involved. The game is for fun.