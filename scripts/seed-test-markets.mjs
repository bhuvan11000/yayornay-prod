#!/usr/bin/env node
/**
 * Seed fake expired/review/resolved markets for testing:
 *  1. Manual resolution (admin trigger)  — 3 expired `open` markets with predictions
 *  2. Player disputing                   — 1 `resolved` market, dispute window open, 4 disputes pre-seeded
 *  3. Admin dispute resolution           — 1 `review` market with disputes + predictions
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load .env manually (no dotenv installed)
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const now = new Date();
const iso = (d) => d.toISOString();

// Fixed UUIDs so we can cross-reference
const ids = {
  spacex: 'a0000000-0000-4000-8000-000000000001',
  worldcup: 'a0000000-0000-4000-8000-000000000002',
  gpt5: 'a0000000-0000-4000-8000-000000000003',
  miami: 'a0000000-0000-4000-8000-000000000004',
  imax: 'a0000000-0000-4000-8000-000000000005',
};

// Test users (from the seeded 200)
const users = {
  u1: '2a2e597b-b463-41a9-81c2-57f0bf41fb13', // crypto_sage54179
  u2: '53832a66-1b87-4ea5-86cb-0b199256a962', // luna_king193
  u3: 'a94a4867-7443-4895-aaa8-520c8eb2ceb6', // moon_byte94129
  u4: '3b7502a5-e316-4f3a-b4e8-07decfc3fb40', // moon_hawk72199
  u5: '9489ed82-3c02-44f2-abcf-4b1986e5ab84', // echo_ray9456
};

const daysAgo = (n, h = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - h);
  return iso(d);
};
const hoursAhead = (n) => {
  const d = new Date(now);
  d.setHours(d.getHours() + n);
  return iso(d);
};

// ── Group A: expired OPEN markets (admin trigger-resolution test) ──
const groupA = [
  {
    id: ids.spacex,
    title: 'Will SpaceX complete a successful Starship orbital flight test this month?',
    description: 'SpaceX Starship completes a full orbital flight test and survives reentry until splashdown.',
    category: 'tech',
    resolution_criteria: 'YES if a Starship flight test reaches orbit and completes a controlled splashdown this month. NO otherwise.',
    closes_at: daysAgo(3),
    q_yes: 3200, q_no: 1800, b: 100,
    yes_price: 0.64, no_price: 0.36,
    volume: 8500, participant_count: 5,
  },
  {
    id: ids.worldcup,
    title: 'Will the 2027 Cricket World Cup final be held at Narendra Modi Stadium?',
    description: 'The ICC 2027 Cricket World Cup is hosted by South Africa, Zimbabwe and Namibia.',
    category: 'sports',
    resolution_criteria: 'YES if the official final venue for the 2027 Cricket World Cup is confirmed as Narendra Modi Stadium. NO if confirmed elsewhere or unconfirmed.',
    closes_at: daysAgo(2, 6),
    q_yes: 1500, q_no: 2900, b: 100,
    yes_price: 0.34, no_price: 0.66,
    volume: 4400, participant_count: 4,
  },
  {
    id: ids.gpt5,
    title: 'Will OpenAI ship a new flagship frontier model to the public this month?',
    description: 'OpenAI releases a new flagship model (e.g. next-gen GPT) for general public access.',
    category: 'tech',
    resolution_criteria: 'YES if OpenAI publicly releases a new flagship frontier model this month. NO otherwise.',
    closes_at: daysAgo(4),
    q_yes: 2600, q_no: 1400, b: 100,
    yes_price: 0.65, no_price: 0.35,
    volume: 5200, participant_count: 4,
  },
];

// ── Group B: RESOLVED market with open dispute window (player-dispute test) ──
const groupB = {
  id: ids.miami,
  title: 'Will Inter Miami win the Leagues Cup final?',
  description: 'Inter Miami wins the Leagues Cup final in regulation or penalties.',
  category: 'sports',
  resolution_criteria: 'YES if Inter Miami wins the Leagues Cup final. NO if they lose.',
  closes_at: daysAgo(1),
  status: 'resolved',
  resolution: 'yes',
  resolution_source: 'https://www.mlssoccer.com/leaguescup',
  resolved_at: hoursAhead(-20),
  dispute_deadline: hoursAhead(4), // window still open
  q_yes: 4100, q_no: 1900, b: 100,
  yes_price: 0.68, no_price: 0.32,
  volume: 9800, participant_count: 6,
};

// ── Group C: REVIEW market with disputes (admin dispute-resolution test) ──
const groupC = {
  id: ids.imax,
  title: 'Will the new Christopher Nolan film release in IMAX 70mm?',
  description: 'Nolan\'s upcoming film gets a wide IMAX 70mm film release.',
  category: 'popculture',
  resolution_criteria: 'YES if the film is confirmed for IMAX 70mm release. NO otherwise.',
  closes_at: daysAgo(2),
  status: 'review',
  resolution_source: null,
  q_yes: 2200, q_no: 2600, b: 100,
  yes_price: 0.46, no_price: 0.54,
  volume: 6100, participant_count: 5,
};

// Predictions across the groups (all pending so resolution pays out)
const predictions = [
  // Group A
  { market_id: ids.spacex, user_id: users.u1, position: 'yes', shares: 120, entry_price: 0.60, coins_spent: 150, confidence: 3 },
  { market_id: ids.spacex, user_id: users.u2, position: 'no', shares: 180, entry_price: 0.38, coins_spent: 100, confidence: 2 },
  { market_id: ids.spacex, user_id: users.u3, position: 'yes', shares: 240, entry_price: 0.62, coins_spent: 300, confidence: 5 },
  { market_id: ids.spacex, user_id: users.u4, position: 'no', shares: 90, entry_price: 0.40, coins_spent: 60, confidence: 1 },
  { market_id: ids.spacex, user_id: users.u5, position: 'yes', shares: 200, entry_price: 0.58, coins_spent: 220, confidence: 2 },
  { market_id: ids.worldcup, user_id: users.u1, position: 'no', shares: 300, entry_price: 0.62, coins_spent: 250, confidence: 3 },
  { market_id: ids.worldcup, user_id: users.u3, position: 'yes', shares: 150, entry_price: 0.30, coins_spent: 80, confidence: 2 },
  { market_id: ids.worldcup, user_id: users.u5, position: 'no', shares: 260, entry_price: 0.64, coins_spent: 200, confidence: 3 },
  { market_id: ids.gpt5, user_id: users.u2, position: 'yes', shares: 190, entry_price: 0.60, coins_spent: 180, confidence: 2 },
  { market_id: ids.gpt5, user_id: users.u4, position: 'yes', shares: 320, entry_price: 0.58, coins_spent: 300, confidence: 5 },
  { market_id: ids.gpt5, user_id: users.u5, position: 'no', shares: 140, entry_price: 0.38, coins_spent: 90, confidence: 1 },
  // Group B
  { market_id: ids.miami, user_id: users.u1, position: 'yes', shares: 400, entry_price: 0.65, coins_spent: 350, confidence: 3 },
  { market_id: ids.miami, user_id: users.u2, position: 'no', shares: 210, entry_price: 0.35, coins_spent: 130, confidence: 2 },
  { market_id: ids.miami, user_id: users.u3, position: 'yes', shares: 300, entry_price: 0.60, coins_spent: 250, confidence: 3 },
  { market_id: ids.miami, user_id: users.u4, position: 'no', shares: 150, entry_price: 0.30, coins_spent: 90, confidence: 2 },
  { market_id: ids.miami, user_id: users.u5, position: 'yes', shares: 250, entry_price: 0.62, coins_spent: 200, confidence: 2 },
  // Group C
  { market_id: ids.imax, user_id: users.u1, position: 'no', shares: 280, entry_price: 0.55, coins_spent: 240, confidence: 3 },
  { market_id: ids.imax, user_id: users.u2, position: 'yes', shares: 220, entry_price: 0.42, coins_spent: 160, confidence: 2 },
  { market_id: ids.imax, user_id: users.u3, position: 'no', shares: 340, entry_price: 0.58, coins_spent: 290, confidence: 5 },
  { market_id: ids.imax, user_id: users.u5, position: 'yes', shares: 180, entry_price: 0.40, coins_spent: 120, confidence: 2 },
];

// Disputes: 4 on Group B (so player's 5th flips to review), 3 on Group C
const disputes = [
  // Group B — resolved as YES, players think it was a loss
  { market_id: ids.miami, user_id: users.u2, reason: 'Inter Miami lost the final 2-1 in extra time. The resolution says YES but they clearly lost.' },
  { market_id: ids.miami, user_id: users.u4, reason: 'Wrong resolution. The match went to penalties and Miami lost the shootout.' },
  { market_id: ids.miami, user_id: users.u1, reason: 'I watched the final, Miami did NOT win. Resolution should be NO.' },
  { market_id: ids.miami, user_id: users.u5, reason: 'Resolution is factually wrong — the official result was a Miami loss.' },
  // Group C — review market already flagged
  { market_id: ids.imax, user_id: users.u2, reason: 'Auto-resolver could not verify IMAX 70mm prints; needs manual check.' },
  { market_id: ids.imax, user_id: users.u5, reason: 'The studio confirmed digital IMAX only — NO is the correct call.' },
  { market_id: ids.imax, user_id: users.u3, reason: 'Trailer lists standard IMAX, not 70mm film. Please review.' },
];

async function run() {
  console.log('Seeding test markets...\n');

  // Idempotent: remove any previous seed with our fixed IDs (disputes/predictions cascade or delete first)
  const allIds = Object.values(ids);
  await supabase.from('market_disputes').delete().in('market_id', allIds);
  await supabase.from('predictions').delete().in('market_id', allIds);
  await supabase.from('markets').delete().in('id', allIds);
  console.log('Cleaned previous seed (if any).\n');

  // 1. Markets
  for (const m of groupA) {
    const { error } = await supabase.from('markets').insert({
      ...m,
      status: 'open',
      source: 'ai',
      opens_at: daysAgo(6),
      created_at: daysAgo(6),
    });
    if (error) throw new Error(`Group A insert failed (${m.title}): ${error.message}`);
    console.log(`✅ [open]     ${m.title}`);
  }

  const { error: errB } = await supabase.from('markets').insert({
    ...groupB,
    source: 'community',
    opens_at: daysAgo(4),
    created_at: daysAgo(4),
  });
  if (errB) throw new Error(`Group B insert failed: ${errB.message}`);
  console.log(`✅ [resolved] ${groupB.title} (dispute window until ${groupB.dispute_deadline})`);

  const { error: errC } = await supabase.from('markets').insert({
    ...groupC,
    source: 'ai',
    opens_at: daysAgo(5),
    created_at: daysAgo(5),
  });
  if (errC) throw new Error(`Group C insert failed: ${errC.message}`);
  console.log(`✅ [review]   ${groupC.title}`);

  // 2. Predictions
  for (const p of predictions) {
    const { error } = await supabase.from('predictions').insert(p);
    if (error) throw new Error(`Prediction insert failed: ${error.message}`);
  }
  console.log(`\n✅ ${predictions.length} predictions seeded`);

  // 3. Disputes
  for (const d of disputes) {
    const { error } = await supabase.from('market_disputes').insert({
      ...d,
      created_at: hoursAhead(-2),
    });
    if (error) throw new Error(`Dispute insert failed: ${error.message}`);
  }
  console.log(`✅ ${disputes.length} disputes seeded\n`);

  console.log('── How to test ──');
  console.log('1) MANUAL RESOLUTION:  Admin app → Markets → "Trigger Resolution". The 3 expired open markets get auto-resolved via Gemini.');
  console.log('2) PLAYER DISPUTE:     Log in as a player → open "Will Inter Miami win the Leagues Cup final?" → file a dispute.');
  console.log('                       It is the 5th dispute → market flips to review automatically.');
  console.log('3) DISPUTE RESOLUTION: Admin app → Dispute Resolution tab → see both review markets with dispute lists → Resolve YES/NO or Cancel & Refund.');
}

run().catch((e) => {
  console.error('\n❌ Seed failed:', e.message);
  process.exit(1);
});
