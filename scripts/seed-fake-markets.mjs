#!/usr/bin/env node
/**
 * Seed fake OPEN markets so the app doesn't look empty.
 * - 12 open markets across all 5 categories, closing 12h–6 days from now
 * - Realistic AMM state, volumes, participant counts
 * - Price history per market so detail charts render
 * - A few predictions from the 5 known test users
 *
 * Idempotent: fixed UUIDs (b0000000-…), deletes + re-inserts.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const now = new Date();
const hoursFromNow = (h) => new Date(now.getTime() + h * 3600000).toISOString();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();

// Test users (from the seeded 200 fake players)
const users = {
  u1: '2a2e597b-b463-41a9-81c2-57f0bf41fb13', // crypto_sage54179
  u2: '53832a66-1b87-4ea5-86cb-0b199256a962', // luna_king193
  u3: 'a94a4867-7443-4895-aaa8-520c8eb2ceb6', // moon_byte94129
  u4: '3b7502a5-e316-4f3a-b4e8-07decfc3fb40', // moon_hawk72199
  u5: '9489ed82-3c02-44f2-abcf-4b1986e5ab84', // echo_ray9456
};

const M = (n) => `b0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ── 12 open markets ──
const markets = [
  // Sports
  { id: M(1), title: 'Will India win the next T20 series against Australia?', category: 'sports',
    resolution_criteria: 'YES if India wins the next T20 series against Australia. NO if they lose or draw.',
    closes_in: 58, yes_price: 0.58, q_yes: 4200, q_no: 3100, volume: 9400, participants: 86, source: 'ai' },
  { id: M(2), title: 'Will Mbappé score a hat-trick in a match this month?', category: 'sports',
    resolution_criteria: 'YES if Mbappé scores 3+ goals in a single official match this month. NO otherwise.',
    closes_in: 26, yes_price: 0.31, q_yes: 1500, q_no: 3400, volume: 5200, participants: 54, source: 'community' },
  { id: M(3), title: 'Will RCB qualify for the IPL playoffs this season?', category: 'sports',
    resolution_criteria: 'YES if RCB finishes in the top 4 of the IPL points table this season. NO otherwise.',
    closes_in: 130, yes_price: 0.44, q_yes: 2800, q_no: 3500, volume: 7300, participants: 61, source: 'ai' },

  // Tech
  { id: M(4), title: 'Will Bitcoin close above $100,000 this week?', category: 'tech',
    resolution_criteria: 'YES if BTC closes above $100,000 on any day this week (UTC). NO otherwise.',
    closes_in: 20, yes_price: 0.63, q_yes: 5100, q_no: 2900, volume: 11800, participants: 132, source: 'ai' },
  { id: M(5), title: 'Will Apple announce a foldable iPhone this year?', category: 'tech',
    resolution_criteria: 'YES if Apple officially announces a foldable iPhone in 2026. NO otherwise.',
    closes_in: 90, yes_price: 0.27, q_yes: 1800, q_no: 4800, volume: 6800, participants: 77, source: 'community' },
  { id: M(6), title: 'Will the PS6 be officially announced before January 2027?', category: 'tech',
    resolution_criteria: 'YES if Sony officially announces PlayStation 6 before Jan 2027. NO otherwise.',
    closes_in: 95, yes_price: 0.52, q_yes: 3300, q_no: 3000, volume: 7600, participants: 69, source: 'ai' },
  { id: M(7), title: 'Will OpenAI release a new flagship model within 30 days?', category: 'tech',
    resolution_criteria: 'YES if OpenAI ships a new flagship frontier model to the public within 30 days. NO otherwise.',
    closes_in: 18, yes_price: 0.41, q_yes: 2600, q_no: 3700, volume: 8300, participants: 98, source: 'admin' },

  // Pop culture
  { id: M(8), title: 'Will the next Spider-Man movie gross over $1B worldwide?', category: 'popculture',
    resolution_criteria: 'YES if the next Spider-Man film passes $1B global box office. NO otherwise.',
    closes_in: 76, yes_price: 0.49, q_yes: 3100, q_no: 3200, volume: 7900, participants: 88, source: 'ai' },
  { id: M(9), title: 'Will Taylor Swift release a new album before 2027?', category: 'popculture',
    resolution_criteria: 'YES if Taylor Swift releases a new studio album before Jan 1 2027. NO otherwise.',
    closes_in: 110, yes_price: 0.36, q_yes: 2200, q_no: 3900, volume: 6100, participants: 73, source: 'ai' },

  // Politics
  { id: M(10), title: 'Will the Fed cut interest rates at its next meeting?', category: 'politics',
    resolution_criteria: 'YES if the Federal Reserve cuts the federal funds rate at its next scheduled meeting. NO otherwise.',
    closes_in: 15, yes_price: 0.55, q_yes: 3600, q_no: 2900, volume: 8700, participants: 64, source: 'ai' },

  // Memes
  { id: M(11), title: 'Will "skibidi" still be trending by the end of this year?', category: 'memes',
    resolution_criteria: 'YES if skibidi appears in a top-10 global trend chart in December. NO otherwise.',
    closes_in: 140, yes_price: 0.22, q_yes: 1100, q_no: 4000, volume: 4600, participants: 52, source: 'community' },
  { id: M(12), title: 'Will this app reach 1000 registered players this month?', category: 'memes',
    resolution_criteria: 'YES if the player count hits 1000 by month end. NO otherwise.',
    closes_in: 8, yes_price: 0.72, q_yes: 4800, q_no: 1900, volume: 10200, participants: 41, source: 'admin' },
];

// ── Predictions from test users (pending, so resolution pays out) ──
const preds = [
  { market: M(1), user: users.u1, pos: 'yes', shares: 140, entry: 0.54, spent: 130, conf: 3 },
  { market: M(1), user: users.u3, pos: 'no', shares: 90, entry: 0.46, spent: 70, conf: 2 },
  { market: M(4), user: users.u2, pos: 'yes', shares: 220, entry: 0.58, spent: 240, conf: 5 },
  { market: M(4), user: users.u5, pos: 'no', shares: 110, entry: 0.40, spent: 85, conf: 2 },
  { market: M(7), user: users.u1, pos: 'no', shares: 160, entry: 0.60, spent: 150, conf: 3 },
  { market: M(7), user: users.u4, pos: 'yes', shares: 130, entry: 0.38, spent: 95, conf: 2 },
  { market: M(10), user: users.u3, pos: 'yes', shares: 190, entry: 0.52, spent: 180, conf: 3 },
  { market: M(12), user: users.u2, pos: 'yes', shares: 250, entry: 0.68, spent: 300, conf: 5 },
  { market: M(12), user: users.u5, pos: 'yes', shares: 120, entry: 0.70, spent: 140, conf: 3 },
  { market: M(8), user: users.u4, pos: 'no', shares: 100, entry: 0.52, spent: 90, conf: 1 },
  { market: M(2), user: users.u1, pos: 'no', shares: 200, entry: 0.70, spent: 190, conf: 3 },
  { market: M(6), user: users.u3, pos: 'yes', shares: 85, entry: 0.49, spent: 75, conf: 2 },
];

// Build price history: random walk from opens_at (~5 days ago) → current price
function buildHistory(m) {
  const points = [];
  const opens = new Date(now.getTime() - 5 * 86400000);
  const steps = 20;
  let price = clamp(m.yes_price + (Math.random() - 0.5) * 0.3, 0.15, 0.85);
  let vol = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // drift toward final price with noise
    const target = price + (m.yes_price - price) * 0.25 + (Math.random() - 0.5) * 0.04;
    price = clamp(target, 0.10, 0.90);
    vol += Math.round((m.volume / steps) * (0.5 + Math.random()));
    points.push({
      market_id: m.id,
      yes_price: round2(price),
      no_price: round2(1 - price),
      volume: vol,
      recorded_at: new Date(opens.getTime() + (now.getTime() - opens.getTime()) * t).toISOString(),
    });
  }
  return points;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round2 = (v) => Math.round(v * 100) / 100;

async function run() {
  console.log('Seeding fake open markets...\n');

  // Clean previous seed (fixed b0000000 ids)
  const allIds = markets.map((m) => m.id);
  await supabase.from('market_disputes').delete().in('market_id', allIds);
  await supabase.from('market_price_history').delete().in('market_id', allIds);
  await supabase.from('predictions').delete().in('market_id', allIds);
  await supabase.from('markets').delete().in('id', allIds);
  console.log('Cleaned previous seed (if any).\n');

  // 1. Markets
  for (const m of markets) {
    const { error } = await supabase.from('markets').insert({
      id: m.id,
      title: m.title,
      category: m.category,
      source: m.source,
      status: 'open',
      resolution_criteria: m.resolution_criteria,
      q_yes: m.q_yes, q_no: m.q_no, b: 100,
      yes_price: m.yes_price, no_price: round2(1 - m.yes_price),
      volume: m.volume, participant_count: m.participants,
      opens_at: hoursAgo(120),
      closes_at: hoursFromNow(m.closes_in),
    });
    if (error) throw new Error(`Market insert failed (${m.title}): ${error.message}`);
    console.log(`✅ [open]     ${m.title}`);
  }

  // 2. Price history
  const histories = markets.flatMap(buildHistory);
  const { error: hErr } = await supabase.from('market_price_history').insert(histories);
  if (hErr) throw new Error(`Price history insert failed: ${hErr.message}`);
  console.log(`\n✅ ${histories.length} price-history points seeded`);

  // 3. Predictions
  for (const p of preds) {
    const { error } = await supabase.from('predictions').insert({
      user_id: p.user, market_id: p.market, position: p.pos,
      shares: p.shares, entry_price: p.entry, coins_spent: p.spent, confidence: p.conf,
    });
    if (error) throw new Error(`Prediction insert failed: ${error.message}`);
  }
  console.log(`✅ ${preds.length} predictions seeded`);

  const { count } = await supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'open');
  console.log(`\n✅ Done — ${count} open markets total in the app.`);
}

run().catch((e) => {
  console.error('\n❌ Seed failed:', e.message);
  process.exit(1);
});
