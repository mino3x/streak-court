// Fair scoring: every player earns XP by the same rules. Challenge points are
// measured against a target for the player's age, so a 10-year-old who hits
// their target earns exactly what a 15-year-old earns for hitting theirs.
import { CHALLENGES } from "./program.js";

export const XP_RULES = { block: 10, challenge: 30, pb: 10, streakMax: 10, dayMax: 100 };

// Score that earns full challenge points, by age. Adjust here if a target proves too easy or too hard.
export const TARGETS = {
  hotspot60: { 10: 10, 11: 12 },
  mikan60: { 10: 16, 11: 18, 12: 20, 13: 22, 14: 24, 15: 26 },
  ft10: { 10: 5, 11: 6 },
  atw10: { 10: 6, 11: 7 },
  btp11: { 10: 6, 11: 7, 12: 8, 13: 9, 14: 10, 15: 10 },
  corner60: { 12: 5, 13: 5, 14: 6, 15: 7 },
  ft20: { 12: 10, 13: 11, 14: 12, 15: 13 },
  spot25: { 12: 11, 13: 12, 14: 13, 15: 14 }
};

export function targetFor(chId, age) {
  const t = TARGETS[chId] || {};
  const ages = Object.keys(t).map(Number).sort((a, b) => a - b);
  if (!ages.length) return Math.max(1, Math.ceil(((CHALLENGES[chId] || {}).max || 20) / 2));
  const a = Math.max(ages[0], Math.min(ages[ages.length - 1], Math.round(Number(age)) || ages[0]));
  return t[a] || t[ages[0]];
}

export function challengeXp(chId, value, age) {
  if (typeof value !== "number" || !(value > 0)) return 0;
  return Math.round(XP_RULES.challenge * Math.min(1, value / targetFor(chId, age)));
}

// XP for one day. blocksDone: number of finished blocks. pb: set a new personal best today
// (challenge or test; a first-ever result is a baseline, not a PB). streak: streak after today.
export function dayXp({ blocksDone, chId, value, age, pb, complete, streak }) {
  const parts = {
    blocks: Math.max(0, blocksDone | 0) * XP_RULES.block,
    challenge: chId ? challengeXp(chId, value, age) : 0,
    pb: pb ? XP_RULES.pb : 0,
    streak: complete ? Math.min(XP_RULES.streakMax, Math.max(0, streak | 0)) : 0
  };
  parts.total = Math.min(XP_RULES.dayMax, parts.blocks + parts.challenge + parts.pb + parts.streak);
  return parts;
}

export const fmtXp = (n) => Number(n || 0).toLocaleString("en-US");
