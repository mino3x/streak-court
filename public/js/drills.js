// Animation specs for every drill, plus the lookup from a drill name to its animation.
// Side view: figure faces +x (right). Front view: figure faces the viewer.
// Poses use absolute joint angles in degrees (0 = limb straight down, + = forward / outward).
// Poses with `py` place the pelvis at that height and solve the legs so the feet stay planted.
import { mirrorSpec } from "./anim.js";

const M = (...o) => Object.assign({}, ...o);
const NOIK = { py: null };

// ---------- side-view poses ----------
const ARMS_REST = { lu: 6, lf: 14, ru: -4, rf: 6 };
const STAND = M({ t: 3, h: 0, py: 0.79, x: 0, lfoot: 0.07, rfoot: -0.05, lfa: 90, rfa: 90 }, ARMS_REST);
const READY = { t: 26, h: -20, py: 0.62, lfoot: 0.2, rfoot: -0.14, lu: 30, lf: 80, ru: 22, rf: 75 };
const SQUAT = { t: 40, h: -25, py: 0.44, lfoot: 0.12, rfoot: 0.08, lu: 85, lf: 90, ru: 85, rf: 90 };
const HALF = { t: 30, h: -20, py: 0.58, lfoot: 0.14, rfoot: 0.06, lu: 45, lf: 75, ru: 40, rf: 70 };
const DIP_BACK = { t: 42, h: -25, py: 0.52, lfoot: 0.14, rfoot: 0.06, lu: -55, lf: -40, ru: -55, rf: -40 };
const AIR_UP = M(NOIK, { t: 4, h: 0, lt: 4, ls: 0, rt: 4, rs: 0, lfa: 150, rfa: 150, lu: 172, lf: 176, ru: 168, rf: 172 });

const W_SIDE = { x0: -1.3, x1: 1.3, y0: -0.1, y1: 2.05 };
const W_WIDE = { x0: -2.1, x1: 2.1, y0: -0.1, y1: 2.2 };
const W_FLOOR = { x0: -1.2, x1: 1.4, y0: -0.1, y1: 1.3 };

// Running / skipping cycle that travels along x.
function strideKF({ t0, t1, x0, x1, steps, knee = 38, back = 25, lean = 12, air = 0.05, arm = 42, skip = false, e = "lin" }) {
  const out = [];
  for (let i = 0; i <= steps * 2; i++) {
    const tt = t0 + (t1 - t0) * i / (steps * 2), x = x0 + (x1 - x0) * i / (steps * 2);
    const leg = Math.floor(i / 2) % 2 === 0;           // which leg leads this step
    if (i % 2 === 0) {
      const lead = { t: knee, s: skip ? -60 : knee * 0.15 }, trail = { t: -back, s: -back - 45 };
      const L = leg ? lead : trail, R = leg ? trail : lead;
      out.push({ t: tt, e, p: M(NOIK, { x, air: skip ? 0.02 : 0, t: lean, h: -lean * 0.5,
        lt: skip && leg ? 85 : L.t, ls: L.s, rt: skip && !leg ? 85 : R.t, rs: R.s, lfa: 95, rfa: 95,
        lu: leg ? -arm : arm, lf: leg ? -arm * 0.3 : arm + 60, ru: leg ? arm : -arm, rf: leg ? arm + 60 : -arm * 0.3 }) });
    } else {
      out.push({ t: tt, e, p: M(NOIK, { x, air, t: lean, h: -lean * 0.5, lt: 12, ls: -55, rt: 8, rs: -60, lu: 0, lf: 50, ru: 0, rf: 50 }) });
    }
  }
  return out;
}
const lab = (x, y, text, t0, t1, extra) => M({ x, y, text, t0, t1 }, extra || {});

export const ANIMS = {};
const A = (id, spec) => { ANIMS[id] = spec; return spec; };

// ================= WARM-UP =================
A("jog_skip", { view: "side", dur: 4.0, world: W_WIDE,
  kf: [...strideKF({ t0: 0, t1: 1.9, x0: -1.7, x1: -0.1, steps: 3 }), ...strideKF({ t0: 2.0, t1: 4.0, x0: 0.0, x1: 1.6, steps: 2, skip: true, air: 0.16, arm: 60 })],
  props: { labels: [lab(-0.9, 2.0, "JOG", 0, 1.95), lab(0.8, 2.0, "SKIP", 2.0, 4.0)] } });

A("jog_skip_back", { view: "side", dur: 5.4, world: W_WIDE,
  kf: [...strideKF({ t0: 0, t1: 1.6, x0: -1.7, x1: -0.4, steps: 3 }),
       ...strideKF({ t0: 1.7, t1: 3.4, x0: -0.3, x1: 1.4, steps: 2, skip: true, air: 0.16, arm: 60 }),
       ...strideKF({ t0: 3.5, t1: 5.4, x0: 1.4, x1: -1.7, steps: 3, knee: 10, back: 30, lean: 8 })],
  props: { labels: [lab(-1.0, 2.0, "JOG", 0, 1.6), lab(0.5, 2.0, "SKIP", 1.7, 3.4), lab(0, 2.0, "BACKPEDAL", 3.5, 5.4)] } });

A("buildup", { view: "side", dur: 3.0, world: W_WIDE,
  kf: [...strideKF({ t0: 0, t1: 1.6, x0: -1.8, x1: -0.3, steps: 2, knee: 30, arm: 30 }), ...strideKF({ t0: 1.6, t1: 3.0, x0: -0.3, x1: 1.9, steps: 3, knee: 50, back: 35, lean: 18, arm: 55 }).slice(1)],
  props: { labels: [lab(-1.1, 2.0, "EASY", 0, 1.5), lab(1.0, 2.0, "FAST", 1.6, 3.0, { accent: 1 })] } });

A("shuffle_carioca", { view: "front", dur: 4.0, world: { x0: -2.0, x1: 2.0, y0: -0.1, y1: 2.1 },
  base: { py: 0.7, t: 0, lu: 50, lf: 40, ru: 50, rf: 40 },
  kf: [
    { t: 0.0, p: { x: -1.3, lfoot: -1.05, rfoot: -1.55 } },
    { t: 0.35, p: { x: -1.05, lfoot: -0.6, rfoot: -1.5, py: 0.72 } },
    { t: 0.7, p: { x: -0.75, lfoot: -0.55, rfoot: -0.95 } },
    { t: 1.05, p: { x: -0.5, lfoot: -0.1, rfoot: -0.9, py: 0.72 } },
    { t: 1.4, p: { x: -0.2, lfoot: 0.0, rfoot: -0.4 } },
    { t: 1.75, p: { x: 0.1, lfoot: 0.45, rfoot: -0.35, py: 0.72 } },
    { t: 2.1, p: { x: 0.35, lfoot: 0.55, rfoot: 0.15 } },
    // carioca back: legs cross
    { t: 2.6, p: { x: 0.15, lfoot: 0.05, rfoot: 0.3, py: 0.74, lu: 60, ru: 60 } },
    { t: 3.1, p: { x: -0.25, lfoot: -0.2, rfoot: -0.5 } },
    { t: 3.55, p: { x: -0.7, lfoot: -1.0, rfoot: -0.55, py: 0.74 } },
    { t: 4.0, p: { x: -1.3, lfoot: -1.05, rfoot: -1.55, py: 0.7 } }
  ],
  props: { labels: [lab(-0.4, 2.0, "SHUFFLE →", 0, 2.1), lab(-0.4, 2.0, "← CARIOCA", 2.2, 4.0)] } });

A("lunge_twist", { view: "side", dur: 3.6, world: W_WIDE, base: STAND,
  kf: [
    { t: 0, p: M(STAND, { x: -1.0, lfoot: -0.95, rfoot: -1.05 }) },
    { t: 0.7, p: { x: -0.65, py: 0.45, t: 4, lfoot: -0.25, rfoot: -1.05, rfooty: 0.08, lu: 80, lf: 80, ru: 80, rf: 80 } },
    { t: 1.2, p: { x: -0.65, py: 0.45, t: 4, lfoot: -0.25, rfoot: -1.05, rfooty: 0.08, lu: 60, lf: 150, ru: 100, rf: 20 } },
    { t: 1.6, p: { x: -0.65, py: 0.45, t: 4, lfoot: -0.25, rfoot: -1.05, rfooty: 0.08, lu: 80, lf: 80, ru: 80, rf: 80 } },
    { t: 2.1, p: M(STAND, { x: -0.25, lfoot: -0.25, rfoot: -0.2 }) },
    { t: 2.8, p: { x: 0.15, py: 0.45, t: 4, rfoot: 0.55, lfoot: -0.25, lfooty: 0.08, rfooty: 0.04, lu: 80, lf: 80, ru: 80, rf: 80 } },
    { t: 3.2, p: { x: 0.15, py: 0.45, t: 4, rfoot: 0.55, lfoot: -0.25, lfooty: 0.08, ru: 60, rf: 150, lu: 100, lf: 20 } },
    { t: 3.6, p: M(STAND, { x: 0.55, lfoot: 0.55, rfoot: 0.6 }) }
  ],
  props: { labels: [lab(0, 2.0, "STEP · DROP · TWIST")] } });

A("lunge_3d", { view: "side", dur: 5.4, world: W_SIDE,
  kf: [
    { t: 0, p: STAND },
    { t: 0.7, p: { py: 0.42, t: 4, lfoot: 0.46, rfoot: -0.42, rfooty: 0.08, lu: 20, lf: 90, ru: 20, rf: 90 } },
    { t: 1.3, p: STAND },
    { t: 2.1, p: { py: 0.5, t: 30, lfoot: 0.08, rfoot: -0.02, lu: 60, lf: 80, ru: 60, rf: 80 } },
    { t: 2.8, p: STAND },
    { t: 3.6, p: { py: 0.42, t: 6, lfoot: 0.16, rfoot: -0.62, rfooty: 0.08, lu: 20, lf: 90, ru: 20, rf: 90 } },
    { t: 4.4, p: STAND },
    { t: 5.4, p: STAND }
  ],
  props: { labels: [lab(0, 1.95, "FRONT", 0.3, 1.3), lab(0, 1.95, "SIDE", 1.8, 2.8), lab(0, 1.95, "BACK", 3.2, 4.4)] } });

A("balance_waist", { view: "front", dur: 2.4,
  base: { t: 0, py: 0.8, x: 0.0, lfoot: 0.1, rfoot: -0.09, rfooty: 0.4, lu: 25, lf: 110, ru: 25, rf: 110, luz: 0.7, ruz: 0.7 },
  kf: [{ t: 0, p: {} }, { t: 1.2, p: { t: 2 } }, { t: 2.4, p: {} }],
  ball: [
    { t: 0, mid: ["hipL", "hipR"], dy: 0.12, z: 1, e: "lin" },
    { t: 0.6, mid: ["hipL", "hipR"], dx: 0.34, dy: 0.12, z: 0, e: "lin" },
    { t: 1.2, mid: ["hipL", "hipR"], dy: 0.12, z: -1, e: "lin" },
    { t: 1.8, mid: ["hipL", "hipR"], dx: -0.34, dy: 0.12, z: 0, e: "lin" }
  ],
  props: { labels: [lab(0, 1.95, "ONE LEG · BALL AROUND WAIST")] } });

A("eyes_closed_balance", { view: "front", dur: 3.0,
  base: { t: 0, py: 0.8, x: 0.0, lfoot: 0.1, rfoot: -0.09, rfooty: 0.4, lu: 50, lf: 60, ru: 50, rf: 60 },
  kf: [{ t: 0, p: { t: -2 } }, { t: 1.5, p: { t: 2, x: 0.01 } }, { t: 3.0, p: { t: -2 } }],
  props: { labels: [lab(0, 1.95, "EYES CLOSED · STAY TALL")] } });

A("balance_walltoss", { view: "side", dur: 1.6, world: { x0: -1.0, x1: 1.6, y0: -0.1, y1: 2.05 },
  base: M(NOIK, { t: 4, lt: 0, ls: 0, rt: 75, rs: -5, lu: 70, lf: 110, ru: 70, rf: 110 }),
  kf: [{ t: 0, p: {} }, { t: 0.3, p: { lu: 85, lf: 90, ru: 85, rf: 90 } }, { t: 0.9, p: {} }, { t: 1.6, p: {} }],
  ball: [{ t: 0, j: "handL", dx: 0.08, dy: 0.05 }, { t: 0.35, j: "handL", dx: 0.12, e: "lin" }, { t: 0.7, x: 1.32, y: 1.35, e: "lin" }, { t: 1.05, j: "handL", dx: 0.08, dy: 0.05 }],
  props: { wall: 1.45, labels: [lab(0.2, 1.95, "ONE LEG · TOSS & CATCH")] } });

A("squat_jump_stick", { view: "side", dur: 3.2,
  kf: [
    { t: 0, p: STAND },
    { t: 0.6, p: DIP_BACK, e: "out" },
    { t: 0.85, p: AIR_UP, e: "in" },
    { t: 1.1, p: M(AIR_UP, { air: 0.3, lu: 150, ru: 150 }), e: "in" },
    { t: 1.35, p: M(HALF, { lu: 70, lf: 80, ru: 70, rf: 80 }) },
    { t: 2.4, p: M(HALF, { lu: 70, lf: 80, ru: 70, rf: 80 }) },
    { t: 3.2, p: STAND }
  ],
  props: { labels: [lab(0, 1.95, "STICK IT · 2 s", 1.35, 2.4, { accent: 1 })] } });
ANIMS.squat_jump_stick.kf[2].p = M(AIR_UP, { air: 0.02 });

A("cmj_stick", { view: "side", dur: 3.2,
  kf: [
    { t: 0, p: M(STAND, { lu: 60, lf: 70, ru: 60, rf: 70 }) },
    { t: 0.45, p: M(DIP_BACK, { lu: -65, ru: -65 }), e: "out" },
    { t: 0.75, p: M(AIR_UP, { air: 0.04 }), e: "out" },
    { t: 1.0, p: M(AIR_UP, { air: 0.45 }), e: "in" },
    { t: 1.3, p: M(HALF, { lu: 70, lf: 80, ru: 70, rf: 80 }) },
    { t: 2.4, p: M(HALF, { lu: 70, lf: 80, ru: 70, rf: 80 }) },
    { t: 3.2, p: STAND }
  ],
  props: { labels: [lab(0, 1.95, "MAX JUMP · STICK 2 s", 1.3, 2.4, { accent: 1 })] } });

A("plank_taps", { view: "side", dur: 2.0, world: W_FLOOR,
  base: M(NOIK, { t: 0, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 90, rfa: 90, lu: 90, lf: 90, ru: 90, rf: 90, c: ["toeR", "handR"], x: -0.75 }),
  kf: [{ t: 0, p: {} }, { t: 0.45, p: { lu: 30, lf: 150 } }, { t: 0.8, p: {} }, { t: 1.2, p: {} }, { t: 1.6, p: { lu: 60, lf: 120 } }, { t: 2.0, p: {} }],
  props: { labels: [lab(0.1, 1.15, "HIPS STILL · TAP SHOULDERS")] } });

A("glute_bridge", { view: "side", dur: 2.6, world: W_FLOOR,
  base: M(NOIK, { t: 0, lu: 0, lf: 0, ru: 0, rf: 0, lfa: 90, rfa: 90, c: ["neck", "ankleR"], x: -0.75 }),
  kf: [
    { t: 0, p: { lt: 62, ls: -70, rt: 62, rs: -70 } },
    { t: 0.9, p: { lt: -8, ls: -100, rt: -8, rs: -100 } },
    { t: 1.6, p: { lt: -8, ls: -100, rt: -8, rs: -100 } },
    { t: 2.6, p: { lt: 62, ls: -70, rt: 62, rs: -70 } }
  ],
  props: { labels: [lab(0.1, 1.15, "SQUEEZE AT THE TOP", 0.9, 1.7, { accent: 1 })] } });

A("sl_glute_bridge", { view: "side", dur: 2.6, world: W_FLOOR,
  base: M(NOIK, { t: 0, lu: 0, lf: 0, ru: 0, rf: 0, lfa: 90, rfa: 90, c: ["neck", "ankleR"], x: -0.75 }),
  kf: [
    { t: 0, p: { lt: 50, ls: -75, rt: 50, rs: -75 } },
    { t: 0.4, p: { lt: 60, ls: 50, rt: 50, rs: -75 } },
    { t: 1.2, p: { lt: 20, ls: 20, rt: 0, rs: -95 } },
    { t: 1.8, p: { lt: 20, ls: 20, rt: 0, rs: -95 } },
    { t: 2.6, p: { lt: 50, ls: -75, rt: 50, rs: -75 } }
  ],
  props: { labels: [lab(0.1, 1.15, "ONE LEG · HIPS LEVEL")] } });

A("nordic", { view: "side", dur: 4.4, world: { x0: -1.2, x1: 1.4, y0: -0.1, y1: 1.6 },
  base: M(NOIK, { lfa: 70, rfa: 70, ls: -90, rs: -90, c: ["ankleR", "kneeR"], x: -0.55, lu: 40, lf: 100, ru: 40, rf: 100 }),
  kf: [
    { t: 0, p: { t: 0, lt: 0, rt: 0 } },
    { t: 2.6, p: { t: 62, lt: -62, rt: -62, h: -10, lu: 80, lf: 80, ru: 80, rf: 80 }, e: "out" },
    { t: 3.0, p: { t: 75, lt: -75, rt: -75, h: -20, lu: 90, lf: 90, ru: 90, rf: 90 } },
    { t: 3.7, p: { t: 30, lt: -40, rt: -40, lu: 60, lf: 90 } },
    { t: 4.4, p: { t: 0, lt: 0, rt: 0 } }
  ],
  props: { anchor: { x: -0.95, w: 0.35, h: 0.2 }, labels: [lab(0.1, 1.5, "LOWER SLOWLY", 0.2, 2.6, { accent: 1 }), lab(0.1, 1.5, "CATCH · PUSH BACK UP", 2.8, 4.2)] } });

// ================= ATHLETIC: speed / agility =================
A("fast_feet_line", { view: "side", dur: 0.8,
  base: M(READY, { t: 18, py: 0.7 }),
  kf: [{ t: 0, p: { lfoot: 0.22, rfoot: -0.05, lfooty: 0.04, rfooty: 0.1 }, e: "lin" }, { t: 0.2, p: { lfoot: 0.0, rfoot: 0.2, lfooty: 0.1, rfooty: 0.04 }, e: "lin" }, { t: 0.4, p: { lfoot: -0.12, rfoot: 0.05, lfooty: 0.04, rfooty: 0.1 }, e: "lin" }, { t: 0.6, p: { lfoot: 0.1, rfoot: -0.15, lfooty: 0.1, rfooty: 0.04 }, e: "lin" }],
  props: { lines: [0.05], labels: [lab(0, 1.95, "TINY · QUICK · LIGHT")] } });

A("in_out_feet", { view: "front", dur: 0.8,
  base: { t: 0, py: 0.72, lu: 30, lf: 90, ru: 30, rf: 90, luz: 0.8, ruz: 0.8 },
  kf: [{ t: 0, p: { lfoot: 0.12, rfoot: -0.12 }, e: "lin" }, { t: 0.2, p: { lfoot: 0.4, rfoot: -0.12, lfooty: 0.08 }, e: "lin" }, { t: 0.4, p: { lfoot: 0.4, rfoot: -0.4, lfooty: 0.04 }, e: "lin" }, { t: 0.6, p: { lfoot: 0.12, rfoot: -0.4, rfooty: 0.08 }, e: "lin" }],
  props: { labels: [lab(0, 1.95, "IN · IN · OUT · OUT")] } });

A("reaction_start", { view: "side", dur: 4.4, world: W_WIDE,
  kf: [
    { t: 0, p: M(READY, { x: -1.4, lfoot: -1.2, rfoot: -1.55 }) },
    { t: 0.7, p: M(READY, { x: -1.4, lfoot: -1.2, rfoot: -1.55, py: 0.64 }) },
    { t: 1.4, p: M(READY, { x: -1.4, lfoot: -1.2, rfoot: -1.55 }) },
    ...strideKF({ t0: 1.5, t1: 2.6, x0: -1.3, x1: 1.4, steps: 3, knee: 55, back: 35, lean: 22, arm: 60 }),
    ...strideKF({ t0: 2.8, t1: 4.4, x0: 1.4, x1: -1.4, steps: 3, knee: 8, back: 15, lean: 4, arm: 10 })
  ],
  signals: [{ t0: 1.45, t1: 1.95, text: "GO!", x: 0, y: 1.95 }],
  props: { labels: [lab(0, 1.95, "WAIT FOR GO", 0, 1.4), lab(0, 1.95, "WALK BACK", 2.8, 4.4)] } });

A("sprint_stop", { view: "side", dur: 3.2, world: W_WIDE,
  kf: [
    ...strideKF({ t0: 0, t1: 1.1, x0: -1.8, x1: 0.2, steps: 3, knee: 50, back: 35, lean: 20, arm: 55 }),
    { t: 1.35, p: M(READY, { x: 0.55, lfoot: 0.9, rfoot: 0.35, t: 10, h: -10 }) },
    { t: 1.55, p: M(READY, { x: 0.75, lfoot: 0.95, rfoot: 0.5 }) },
    { t: 2.6, p: M(READY, { x: 0.75, lfoot: 0.95, rfoot: 0.5 }) },
    { t: 3.2, p: M(STAND, { x: 0.75, lfoot: 0.8, rfoot: 0.7 }) }
  ],
  props: { labels: [lab(0, 2.0, "SPRINT", 0, 1.1), lab(0.7, 2.0, "STOP IN 2 · HOLD", 1.3, 2.7, { accent: 1 })] } });

A("closeout_chop", { view: "side", dur: 2.8, world: W_WIDE,
  kf: [
    ...strideKF({ t0: 0, t1: 0.9, x0: -1.8, x1: -0.3, steps: 2, knee: 45, lean: 18, arm: 50 }),
    { t: 1.05, p: M(READY, { x: -0.05, lfoot: 0.15, rfoot: -0.2, lu: 150, lf: 170 }), e: "lin" },
    { t: 1.25, p: M(READY, { x: 0.05, lfoot: 0.25, rfoot: -0.12, lfooty: 0.1, lu: 165, lf: 175 }), e: "lin" },
    { t: 1.45, p: M(READY, { x: 0.12, lfoot: 0.3, rfoot: -0.02, rfooty: 0.1, lu: 165, lf: 175 }), e: "lin" },
    { t: 1.65, p: M(READY, { x: 0.18, lfoot: 0.35, rfoot: 0.02, lfooty: 0.1, lu: 170, lf: 178 }), e: "lin" },
    { t: 1.85, p: M(READY, { x: 0.2, lfoot: 0.38, rfoot: 0.04, lu: 172, lf: 178 }) },
    { t: 2.8, p: M(READY, { x: 0.2, lfoot: 0.38, rfoot: 0.04, lu: 172, lf: 178 }) }
  ],
  props: { labels: [lab(-1.0, 2.0, "SPRINT", 0, 0.9), lab(0.3, 2.0, "CHOP · HAND HIGH", 1.0, 2.8, { accent: 1 })] } });

A("wall_drive", { view: "side", dur: 1.2, world: { x0: -1.4, x1: 1.4, y0: -0.1, y1: 2.0 },
  base: M(NOIK, { rot: -42, t: 0, h: -5, lu: 128, lf: 128, ru: 128, rf: 128, lfa: 130, rfa: 130 }),
  kf: [
    { t: 0, p: { lt: 95, ls: 0, rt: 0, rs: 0 }, e: "lin" },
    { t: 0.3, p: { lt: 95, ls: 0, rt: 0, rs: 0 }, e: "out" },
    { t: 0.45, p: { lt: 0, ls: 0, rt: 95, rs: 0 }, e: "lin" },
    { t: 0.9, p: { lt: 0, ls: 0, rt: 95, rs: 0 }, e: "out" },
    { t: 1.05, p: { lt: 95, ls: 0, rt: 0, rs: 0 } }
  ],
  props: { wall: 0.62, labels: [lab(-0.4, 1.9, "DRIVE THE KNEE · SWITCH FAST")] } });

A("falling_start", { view: "side", dur: 3.0, world: W_WIDE,
  kf: [
    { t: 0, p: M(STAND, { x: -1.5, lfoot: -1.45, rfoot: -1.55, py: null, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 120, rfa: 120 }) },
    { t: 0.9, p: M(NOIK, { x: -1.5, rot: -22, t: 0, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 130, rfa: 130, lu: 6, lf: 14, ru: -4, rf: 6 }), e: "in" },
    ...strideKF({ t0: 1.1, t1: 3.0, x0: -1.1, x1: 1.9, steps: 4, knee: 55, back: 35, lean: 25, arm: 60 })
  ],
  props: { labels: [lab(-1.2, 2.0, "LEAN… FALL…", 0, 1.0), lab(0.6, 2.0, "SPRINT!", 1.1, 3.0, { accent: 1 })] } });

A("pogo", { view: "side", dur: 1.2,
  base: M(NOIK, { t: 4, lt: 4, ls: 0, rt: 4, rs: 0, lfa: 140, rfa: 140, lu: 20, lf: 95, ru: 20, rf: 95 }),
  kf: [{ t: 0, p: { air: 0 }, e: "out" }, { t: 0.2, p: { air: 0.13 }, e: "in" }, { t: 0.4, p: { air: 0 }, e: "out" }, { t: 0.6, p: { air: 0.13 }, e: "in" }, { t: 0.8, p: { air: 0 }, e: "out" }, { t: 1.0, p: { air: 0.13 }, e: "in" }],
  props: { labels: [lab(0, 1.95, "STIFF ANKLES · QUICK")] } });

A("snapdown", { view: "side", dur: 2.4,
  kf: [
    { t: 0, p: M(STAND) },
    { t: 0.5, p: M(AIR_UP, { air: 0 }), e: "in" },
    { t: 0.75, p: M(HALF, { lu: -30, lf: -10, ru: -30, rf: -10 }) },
    { t: 1.7, p: M(HALF, { lu: -30, lf: -10, ru: -30, rf: -10 }) },
    { t: 2.4, p: STAND }
  ],
  props: { labels: [lab(0, 1.95, "UP ON TOES", 0.2, 0.55), lab(0, 1.95, "SNAP · QUIET LANDING", 0.7, 1.8, { accent: 1 })] } });

A("line_hops", { view: "side", dur: 1.2,
  base: { t: 18, h: -12, lu: 20, lf: 80, ru: 20, rf: 80 },
  kf: [
    { t: 0, p: M(HALF, { x: -0.28, lfoot: -0.2, rfoot: -0.28, lu: 20, ru: 20 }), e: "out" },
    { t: 0.3, p: M(AIR_UP, { x: 0, air: 0.14, lu: 40, lf: 80, ru: 40, rf: 80 }), e: "in" },
    { t: 0.6, p: M(HALF, { x: 0.28, lfoot: 0.36, rfoot: 0.28, lu: 20, ru: 20 }), e: "out" },
    { t: 0.9, p: M(AIR_UP, { x: 0, air: 0.14, lu: 40, lf: 80, ru: 40, rf: 80 }), e: "in" }
  ],
  props: { lines: [0.04], labels: [lab(0, 1.95, "FORWARD · BACK · TWO FEET")] } });

A("broad_jump", { view: "side", dur: 3.0, world: { x0: -1.7, x1: 1.9, y0: -0.1, y1: 2.1 },
  kf: [
    { t: 0, p: M(STAND, { x: -1.15, lfoot: -1.1, rfoot: -1.2 }) },
    { t: 0.55, p: M(DIP_BACK, { x: -1.25, lfoot: -1.1, rfoot: -1.2, lu: -70, ru: -70 }), e: "out" },
    { t: 0.8, p: M(NOIK, { x: -0.95, air: 0.08, t: 40, h: -20, lt: -20, ls: -20, rt: -20, rs: -20, lfa: 150, rfa: 150, lu: 150, lf: 160, ru: 150, rf: 160 }), e: "lin" },
    { t: 1.05, p: M(NOIK, { x: -0.25, air: 0.45, t: 25, h: -15, lt: 70, ls: 5, rt: 70, rs: 5, lu: 110, lf: 120, ru: 110, rf: 120 }), e: "in" },
    { t: 1.3, p: M(HALF, { x: 0.35, lfoot: 0.5, rfoot: 0.42, lu: 80, lf: 85, ru: 80, rf: 85 }) },
    { t: 2.4, p: M(HALF, { x: 0.35, lfoot: 0.5, rfoot: 0.42, lu: 80, lf: 85, ru: 80, rf: 85 }) },
    { t: 3.0, p: M(STAND, { x: 0.4, lfoot: 0.5, rfoot: 0.42 }) }
  ],
  props: { lines: [-1.02], labels: [lab(0.4, 2.0, "STICK · MEASURE TO HEEL", 1.3, 3.0, { accent: 1 })] } });

A("sl_hop_stick", { view: "side", dur: 2.4, world: { x0: -1.3, x1: 1.5, y0: -0.1, y1: 2.05 },
  base: { ru: 20, rf: 80, lu: 20, lf: 80 },
  kf: [
    { t: 0, p: M(NOIK, { x: -0.5, t: 10, lt: 5, ls: 0, rt: -15, rs: -95 }) },
    { t: 0.45, p: M(NOIK, { x: -0.5, t: 30, lt: 45, ls: -15, rt: -10, rs: -95, lu: -30, ru: -30, lf: -20, rf: -20 }), e: "out" },
    { t: 0.7, p: M(NOIK, { x: -0.1, t: 20, air: 0.18, lt: 10, ls: -10, rt: 0, rs: -90, lfa: 140, lu: 90, lf: 100, ru: 90, rf: 100 }), e: "in" },
    { t: 0.95, p: M(NOIK, { x: 0.35, t: 30, lt: 45, ls: -15, rt: -10, rs: -95, lu: 60, lf: 80, ru: 60, rf: 80 }) },
    { t: 1.9, p: M(NOIK, { x: 0.35, t: 30, lt: 45, ls: -15, rt: -10, rs: -95, lu: 60, lf: 80, ru: 60, rf: 80 }) },
    { t: 2.4, p: M(NOIK, { x: 0.35, t: 10, lt: 5, ls: 0, rt: -15, rs: -95 }) }
  ],
  props: { labels: [lab(0.2, 1.95, "HOLD 3 s", 0.95, 1.9, { accent: 1 })] } });

A("skater", { view: "front", dur: 3.0, world: { x0: -1.8, x1: 1.8, y0: -0.1, y1: 2.1 },
  base: { lu: 40, lf: 40, ru: 40, rf: 40 },
  kf: [
    { t: 0, p: { x: -0.75, py: 0.68, t: -8, rfoot: -0.8, lfoot: -0.45, lfooty: 0.3 } },
    { t: 0.35, p: { x: -0.8, py: 0.6, t: -12, rfoot: -0.8, lfoot: -0.5, lfooty: 0.3 } },
    { t: 0.65, p: { x: 0.0, py: 1.0, t: 0, rfoot: -0.3, lfoot: 0.3, rfooty: 0.35, lfooty: 0.3 }, e: "in" },
    { t: 0.9, p: { x: 0.75, py: 0.62, t: 10, lfoot: 0.8, rfoot: 0.45, rfooty: 0.3 } },
    { t: 1.5, p: { x: 0.75, py: 0.62, t: 10, lfoot: 0.8, rfoot: 0.45, rfooty: 0.3 } },
    { t: 1.85, p: { x: 0.8, py: 0.6, t: 12, lfoot: 0.8, rfoot: 0.5, rfooty: 0.3 } },
    { t: 2.15, p: { x: 0.0, py: 1.0, t: 0, lfoot: 0.3, rfoot: -0.3, lfooty: 0.35, rfooty: 0.3 }, e: "in" },
    { t: 2.4, p: { x: -0.75, py: 0.62, t: -10, rfoot: -0.8, lfoot: -0.45, lfooty: 0.3, rfooty: 0.04 } },
    { t: 3.0, p: { x: -0.75, py: 0.68, t: -8, rfoot: -0.8, lfoot: -0.45, lfooty: 0.3 } }
  ],
  props: { labels: [lab(0, 1.95, "BOUND · LAND ON ONE LEG · HOLD")] } });

// ================= ATHLETIC: defense =================
const DEF = { t: 0, py: 0.62, lfoot: 0.42, rfoot: -0.42, lu: 70, lf: 40, ru: 70, rf: 40 };
A("def_stance", { view: "front", dur: 2.0,
  kf: [
    { t: 0, p: M(DEF, { lu: 150, lf: 170, ru: 55, rf: 30 }) },
    { t: 0.5, p: M(DEF, { py: 0.6, lu: 55, lf: 30, ru: 150, rf: 170 }) },
    { t: 1.0, p: M(DEF, { lu: 150, lf: 170, ru: 55, rf: 30 }) },
    { t: 1.5, p: M(DEF, { py: 0.6, lu: 55, lf: 30, ru: 150, rf: 170 }) }
  ],
  props: { labels: [lab(0, 1.95, "WIDE · LOW · ACTIVE HANDS")] } });

function slideKF(x0, x1, t0, t1, steps) {
  const out = [], dir = Math.sign(x1 - x0);
  for (let i = 0; i <= steps * 2; i++) {
    const tt = t0 + (t1 - t0) * i / (steps * 2), x = x0 + (x1 - x0) * i / (steps * 2);
    const wide = i % 2 === 1;
    out.push({ t: tt, e: "lin", p: M(DEF, { x, lfoot: x + (wide ? (dir > 0 ? 0.55 : 0.28) : 0.36), rfoot: x - (wide ? (dir > 0 ? 0.28 : 0.55) : 0.36) }) });
  }
  return out;
}
A("slides", { view: "front", dur: 4.0, world: { x0: -2.0, x1: 2.0, y0: -0.1, y1: 2.1 },
  kf: [
    ...slideKF(-0.95, 0.95, 0, 1.6, 3),
    { t: 1.9, p: M(DEF, { x: 1.05, lfoot: 1.5, rfoot: 0.7, py: 0.52, t: 18, lu: 15, lf: 10, ru: 80, rf: 60 }) },
    ...slideKF(0.95, -0.95, 2.1, 3.6, 3),
    { t: 3.85, p: M(DEF, { x: -1.05, rfoot: -1.5, lfoot: -0.7, py: 0.52, t: -18, ru: 15, rf: 10, lu: 80, lf: 60 }) },
    { t: 4.0, p: M(DEF, { x: -0.95, lfoot: -0.59, rfoot: -1.31 }) }
  ],
  props: { lines: [-1.5, 1.5], labels: [lab(0, 1.95, "PUSH · STAY LOW · TOUCH THE LINE")] } });

A("arrow_slides", { view: "front", dur: 4.4, world: { x0: -2.0, x1: 2.0, y0: -0.1, y1: 2.1 },
  kf: [
    { t: 0, p: M(DEF, { x: 0, lfoot: 0.36, rfoot: -0.36 }) },
    ...slideKF(0, 0.9, 0.3, 1.1, 2),
    ...slideKF(0.9, 0.0, 1.4, 2.2, 2),
    ...slideKF(0.0, -0.9, 2.5, 3.3, 2),
    ...slideKF(-0.9, 0.0, 3.6, 4.4, 2)
  ],
  signals: [{ t0: 0.1, t1: 0.6, arrow: "right", x: 0, y: 1.9 }, { t0: 1.2, t1: 1.7, arrow: "left", x: 0, y: 1.9 }, { t0: 2.3, t1: 2.8, arrow: "left", x: 0, y: 1.9 }, { t0: 3.4, t1: 3.9, arrow: "right", x: 0, y: 1.9 }] });

// ================= STRENGTH =================
const PLANK_HIGH = M(NOIK, { t: 0, h: 0, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 90, rfa: 90, lu: 90, lf: 90, ru: 90, rf: 90, c: ["toeR", "handR"], x: -0.72 });
const PUSH_DOWN = { lu: -35, lf: 85, ru: -35, rf: 85 };
function pushupSpec(opts) {
  const o = opts || {};
  const down = o.down || 1.0, up = o.up || 0.8;
  return { view: "side", dur: down + up + 0.4, world: o.world || W_FLOOR,
    base: M(PLANK_HIGH, o.base || {}),
    kf: [{ t: 0, p: {} }, { t: 0.2, p: {}, e: "io" }, { t: 0.2 + down, p: M(PUSH_DOWN, o.downPose || {}) }, { t: 0.4 + down, p: M(PUSH_DOWN, o.downPose || {}), e: "out" }, { t: 0.4 + down + up, p: {} }],
    props: o.props || {} };
}
A("pushup", pushupSpec({ props: { labels: [lab(0.1, 1.15, "BODY STRAIGHT · CHEST DOWN")] } }));
A("pushup_tempo", pushupSpec({ down: 3.0, up: 0.8, props: { labels: [lab(0.1, 1.15, "3 s DOWN", 0.2, 3.2, { accent: 1 }), lab(0.1, 1.15, "1 s UP", 3.4, 4.2)] } }));
A("pushup_incline", pushupSpec({ base: { cdy: 0.42 }, world: { x0: -1.3, x1: 1.3, y0: -0.1, y1: 1.5 }, props: { bench: { x: 0.08, w: 0.5, h: 0.42 }, labels: [lab(0, 1.4, "HANDS ON A BENCH · BODY STRAIGHT")] } }));
A("pushup_feetup", pushupSpec({ base: { cdy: -0.42, x: -0.8, air: 0.42 }, world: { x0: -1.3, x1: 1.3, y0: -0.1, y1: 1.5 }, props: { bench: { x: -1.2, w: 0.5, h: 0.42 }, labels: [lab(0, 1.4, "FEET UP · BODY STRAIGHT")] } }));

A("pike_pushup", { view: "side", dur: 2.4, world: W_FLOOR,
  base: M(NOIK, { t: 0, lt: 95, ls: 95, rt: 95, rs: 95, lfa: 90, rfa: 90, lu: 180, lf: 180, ru: 180, rf: 180, c: ["toeR", "handR"], x: -0.55, cdir: 1 }),
  kf: [{ t: 0, p: {} }, { t: 1.0, p: { lu: 120, lf: 200, ru: 120, rf: 200 } }, { t: 1.3, p: { lu: 120, lf: 200, ru: 120, rf: 200 } }, { t: 2.1, p: {} }],
  props: { labels: [lab(0.1, 1.2, "HIPS HIGH · HEAD TO FLOOR")] } });

A("bear_crawl", { view: "side", dur: 2.0, world: { x0: -1.6, x1: 1.6, y0: -0.1, y1: 1.3 },
  base: M(NOIK, { t: 0, lt: 90, ls: 0, rt: 90, rs: 0, lfa: 90, rfa: 90, lu: 90, lf: 90, ru: 90, rf: 90, c: ["toeR", "handR"] }),
  kf: [
    { t: 0, p: { x: -1.2 }, e: "lin" }, { t: 0.5, p: { x: -0.95, lt: 100, lu: 100, lf: 100 }, e: "lin" },
    { t: 1.0, p: { x: -0.7 }, e: "lin" }, { t: 1.5, p: { x: -0.45, lt: 80, lu: 80, lf: 80 }, e: "lin" }, { t: 2.0, p: { x: -0.2 } }
  ],
  props: { labels: [lab(0, 1.2, "KNEES JUST OFF THE FLOOR")] } });

A("plank", { view: "side", dur: 3.0, world: W_FLOOR,
  base: M(NOIK, { t: 0, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 90, rfa: 90, lu: 90, lf: 180, ru: 90, rf: 180, c: ["toeR", "elbowR"], x: -0.7 }),
  kf: [{ t: 0, p: {} }, { t: 1.5, p: { t: 1, lt: -1 } }, { t: 3.0, p: {} }],
  props: { labels: [lab(0.1, 1.15, "STRAIGHT LINE · SQUEEZE")] } });

A("plank_reach", { view: "side", dur: 2.4, world: W_FLOOR,
  base: M(PLANK_HIGH, {}),
  kf: [{ t: 0, p: {} }, { t: 0.6, p: { lu: 175, lf: 178 } }, { t: 1.0, p: { lu: 175, lf: 178 } }, { t: 1.4, p: {} }, { t: 2.4, p: {} }],
  props: { labels: [lab(0.1, 1.15, "REACH · HIPS DON'T MOVE")] } });

A("mountain_climbers", { view: "side", dur: 1.0, world: W_FLOOR,
  base: M(PLANK_HIGH, {}),
  kf: [{ t: 0, p: { lt: 95, ls: -20, rt: 0, rs: 0 } }, { t: 0.5, p: { lt: 0, ls: 0, rt: 95, rs: -20 } }],
  props: { labels: [lab(0.1, 1.15, "KNEE TO CHEST · HIPS LOW")] } });
A("mountain_climbers_slow", M(ANIMS.mountain_climbers, { dur: 2.0, _kf: null,
  kf: [{ t: 0, p: { lt: 95, ls: -20, rt: 0, rs: 0 } }, { t: 0.6, p: { lt: 95, ls: -20, rt: 0, rs: 0 } }, { t: 1.0, p: { lt: 0, ls: 0, rt: 95, rs: -20 } }, { t: 1.6, p: { lt: 0, ls: 0, rt: 95, rs: -20 } }],
  props: { labels: [lab(0.1, 1.15, "SLOW · KNEE TO CHEST")] } }));

A("dead_bug", { view: "side", dur: 3.2, world: W_FLOOR,
  base: M(NOIK, { t: 0, lfa: 90, rfa: 90, c: ["neck", "pelvis"], cdir: 1, x: -0.4, air: 0.06 }),
  kf: [
    { t: 0, p: { lu: 90, lf: 90, ru: 90, rf: 90, lt: 90, ls: 0, rt: 90, rs: 0 } },
    { t: 1.0, p: { lu: 175, lf: 178, ru: 90, rf: 90, lt: 90, ls: 0, rt: 12, rs: 12 } },
    { t: 1.6, p: { lu: 90, lf: 90, ru: 90, rf: 90, lt: 90, ls: 0, rt: 90, rs: 0 } },
    { t: 2.6, p: { lu: 90, lf: 90, ru: 175, rf: 178, lt: 12, ls: 12, rt: 90, rs: 0 } },
    { t: 3.2, p: { lu: 90, lf: 90, ru: 90, rf: 90, lt: 90, ls: 0, rt: 90, rs: 0 } }
  ],
  props: { labels: [lab(0.1, 1.2, "LOW BACK GLUED DOWN")] } });

A("hollow_hold", { view: "side", dur: 3.0, world: W_FLOOR,
  base: M(NOIK, { t: -12, h: 20, lfa: 90, rfa: 90, lu: 170, lf: 172, ru: 170, rf: 172, lt: 20, ls: 20, rt: 20, rs: 20, rot: 90, c: ["pelvis"], air: 0.06, x: 0.1 }),
  kf: [{ t: 0, p: {} }, { t: 1.5, p: { lt: 23, ls: 23, rt: 23, rs: 23, lu: 167, ru: 167 } }, { t: 3.0, p: {} }],
  props: { labels: [lab(0.1, 1.2, "ARMS BY EARS · BACK PRESSED DOWN")] } });
A("tuck_hollow", M(ANIMS.hollow_hold, { _kf: null,
  base: M(ANIMS.hollow_hold.base, { lt: 120, ls: 20, rt: 120, rs: 20, lu: 110, lf: 110, ru: 110, rf: 110 }),
  kf: [{ t: 0, p: {} }, { t: 1.5, p: { lt: 115, rt: 115 } }, { t: 3.0, p: {} }],
  props: { labels: [lab(0.1, 1.2, "KNEES TUCKED · BACK PRESSED DOWN")] } }));

A("superman", { view: "side", dur: 3.0, world: W_FLOOR,
  base: M(NOIK, { rot: -90, c: ["pelvis"], air: 0.06, x: -0.1, t: 0, h: 0, lu: 180, lf: 180, ru: 180, rf: 180, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 150, rfa: 150 }),
  kf: [{ t: 0, p: {} }, { t: 0.8, p: { t: -10, h: 0, lu: 196, lf: 196, ru: 196, rf: 196, lt: -10, ls: -10, rt: -10, rs: -10 } }, { t: 2.2, p: { t: -10, lu: 196, lf: 196, ru: 196, rf: 196, lt: -10, ls: -10, rt: -10, rs: -10 } }, { t: 3.0, p: {} }],
  props: { labels: [lab(0.1, 1.15, "LIFT ARMS & LEGS · LOOK DOWN")] } });

A("superman_w", { view: "side", dur: 2.4, world: W_FLOOR,
  base: M(NOIK, { rot: -90, c: ["pelvis"], air: 0.06, x: -0.1, t: 0, lu: 100, lf: 160, ru: 100, rf: 160, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 150, rfa: 150 }),
  kf: [{ t: 0, p: {} }, { t: 0.8, p: { t: -14, lu: 70, lf: 160, ru: 70, rf: 160 } }, { t: 1.6, p: { t: -14, lu: 70, lf: 160, ru: 70, rf: 160 } }, { t: 2.4, p: {} }],
  props: { labels: [lab(0.1, 1.15, "CHEST UP · SQUEEZE SHOULDER BLADES")] } });

A("bird_dog", { view: "side", dur: 3.6, world: W_FLOOR,
  base: M(NOIK, { t: 0, h: 0, lt: 90, ls: 0, rt: 90, rs: 0, lfa: 150, rfa: 150, lu: 90, lf: 90, ru: 90, rf: 90, c: ["kneeR", "handR"], x: -0.35 }),
  kf: [
    { t: 0, p: {} },
    { t: 0.8, p: { lu: 178, lf: 180, rt: 2, rs: 2, c: ["kneeL", "handR"] } },
    { t: 1.5, p: { lu: 178, lf: 180, rt: 2, rs: 2, c: ["kneeL", "handR"] } },
    { t: 1.8, p: { c: ["kneeR", "handR"] } },
    { t: 2.6, p: { ru: 178, rf: 180, lt: 2, ls: 2, c: ["kneeR", "handL"] } },
    { t: 3.3, p: { ru: 178, rf: 180, lt: 2, ls: 2, c: ["kneeR", "handL"] } },
    { t: 3.6, p: { c: ["kneeR", "handR"] } }
  ],
  props: { labels: [lab(0.1, 1.2, "OPPOSITE ARM + LEG · SLOW")] } });

A("side_plank", { view: "front", dur: 3.0, world: { x0: -1.3, x1: 1.3, y0: -0.1, y1: 1.4 },
  base: M(NOIK, { t: 0, lt: 2, ls: 2, rt: 2, rs: 2, ru: 88, rf: 150, ruz: 1, lu: 20, lf: 150, c: ["ankleR", "elbowR"], cdir: -1, x: 0.85 }),
  kf: [{ t: 0, p: {} }, { t: 1.5, p: { lu: 170, lf: 175 } }, { t: 3.0, p: {} }],
  props: { labels: [lab(0, 1.3, "STRAIGHT LINE · HIPS HIGH")] } });

A("slow_squat", { view: "side", dur: 4.4,
  kf: [{ t: 0, p: STAND }, { t: 0.3, p: M(STAND, { lu: 80, lf: 85, ru: 80, rf: 85 }) }, { t: 3.3, p: SQUAT }, { t: 3.5, p: SQUAT, e: "out" }, { t: 4.4, p: M(STAND, { lu: 80, lf: 85, ru: 80, rf: 85 }) }],
  props: { labels: [lab(0, 1.95, "3 s DOWN", 0.3, 3.3, { accent: 1 }), lab(0, 1.95, "STAND TALL", 3.5, 4.4)] } });

A("wall_sit", { view: "side", dur: 3.0, world: W_SIDE,
  base: { t: 0, h: 0, py: 0.46, x: -0.3, lfoot: 0.1, rfoot: 0.06, lu: 80, lf: 85, ru: 80, rf: 85 },
  kf: [{ t: 0, p: {} }, { t: 1.5, p: { py: 0.455 } }, { t: 3.0, p: {} }],
  props: { wall: -0.36, wallSide: -1, labels: [lab(0.3, 1.95, "THIGHS LEVEL · HOLD")] } });

A("reverse_lunge", { view: "side", dur: 3.6,
  kf: [
    { t: 0, p: STAND },
    { t: 0.8, p: { py: 0.44, t: 6, lfoot: 0.07, rfoot: -0.78, rfooty: 0.08, lu: 20, lf: 90, ru: 20, rf: 90 } },
    { t: 1.1, p: { py: 0.44, t: 6, lfoot: 0.07, rfoot: -0.78, rfooty: 0.08, lu: 20, lf: 90, ru: 20, rf: 90 } },
    { t: 1.8, p: STAND },
    { t: 2.6, p: { py: 0.44, t: 6, rfoot: -0.05, lfoot: -0.8, lfooty: 0.08, lu: 20, lf: 90, ru: 20, rf: 90 } },
    { t: 2.9, p: { py: 0.44, t: 6, rfoot: -0.05, lfoot: -0.8, lfooty: 0.08, lu: 20, lf: 90, ru: 20, rf: 90 } },
    { t: 3.6, p: STAND }
  ],
  props: { labels: [lab(0, 1.95, "STEP BACK · KNEE DOWN · STAND TALL")] } });

A("split_squat", { view: "side", dur: 2.6,
  base: { t: 4, h: 0, lfoot: 0.35, rfoot: -0.5, rfooty: 0.08, lu: 6, lf: 60, ru: 6, rf: 60 },
  kf: [{ t: 0, p: { py: 0.72 } }, { t: 1.1, p: { py: 0.43 } }, { t: 1.4, p: { py: 0.43 } }, { t: 2.6, p: { py: 0.72 } }],
  props: { labels: [lab(0, 1.95, "BACK KNEE STRAIGHT DOWN")] } });

A("sl_rdl", { view: "side", dur: 3.2, world: { x0: -1.4, x1: 1.4, y0: -0.1, y1: 2.05 },
  base: M(NOIK, { lfa: 90, rfa: 90 }),
  kf: [
    { t: 0, p: { t: 3, lt: 0, ls: 0, rt: -5, rs: -10, lu: 5, lf: 10, ru: 5, rf: 10 } },
    { t: 1.4, p: { t: 82, h: -5, lt: 8, ls: 0, rt: -80, rs: -82, lu: 90, lf: 92, ru: 90, rf: 92 } },
    { t: 1.8, p: { t: 82, h: -5, lt: 8, ls: 0, rt: -80, rs: -82, lu: 90, lf: 92, ru: 90, rf: 92 } },
    { t: 3.2, p: { t: 3, lt: 0, ls: 0, rt: -5, rs: -10, lu: 5, lf: 10, ru: 5, rf: 10 } }
  ],
  props: { labels: [lab(0, 1.95, "HINGE · BACK FLAT · ONE LEG")] } });

A("calf_raise", { view: "side", dur: 2.4,
  base: M(STAND, { py: null, lt: 0, ls: 0, rt: 0, rs: 0 }),
  kf: [{ t: 0, p: { lfa: 90, rfa: 90 } }, { t: 0.8, p: { lfa: 150, rfa: 150 } }, { t: 1.2, p: { lfa: 150, rfa: 150 } }, { t: 2.4, p: { lfa: 90, rfa: 90 } }],
  props: { labels: [lab(0, 1.95, "UP ON TOES · SLOW DOWN")] } });
A("sl_calf_raise", M(ANIMS.calf_raise, { _kf: null, base: M(ANIMS.calf_raise.base, { rt: 60, rs: -40 }),
  kf: [{ t: 0, p: { lfa: 90 } }, { t: 0.8, p: { lfa: 150 } }, { t: 1.2, p: { lfa: 150 } }, { t: 2.4, p: { lfa: 90 } }],
  props: { labels: [lab(0, 1.95, "ONE LEG · FULL RANGE")] } }));

A("crab_walk", { view: "side", dur: 2.0, world: { x0: -1.5, x1: 1.5, y0: -0.1, y1: 1.3 },
  base: M(NOIK, { t: 0, lu: -85, lf: -85, ru: -85, rf: -85, lt: 30, ls: -85, rt: 30, rs: -85, lfa: 90, rfa: 90, c: ["handR", "ankleR"], cdir: 1 }),
  kf: [{ t: 0, p: { x: -1.0 }, e: "lin" }, { t: 0.5, p: { x: -0.8, lt: 45, lu: -75, lf: -75 }, e: "lin" }, { t: 1.0, p: { x: -0.6 }, e: "lin" }, { t: 1.5, p: { x: -0.4, rt: 45, ru: -75, rf: -75 }, e: "lin" }, { t: 2.0, p: { x: -0.2 } }],
  props: { labels: [lab(0, 1.2, "HIPS UP · FORWARD & BACK")] } });

A("table_row", { view: "side", dur: 2.4, world: { x0: -1.3, x1: 1.5, y0: -0.1, y1: 1.4 },
  base: M(NOIK, { t: 0, lt: 0, ls: 0, rt: 0, rs: 0, lfa: 90, rfa: 90, c: ["ankleR", "handR"], cdir: -1, cdy: 0.7, x: 0.95 }),
  kf: [{ t: 0, p: { lu: 90, lf: 90, ru: 90, rf: 90 } }, { t: 0.9, p: { lu: 10, lf: 120, ru: 10, rf: 120 } }, { t: 1.3, p: { lu: 10, lf: 120, ru: 10, rf: 120 } }, { t: 2.4, p: { lu: 90, lf: 90, ru: 90, rf: 90 } }],
  props: { table: { x: -1.25, w: 1.0, h: 0.72 }, labels: [lab(0.1, 1.3, "PULL CHEST TO THE TABLE")] } });

A("stretch", { view: "side", dur: 9.0,
  kf: [
    { t: 0, p: STAND },
    { t: 0.8, p: M(NOIK, { t: 3, lt: 0, ls: 0, rt: -8, rs: -165, lu: 4, lf: 8, ru: -20, rf: -30, rfa: 60 }) },
    { t: 2.6, p: M(NOIK, { t: 3, lt: 0, ls: 0, rt: -8, rs: -165, lu: 4, lf: 8, ru: -20, rf: -30, rfa: 60 }) },
    { t: 3.4, p: M(NOIK, { t: 75, h: -10, lt: 0, ls: 0, rt: 0, rs: 0, lu: 80, lf: 70, ru: 80, rf: 70 }) },
    { t: 5.4, p: M(NOIK, { t: 80, h: -10, lt: 0, ls: 0, rt: 0, rs: 0, lu: 85, lf: 75, ru: 85, rf: 75 }) },
    { t: 6.2, p: { t: 12, py: 0.66, x: 0, lfoot: 0.4, rfoot: -0.55, lu: 60, lf: 80, ru: 60, rf: 80 } },
    { t: 8.2, p: { t: 12, py: 0.64, x: 0, lfoot: 0.4, rfoot: -0.55, lu: 60, lf: 80, ru: 60, rf: 80 } },
    { t: 9.0, p: STAND }
  ],
  props: { labels: [lab(0, 1.95, "QUADS", 0.6, 2.8), lab(0, 1.95, "HAMSTRINGS", 3.2, 5.6), lab(0, 1.95, "CALVES", 6.0, 8.4)] } });

// ================= BASKETBALL (side view with hoop) =================
const COURT = { x0: -1.0, x1: 3.9, y0: -0.1, y1: 3.9 };
const SHOOT_SET = { t: 4, h: -4, py: 0.7, lfoot: 0.12, rfoot: 0.0, lu: 45, lf: 150, ru: 60, rf: 160 };
const SHOOT_DIP = { t: 10, h: -8, py: 0.6, lfoot: 0.12, rfoot: 0.0, lu: 35, lf: 140, ru: 45, rf: 150 };
const SHOOT_UP = { t: 2, h: -6, py: 0.8, lfoot: 0.12, rfoot: 0.0, lfooty: 0.08, rfooty: 0.08, lu: 115, lf: 135, ru: 158, rf: 168 };
const FOLLOW = { t: 2, h: -6, py: 0.79, lfoot: 0.12, rfoot: 0.0, lu: 110, lf: 120, ru: 155, rf: 205 };

function shotSpec({ x = 0, hoopX = 2.6, label, bank = false, dribbles = 0, world = COURT, extraLabels = [], dur = 3.4 }) {
  const P = (o) => M(o, { x, lfoot: x + 0.12, rfoot: x });
  const d0 = dribbles * 0.5;
  const kf = [], ball = [];
  kf.push({ t: 0, p: P(SHOOT_SET) });
  for (let i = 0; i < dribbles; i++) {
    const t0 = i * 0.5;
    kf.push({ t: t0 + 0.05, p: P(M(SHOOT_DIP, { t: 22, ru: 30, rf: 60, lu: 30, lf: 70 })) });
    ball.push({ t: t0, j: "handR", dy: -0.1, e: "in" }, { t: t0 + 0.22, x: x + 0.25, y: 0.12, e: "out" });
  }
  kf.push({ t: d0 + 0.3, p: P(SHOOT_SET) });
  kf.push({ t: d0 + 0.7, p: P(SHOOT_DIP), e: "out" });
  kf.push({ t: d0 + 1.0, p: P(SHOOT_UP) });
  kf.push({ t: d0 + 1.2, p: P(FOLLOW) });
  kf.push({ t: d0 + 2.0, p: P(FOLLOW) });
  kf.push({ t: dur, p: P(SHOOT_SET) });
  const rimX = hoopX - 0.23, rimY = 3.05;
  ball.push({ t: d0 + 0.3, j: "handR", dx: 0.03, dy: 0.1 });
  ball.push({ t: d0 + 1.0, j: "handR", dx: 0.03, dy: 0.1, e: "lin", arc: bank ? 0.7 : 1.0 });
  if (bank) {
    ball.push({ t: d0 + 1.75, x: hoopX - 0.14, y: rimY + 0.45, e: "in" });
    ball.push({ t: d0 + 1.95, x: rimX, y: rimY + 0.05, e: "in" });
  } else ball.push({ t: d0 + 1.9, x: rimX, y: rimY + 0.05, e: "in" });
  ball.push({ t: d0 + 2.15, x: rimX, y: rimY - 0.4, e: "in" });
  ball.push({ t: d0 + 2.5, x: rimX - 0.2, y: 0.12, e: "lin", arc: 0.9 });
  ball.push({ t: dur, j: "handR", dx: 0.03, dy: 0.1 });
  if (ball[0].t > 0) ball.unshift({ t: 0, j: "handR", dx: 0.03, dy: 0.1 });
  const labels = [lab((x + hoopX) / 2, 3.7, label || "")].concat(extraLabels);
  return { view: "side", dur, world, near: "R", kf, ball, props: { hoop: { x: hoopX }, labels } };
}
A("form_shot", shotSpec({ x: 1.3, label: "ONE HAND · HOLD THE FOLLOW-THROUGH" }));
A("form_3spots", shotSpec({ x: 0.9, label: "5 MAKES · MOVE", extraLabels: [lab(1.7, 3.35, "LEFT · MIDDLE · RIGHT")] }));
A("bank_shot", shotSpec({ x: 0.7, bank: true, label: "AIM: TOP CORNER OF THE BOX" }));
A("shoot_generic", shotSpec({ x: 0.6, label: "SAME SHOT EVERY TIME" }));
A("hot_spot", shotSpec({ x: 0.9, label: "HOT SPOT 60 · COUNT MAKES", extraLabels: [lab(0.9, 3.35, "60 s", 0, 3.4, { accent: 1 })] }));
A("free_throw", shotSpec({ x: -0.2, hoopX: 4.4, dribbles: 3, dur: 4.6, world: { x0: -1.2, x1: 5.6, y0: -0.1, y1: 4.2 }, label: "ROUTINE: DRIBBLES · BREATHE · SHOOT" }));
A("beat_pro", shotSpec({ x: 0.6, label: "BEAT THE PRO", extraLabels: [lab(1.4, 3.35, "MAKE +1 YOU · MISS +2 PRO", 0, 3.4, { accent: 1 })] }));

// one-dribble pull-up / pass fake
function pullupSpec({ fake = false, label }) {
  const s = shotSpec({ x: 0.9, label });
  const P = (x, o) => M(o, { x, lfoot: x + 0.12, rfoot: x });
  s.dur = 4.2;
  s.kf = [
    { t: 0, p: P(0, SHOOT_SET) },
    ...(fake ? [{ t: 0.35, p: P(0, M(SHOOT_SET, { t: 8, ru: 90, rf: 90, lu: 90, lf: 90 })) }, { t: 0.6, p: P(0, SHOOT_SET) }] : [{ t: 0.6, p: P(0, SHOOT_SET) }]),
    { t: 1.0, p: P(0.5, M(READY, { ru: 30, rf: 60 })) },
    { t: 1.3, p: P(0.9, SHOOT_DIP) },
    { t: 1.8, p: P(0.9, SHOOT_DIP), e: "out" },
    { t: 2.1, p: P(0.9, SHOOT_UP) },
    { t: 2.3, p: P(0.9, FOLLOW) },
    { t: 3.2, p: P(0.9, FOLLOW) },
    { t: 4.2, p: P(0, SHOOT_SET) }
  ];
  s.ball = [
    { t: 0, j: "handR", dx: 0.03, dy: 0.1 },
    ...(fake ? [{ t: 0.35, j: "handR", dx: 0.1 }, { t: 0.6, j: "handR", dx: 0.03, dy: 0.1 }] : []),
    { t: 0.75, j: "handR", dy: -0.05, e: "in" }, { t: 0.95, x: 0.75, y: 0.12, e: "out" }, { t: 1.2, j: "handR", dx: 0.03, dy: 0.1 },
    { t: 2.1, j: "handR", dx: 0.03, dy: 0.1, e: "lin", arc: 1.0 },
    { t: 3.0, x: 2.37, y: 3.1, e: "in" }, { t: 3.25, x: 2.37, y: 2.65, e: "in" }, { t: 3.6, x: 2.1, y: 0.12, e: "lin", arc: 0.8 }
  ];
  return s;
}
A("pullup_1dribble", pullupSpec({ label: "ONE HARD DRIBBLE · STOP · SHOOT" }));
A("passfake_pullup", pullupSpec({ fake: true, label: "PASS FAKE · ONE DRIBBLE · PULL UP" }));

function layupSpec({ hand = "R", label }) {
  // right-hand layup: last step with the left foot, right knee drives up
  const hoopX = 2.4;
  const kf = [
    { t: 0, p: M(READY, { t: 15, x: -0.6, lfoot: -0.45, rfoot: -0.8, ru: 30, rf: 60 }) },
    { t: 0.45, p: M(NOIK, { x: 0.0, t: 14, lt: 40, ls: 5, rt: -25, rs: -70, ru: 30, rf: 60, lu: -20, lf: 20 }) },
    { t: 0.8, p: M(NOIK, { x: 0.55, t: 12, lt: -20, ls: -60, rt: 40, rs: 5, ru: 70, rf: 130, lu: 60, lf: 120 }) },
    { t: 1.15, p: M(NOIK, { x: 1.05, t: 8, lt: 35, ls: 0, rt: -15, rs: -40, ru: 90, rf: 140, lu: 80, lf: 130 }) },
    { t: 1.5, p: M(NOIK, { x: 1.4, air: 0.45, t: 2, h: -10, lt: 0, ls: 0, lfa: 150, rt: 95, rs: 0, ru: 165, rf: 172, lu: 60, lf: 100 }), e: "in" },
    { t: 1.9, p: M(HALF, { x: 1.65, lfoot: 1.75, rfoot: 1.6 }) },
    { t: 2.8, p: M(READY, { t: 15, x: -0.6, lfoot: -0.45, rfoot: -0.8, ru: 30, rf: 60 }) }
  ];
  const ball = [
    { t: 0, j: "handR", dy: -0.05, e: "in" }, { t: 0.25, x: 0.1, y: 0.12, e: "out" }, { t: 0.55, j: "handR", dy: -0.05 },
    { t: 0.8, mid: ["handL", "handR"], dy: 0.05 }, { t: 1.5, j: "handR", dy: 0.1, e: "out" },
    { t: 1.8, x: hoopX - 0.12, y: 3.5, e: "in" }, { t: 2.0, x: hoopX - 0.23, y: 3.1, e: "in" }, { t: 2.25, x: hoopX - 0.25, y: 2.6, e: "in" },
    { t: 2.6, x: hoopX - 0.5, y: 0.12, e: "lin", arc: 0.6 }, { t: 2.8, j: "handR", dy: -0.05 }
  ];
  const s = { view: "side", dur: 2.8, world: { x0: -1.2, x1: 3.3, y0: -0.1, y1: 3.8 }, near: "R", kf, ball,
    props: { hoop: { x: hoopX }, labels: [lab(0.9, 3.65, label)] } };
  return hand === "L" ? M(mirrorSpec(s), { near: "L" }) : s;
}
A("layup_right", layupSpec({ label: "OFF THE LEFT FOOT · RIGHT KNEE UP" }));
A("layup_left", layupSpec({ hand: "L", label: "OFF THE RIGHT FOOT · LEFT KNEE UP" }));
A("layup_both", layupSpec({ label: "BOTH SIDES · BOTH HANDS" }));
A("layup_weak", layupSpec({ hand: "L", label: "WEAK HAND ONLY" }));

A("power_finish", { view: "side", dur: 3.0, world: { x0: -1.2, x1: 3.3, y0: -0.1, y1: 3.8 }, near: "R",
  kf: [
    { t: 0, p: M(READY, { t: 15, x: -0.4, lfoot: -0.25, rfoot: -0.6, ru: 30, rf: 60 }) },
    { t: 0.45, p: M(NOIK, { x: 0.2, t: 14, lt: 40, ls: 5, rt: -25, rs: -70, ru: 30, rf: 60 }) },
    { t: 0.85, p: M(HALF, { x: 0.7, lfoot: 0.85, rfoot: 0.7, lu: 60, lf: 150, ru: 60, rf: 150 }) },
    { t: 1.2, p: M(DIP_BACK, { x: 0.75, lfoot: 0.85, rfoot: 0.7, lu: 60, lf: 150, ru: 60, rf: 150 }), e: "out" },
    { t: 1.55, p: M(AIR_UP, { x: 0.95, air: 0.4, lu: 160, lf: 170, ru: 165, rf: 172 }), e: "in" },
    { t: 1.95, p: M(HALF, { x: 1.1, lfoot: 1.22, rfoot: 1.05 }) },
    { t: 3.0, p: M(READY, { t: 15, x: -0.4, lfoot: -0.25, rfoot: -0.6, ru: 30, rf: 60 }) }
  ],
  ball: [
    { t: 0, j: "handR", dy: -0.05, e: "in" }, { t: 0.25, x: 0.3, y: 0.12, e: "out" }, { t: 0.55, j: "handR", dy: -0.05 },
    { t: 0.85, mid: ["handL", "handR"], dy: 0.05 }, { t: 1.2, mid: ["handL", "handR"], dy: 0.05 }, { t: 1.55, mid: ["handL", "handR"], dy: 0.1 },
    { t: 1.85, x: 2.17, y: 3.2, e: "in" }, { t: 2.1, x: 2.17, y: 2.65, e: "in" }, { t: 2.6, x: 1.9, y: 0.12, e: "lin", arc: 0.5 }
  ],
  props: { hoop: { x: 2.4 }, labels: [lab(0.9, 3.65, "JUMP STOP · CHIN IT · GO UP STRONG"), lab(0.8, 3.3, "TWO FEET", 0.85, 1.6, { accent: 1 })] } });

// Mikan: viewed from behind, rim overhead
A("mikan", { view: "front", dur: 2.4, world: { x0: -1.6, x1: 1.6, y0: -0.1, y1: 4.1 },
  kf: [
    { t: 0, p: { x: 0.35, py: 0.72, lfoot: 0.5, rfoot: 0.2, lu: 150, lf: 165, ru: 40, rf: 110 } },
    { t: 0.3, p: { x: 0.35, py: 1.05, lfoot: 0.45, rfoot: 0.25, lfooty: 0.3, lu: 170, lf: 175, ru: 40, rf: 110 } },
    { t: 0.7, p: { x: 0.1, py: 0.74, lfoot: 0.2, rfoot: -0.05, lu: 90, lf: 130, ru: 90, rf: 130 } },
    { t: 1.2, p: { x: -0.35, py: 0.72, rfoot: -0.5, lfoot: -0.2, ru: 150, rf: 165, lu: 40, lf: 110 } },
    { t: 1.5, p: { x: -0.35, py: 1.05, rfoot: -0.45, lfoot: -0.25, rfooty: 0.3, ru: 170, rf: 175, lu: 40, lf: 110 } },
    { t: 1.9, p: { x: -0.1, py: 0.74, rfoot: -0.2, lfoot: 0.05, lu: 90, lf: 130, ru: 90, rf: 130 } },
    { t: 2.4, p: { x: 0.35, py: 0.72, lfoot: 0.5, rfoot: 0.2, lu: 150, lf: 165, ru: 40, rf: 110 } }
  ],
  ball: [
    { t: 0, j: "handL", dy: 0.1 }, { t: 0.3, j: "handL", dy: 0.12, e: "out" }, { t: 0.5, x: 0.0, y: 3.2, e: "in" }, { t: 0.65, x: 0.0, y: 2.7, e: "in" },
    { t: 0.8, mid: ["handL", "handR"], dy: 0.1 }, { t: 1.2, j: "handR", dy: 0.1 }, { t: 1.5, j: "handR", dy: 0.12, e: "out" },
    { t: 1.7, x: 0.0, y: 3.2, e: "in" }, { t: 1.85, x: 0.0, y: 2.7, e: "in" }, { t: 2.0, mid: ["handL", "handR"], dy: 0.1 }
  ],
  props: { hoopFront: { x: 0 }, labels: [lab(0, 0.0 - 0.02, "")] } });
ANIMS.mikan.props.labels = [lab(-1.1, 3.8, "RIGHT · LEFT", 0, 2.4, { align: "left" })];

A("triple_threat", { view: "side", dur: 3.0, near: "R",
  base: M(READY, { t: 18, py: 0.64, lu: 40, lf: 110, ru: 20, rf: 100 }),
  kf: [
    { t: 0, p: { lfoot: 0.18, rfoot: -0.18 } },
    { t: 0.35, p: { lfoot: 0.18, rfoot: 0.35, x: 0.08 } },
    { t: 0.7, p: { lfoot: 0.18, rfoot: -0.18, x: 0 } },
    { t: 1.05, p: { lfoot: 0.18, rfoot: 0.35, x: 0.08 } },
    { t: 1.4, p: { lfoot: 0.18, rfoot: -0.18, x: 0 } },
    { t: 1.8, p: { t: 6, py: 0.7, lfoot: 0.18, rfoot: -0.18, lu: 110, lf: 150, ru: 120, rf: 160 } },
    { t: 2.3, p: { lfoot: 0.18, rfoot: -0.18 } }
  ],
  ball: [{ t: 0, j: "handR", dx: 0.05, dy: 0.05 }],
  props: { labels: [lab(0, 1.95, "JAB", 0.2, 0.5), lab(0, 1.95, "JAB", 0.9, 1.2), lab(0, 1.95, "SHOT FAKE", 1.6, 2.2, { accent: 1 }), lab(-0.2, 0.05 + 0.0, "", 0, 0)] } });

A("rebound_outlet", { view: "side", dur: 3.6, world: { x0: -1.4, x1: 3.2, y0: -0.1, y1: 4.1 }, near: "R",
  kf: [
    { t: 0, p: M(SHOOT_SET, { x: 1.2, lfoot: 1.32, rfoot: 1.2 }) },
    { t: 0.3, p: M(SHOOT_UP, { x: 1.2, lfoot: 1.32, rfoot: 1.2 }) },
    { t: 0.9, p: M(DIP_BACK, { x: 1.3, lfoot: 1.4, rfoot: 1.25, lu: 100, lf: 120, ru: 100, rf: 120 }), e: "out" },
    { t: 1.2, p: M(AIR_UP, { x: 1.35, air: 0.4 }), e: "in" },
    { t: 1.55, p: M(HALF, { x: 1.35, lfoot: 1.45, rfoot: 1.3, lu: 50, lf: 150, ru: 50, rf: 150 }) },
    { t: 2.2, p: M(HALF, { x: 1.3, lfoot: 1.45, rfoot: 1.1, lu: 50, lf: 150, ru: 50, rf: 150 }) },
    { t: 2.6, p: M(READY, { x: 1.2, lfoot: 1.4, rfoot: 1.0, t: 10, lu: 90, lf: 95, ru: 90, rf: 95 }) },
    { t: 3.6, p: M(SHOOT_SET, { x: 1.2, lfoot: 1.32, rfoot: 1.2 }) }
  ],
  ball: [
    { t: 0, j: "handR", dy: 0.1 }, { t: 0.35, j: "handR", dy: 0.1, e: "out" }, { t: 0.75, x: 2.28, y: 3.7, e: "in" },
    { t: 1.2, mid: ["handL", "handR"], dy: 0.12 }, { t: 1.55, mid: ["handL", "handR"], dy: 0.1 }, { t: 2.2, mid: ["handL", "handR"], dy: 0.1 },
    { t: 2.6, mid: ["handL", "handR"], dx: 0.1 }, { t: 3.0, x: -1.3, y: 1.2, e: "lin", hide: true }, { t: 3.5, x: -1.3, y: 1.2, hide: true }, { t: 3.6, j: "handR", dy: 0.1 }
  ],
  props: { hoop: { x: 2.4 }, labels: [lab(0.6, 3.9, "TOSS · GRAB HIGH · CHIN · PIVOT · OUTLET"), lab(0.2, 3.5, "CHIN IT", 1.5, 2.2, { accent: 1 })] } });

A("one_two_step", { view: "side", dur: 3.6, world: COURT, near: "R",
  kf: [
    { t: 0, p: M(READY, { t: 12, x: -0.7, lfoot: -0.55, rfoot: -0.85, ru: 60, rf: 90, lu: 60, lf: 90 }) },
    { t: 0.3, p: M(READY, { t: 12, x: -0.7, lfoot: -0.55, rfoot: -0.85, ru: 100, rf: 110 }) },
    { t: 0.7, p: M(READY, { t: 12, x: -0.3, lfoot: -0.5, rfoot: -0.1, ru: 80, rf: 150, lu: 80, lf: 150 }) },
    { t: 1.0, p: M(SHOOT_DIP, { x: 0.05, lfoot: 0.2, rfoot: 0.05 }), e: "out" },
    { t: 1.3, p: M(SHOOT_UP, { x: 0.05, lfoot: 0.2, rfoot: 0.05 }) },
    { t: 1.5, p: M(FOLLOW, { x: 0.05, lfoot: 0.2, rfoot: 0.05 }) },
    { t: 2.4, p: M(FOLLOW, { x: 0.05, lfoot: 0.2, rfoot: 0.05 }) },
    { t: 3.6, p: M(READY, { t: 12, x: -0.7, lfoot: -0.55, rfoot: -0.85, ru: 60, rf: 90, lu: 60, lf: 90 }) }
  ],
  ball: [
    { t: 0, mid: ["handL", "handR"], dy: 0.05 }, { t: 0.3, j: "handR", dx: 0.1, e: "lin" }, { t: 0.55, x: -0.15, y: 0.9, e: "out" },
    { t: 0.75, mid: ["handL", "handR"], dy: 0.1 }, { t: 1.3, j: "handR", dx: 0.03, dy: 0.1, e: "lin", arc: 1.0 },
    { t: 2.2, x: 2.37, y: 3.1, e: "in" }, { t: 2.45, x: 2.37, y: 2.65, e: "in" }, { t: 2.9, x: 2.0, y: 0.12, e: "lin", arc: 0.8 }, { t: 3.6, mid: ["handL", "handR"], dy: 0.05 }
  ],
  props: { hoop: { x: 2.6 }, labels: [lab(1.4, 3.7, "SPIN IT OUT · STEP 1-2 · RISE · SHOOT")] } });

A("catch_pivot_shoot", { view: "side", dur: 3.8, world: COURT, near: "R",
  kf: [
    { t: 0, p: M(READY, { t: 12, x: -0.6, lfoot: -0.45, rfoot: -0.75, ru: 60, rf: 90, lu: 60, lf: 90 }) },
    { t: 0.35, p: M(READY, { t: 12, x: -0.6, lfoot: -0.45, rfoot: -0.75, ru: 100, rf: 110 }) },
    { t: 0.8, p: M(HALF, { x: -0.1, lfoot: 0.02, rfoot: -0.12, lu: 80, lf: 150, ru: 80, rf: 150 }) },
    { t: 1.3, p: M(HALF, { x: -0.05, lfoot: 0.02, rfoot: -0.02, t: 20, lu: 70, lf: 150, ru: 70, rf: 150 }) },
    { t: 1.6, p: M(SHOOT_DIP, { x: 0, lfoot: 0.12, rfoot: 0 }), e: "out" },
    { t: 1.9, p: M(SHOOT_UP, { x: 0, lfoot: 0.12, rfoot: 0 }) },
    { t: 2.1, p: M(FOLLOW, { x: 0, lfoot: 0.12, rfoot: 0 }) },
    { t: 2.9, p: M(FOLLOW, { x: 0, lfoot: 0.12, rfoot: 0 }) },
    { t: 3.8, p: M(READY, { t: 12, x: -0.6, lfoot: -0.45, rfoot: -0.75, ru: 60, rf: 90, lu: 60, lf: 90 }) }
  ],
  ball: [
    { t: 0, mid: ["handL", "handR"], dy: 0.05 }, { t: 0.35, j: "handR", dx: 0.1, e: "lin" }, { t: 0.6, x: 0.2, y: 0.9, e: "out" },
    { t: 0.85, mid: ["handL", "handR"], dy: 0.1 }, { t: 1.9, j: "handR", dx: 0.03, dy: 0.1, e: "lin", arc: 1.0 },
    { t: 2.8, x: 2.37, y: 3.1, e: "in" }, { t: 3.05, x: 2.37, y: 2.65, e: "in" }, { t: 3.4, x: 2.0, y: 0.12, e: "lin", arc: 0.8 }, { t: 3.8, mid: ["handL", "handR"], dy: 0.05 }
  ],
  props: { hoop: { x: 2.6 }, labels: [lab(1.4, 3.7, "CATCH · JUMP STOP · PIVOT · SHOOT"), lab(0.2, 3.3, "PIVOT", 1.0, 1.5, { accent: 1 })] } });

A("shotfake_sidestep", { view: "front", dur: 3.2, world: { x0: -1.6, x1: 1.6, y0: -0.1, y1: 2.6 },
  kf: [
    { t: 0, p: { x: 0, py: 0.66, lfoot: 0.22, rfoot: -0.22, lu: 40, lf: 150, ru: 40, rf: 150, luz: 0.6, ruz: 0.6 } },
    { t: 0.4, p: { x: 0, py: 0.72, lfoot: 0.22, rfoot: -0.22, lu: 60, lf: 170, ru: 60, rf: 170, luz: 0.8, ruz: 0.8 } },
    { t: 0.7, p: { x: 0, py: 0.62, lfoot: 0.22, rfoot: -0.22, lu: 40, lf: 150, ru: 40, rf: 150, luz: 0.6, ruz: 0.6 } },
    { t: 1.0, p: { x: 0.25, py: 0.6, lfoot: 0.75, rfoot: -0.2, lu: 40, lf: 150, ru: 40, rf: 150, luz: 0.6, ruz: 0.6 } },
    { t: 1.25, p: { x: 0.55, py: 0.62, lfoot: 0.75, rfoot: 0.35, lu: 40, lf: 150, ru: 40, rf: 150, luz: 0.6, ruz: 0.6 } },
    { t: 1.6, p: { x: 0.55, py: 0.85, lfoot: 0.75, rfoot: 0.35, lfooty: 0.1, rfooty: 0.1, lu: 150, lf: 170, ru: 160, rf: 172, luz: 1, ruz: 1 } },
    { t: 2.4, p: { x: 0.55, py: 0.78, lfoot: 0.75, rfoot: 0.35, lu: 150, lf: 170, ru: 160, rf: 180 } },
    { t: 3.2, p: { x: 0, py: 0.66, lfoot: 0.22, rfoot: -0.22, lu: 40, lf: 150, ru: 40, rf: 150, luz: 0.6, ruz: 0.6 } }
  ],
  ball: [{ t: 0, mid: ["handL", "handR"], dy: 0.1 }, { t: 1.6, mid: ["handL", "handR"], dy: 0.1 }, { t: 1.75, mid: ["handL", "handR"], dy: 0.15, e: "out" }, { t: 2.2, x: 0.55, y: 2.55, e: "in", hide: true }, { t: 3.1, x: 0, y: 1.2, hide: true }],
  props: { labels: [lab(0, 2.45, "SHOT FAKE", 0.2, 0.7, { accent: 1 }), lab(0, 2.45, "SIDE-STEP", 0.8, 1.3), lab(0, 2.45, "SHOOT", 1.4, 2.4)] } });

// ================= TOP VIEW drills =================
const LINES3 = (gap) => [[-gap, -1.6, -gap, 1.6], [0, -1.6, 0, 1.6], [gap, -1.6, gap, 1.6]];
A("shuttle_5105", { view: "top", dur: 4.6, world: { x0: -6.5, x1: 6.5, y0: -2.6, y1: 2.6 },
  props: { lines: LINES3(5), labels: [lab(-5, 2.2, "5 m"), lab(0, 2.2, "START"), lab(5, 2.2, "5 m")] },
  path: [{ t: 0, x: 0, y: 0, f: 0, m: "stand" }, { t: 0.4, x: 0, y: 0, f: 90, m: "run" }, { t: 1.4, x: 4.7, y: 0, f: 90, m: "run" }, { t: 1.6, x: 4.7, y: 0, f: -90, m: "run" }, { t: 3.4, x: -4.7, y: 0, f: -90, m: "run" }, { t: 3.6, x: -4.7, y: 0, f: 90, m: "run" }, { t: 4.4, x: 0.5, y: 0, f: 90, m: "stand" }, { t: 4.6, x: 0, y: 0, f: 0, m: "stand" }],
  signals: [{ t0: 1.35, t1: 1.7, text: "TOUCH", x: 4.7, y: -1.4 }, { t0: 3.35, t1: 3.7, text: "TOUCH", x: -4.7, y: -1.4 }] });

A("cone_zigzag", { view: "top", dur: 3.6, world: { x0: -2.5, x1: 2.5, y0: -4.2, y1: 4.2 },
  props: { cones: [[-1, -2.4], [1, -0.8], [-1, 0.8], [1, 2.4]] },
  path: [{ t: 0, x: 0, y: -3.8, f: -30, m: "run" }, { t: 0.7, x: -1.4, y: -2.4, f: 45, m: "run" }, { t: 1.4, x: 1.4, y: -0.8, f: -45, m: "run" }, { t: 2.1, x: -1.4, y: 0.8, f: 45, m: "run" }, { t: 2.8, x: 1.4, y: 2.4, f: 0, m: "run" }, { t: 3.4, x: 0.3, y: 3.8, f: 0, m: "run" }, { t: 3.6, x: 0, y: -3.8, f: -30, m: "stand" }] });

A("zigzag_slides", { view: "top", dur: 4.4, world: { x0: -3, x1: 3, y0: -4, y1: 4 },
  props: { labels: [lab(0, 3.6, "SLIDE · DROP STEP · SLIDE")] },
  path: [{ t: 0, x: -1.6, y: 3, f: 180, m: "slide" }, { t: 1.2, x: 1.4, y: 1.4, f: 180, m: "slide" }, { t: 1.5, x: 1.4, y: 1.3, f: 180, m: "pivot" }, { t: 2.7, x: -1.4, y: -0.3, f: 180, m: "slide" }, { t: 3.0, x: -1.4, y: -0.4, f: 180, m: "pivot" }, { t: 4.2, x: 1.4, y: -2.0, f: 180, m: "slide" }, { t: 4.4, x: -1.6, y: 3, f: 180, m: "stand" }] });

A("closeout_recover", { view: "top", dur: 4.6, world: { x0: -3.5, x1: 3.5, y0: -3.2, y1: 3.2 },
  props: { cones: [[0, 2.6]], labels: [lab(-2.4, -2.8, "HELP SPOT")] },
  path: [{ t: 0, x: -1.6, y: -2.2, f: 20, m: "run" }, { t: 0.9, x: -0.1, y: 1.6, f: 0, m: "run" }, { t: 1.3, x: 0, y: 1.9, f: 0, m: "stand" }, { t: 2.2, x: 1.1, y: 1.9, f: 0, m: "slide" }, { t: 2.4, x: 1.1, y: 1.9, f: 200, m: "run" }, { t: 3.5, x: -1.6, y: -2.2, f: 200, m: "run" }, { t: 4.6, x: -1.6, y: -2.2, f: 20, m: "stand" }],
  signals: [{ t0: 0.9, t1: 1.4, text: "CLOSE OUT", x: 1.5, y: 2.9 }] });

A("arrow_sprints", { view: "top", dur: 4.8, world: { x0: -4.2, x1: 4.2, y0: -2.5, y1: 3.2 },
  props: { lines: [[-3, -1.2, -3, 1.2], [3, -1.2, 3, 1.2], [-1.2, 2.6, 1.2, 2.6]] },
  path: [{ t: 0, x: 0, y: 0, f: 0, m: "stand" }, { t: 0.4, x: 0, y: 0, f: 90, m: "run" }, { t: 1.0, x: 2.8, y: 0, f: -90, m: "run" }, { t: 1.6, x: 0, y: 0, f: 0, m: "stand" }, { t: 2.0, x: 0, y: 0, f: 0, m: "run" }, { t: 2.6, x: 0, y: 2.4, f: 180, m: "run" }, { t: 3.2, x: 0, y: 0, f: 0, m: "stand" }, { t: 3.6, x: 0, y: 0, f: -90, m: "run" }, { t: 4.2, x: -2.8, y: 0, f: 90, m: "run" }, { t: 4.8, x: 0, y: 0, f: 0, m: "stand" }],
  signals: [{ t0: 0.1, t1: 0.6, arrow: "right", x: 2.8, y: -1.8 }, { t0: 1.7, t1: 2.2, arrow: "up", x: 2.8, y: -1.8 }, { t0: 3.3, t1: 3.8, arrow: "left", x: 2.8, y: -1.8 }] });

A("crossover_start", { view: "top", dur: 3.2, world: { x0: -2.5, x1: 6, y0: -2, y1: 2 },
  props: { labels: [lab(0, 1.6, "TURN HIPS · CROSS OVER · GO")] },
  path: [{ t: 0, x: 0, y: 0, f: 0, m: "stand" }, { t: 0.6, x: 0, y: 0, f: 0, m: "stand" }, { t: 0.9, x: 0.3, y: 0, f: 90, m: "run" }, { t: 2.4, x: 5.2, y: 0, f: 90, m: "run" }, { t: 3.2, x: 0, y: 0, f: 0, m: "stand" }] });

A("line_touch", { view: "top", dur: 5.2, world: { x0: -1.5, x1: 10.5, y0: -2, y1: 2 },
  props: { lines: [[0, -1.3, 0, 1.3], [3, -1.3, 3, 1.3], [6, -1.3, 6, 1.3], [9, -1.3, 9, 1.3]], labels: [lab(3, 1.65, "1"), lab(6, 1.65, "2"), lab(9, 1.65, "3")] },
  path: [{ t: 0, x: 0, y: 0, f: 90, m: "run" }, { t: 0.6, x: 2.8, y: 0, f: -90, m: "run" }, { t: 1.2, x: 0.2, y: 0, f: 90, m: "run" }, { t: 2.3, x: 5.8, y: 0, f: -90, m: "run" }, { t: 3.4, x: 0.2, y: 0, f: 90, m: "run" }, { t: 4.3, x: 8.8, y: 0, f: -90, m: "run" }, { t: 5.2, x: 0, y: 0, f: 90, m: "run" }] });

A("jump_stop_pivot", { view: "top", dur: 4.0, world: { x0: -3, x1: 3, y0: -3, y1: 3 },
  path: [{ t: 0, x: 0, y: -2.4, f: 0, m: "run" }, { t: 0.8, x: 0, y: 0, f: 0, m: "stand" }, { t: 1.3, x: 0, y: 0, f: 0, m: "pivot" }, { t: 2.1, x: 0, y: 0, f: 180, m: "pivot" }, { t: 2.9, x: 0, y: 0, f: 0, m: "pivot" }, { t: 3.4, x: 0, y: 0, f: -90, m: "pivot" }, { t: 4.0, x: 0, y: -2.4, f: 0, m: "stand" }],
  ball: [{ t: 0, on: true }],
  props: { labels: [lab(0, 2.6, "JUMP STOP", 0.7, 1.3, { accent: 1 }), lab(0, 2.6, "FRONT PIVOT", 1.3, 2.1), lab(0, 2.6, "REVERSE PIVOT", 2.1, 3.4)] } });

const HALF_COURT = { court: [[-7.5, 5.2, 7.5, 5.2], [-2.45, 5.2, -2.45, -0.6], [2.45, 5.2, 2.45, -0.6], [-2.45, -0.6, 2.45, -0.6]], arcs: [[0, 4.0, 6.75, 180 + 12, 360 - 12]] };
function spotsSpec({ spots, label, far = false }) {
  const path = [], ball = [];
  const step = 1.3;
  spots.forEach((s, i) => {
    const t0 = i * step;
    const face = Math.atan2(0 - s[0], 4.0 - s[1]) / D2R;
    path.push({ t: t0, x: s[0], y: s[1], f: face, m: "shoot" }, { t: t0 + 0.9, x: s[0], y: s[1], f: face, m: "run" });
    ball.push({ t: t0, on: true }, { t: t0 + 0.35, on: true, lift: 1 }, { t: t0 + 0.8, x: 0, y: 4.0 }, { t: t0 + 1.1, on: true });
  });
  return { view: "top", dur: spots.length * step, world: { x0: -7.8, x1: 7.8, y0: -3.6, y1: 5.6 }, path, ball, showMode: false,
    props: M(HALF_COURT, { hoop: [0, 4.0], spots, labels: [lab(0, -3.1, label)] }) };
}
const D2R = Math.PI / 180;
const CLOSE5 = [[-2.4, 3.2], [-1.9, 1.9], [0, 1.4], [1.9, 1.9], [2.4, 3.2]];
const MID5 = [[-4.6, 4.2], [-3.4, 1.4], [0, 0.0], [3.4, 1.4], [4.6, 4.2]];
const THREE5 = [[-6.6, 4.4], [-5.0, -0.2], [0, -2.9], [5.0, -0.2], [6.6, 4.4]];
A("spots_close", spotsSpec({ spots: CLOSE5, label: "5 CLOSE SPOTS · 3 MAKES EACH" }));
A("spots_atw", spotsSpec({ spots: CLOSE5, label: "AROUND THE WORLD · 2 SHOTS EACH" }));
A("spots_mid", spotsSpec({ spots: MID5, label: "CATCH & SHOOT · GAME SPEED" }));
A("spots_three", spotsSpec({ spots: THREE5, label: "THREES · ONLY WITH GOOD FORM" }));
A("spots_25", spotsSpec({ spots: MID5, label: "5 SHOTS × 5 SPOTS · COUNT MAKES" }));
A("corner", spotsSpec({ spots: [[-6.6, 4.4], [6.6, 4.4]], label: "CORNERS · BOTH SIDES" }));
A("corner60", spotsSpec({ spots: [[-6.6, 4.4], [-6.6, 4.4]], label: "CORNER 60 · MAKES IN 60 s" }));
A("elbows", spotsSpec({ spots: [[-2.45, -0.6], [2.45, -0.6]], label: "ELBOWS · SAME SHOT" }));

A("euro_step", { view: "top", dur: 3.2, world: { x0: -4, x1: 4, y0: -3.8, y1: 5 },
  props: M(HALF_COURT, { hoop: [0, 4.0], labels: [lab(0, -3.3, "BIG STEP ONE WAY · LONG STEP THE OTHER")] }), showMode: false,
  path: [{ t: 0, x: 0.3, y: -3.0, f: 0, m: "run" }, { t: 1.1, x: 0.2, y: -0.2, f: 0, m: "run" }, { t: 1.5, x: -1.1, y: 1.0, f: -20, m: "run" }, { t: 1.9, x: 0.7, y: 2.3, f: 25, m: "run" }, { t: 2.3, x: 0.6, y: 2.9, f: 0, m: "stand" }, { t: 3.2, x: 0.3, y: -3.0, f: 0, m: "stand" }],
  ball: [{ t: 0, on: true }, { t: 2.1, on: true, lift: 1 }, { t: 2.45, x: 0, y: 4.0 }, { t: 2.8, x: 0.4, y: 3.2, hide: true }, { t: 3.2, on: true }] });

A("sprint_back_jumper", { view: "top", dur: 4.4, world: { x0: -4.5, x1: 4.5, y0: -8.5, y1: 5.2 },
  props: M(HALF_COURT, { hoop: [0, 4.0], court: HALF_COURT.court.concat([[-7.5, -8.1, 7.5, -8.1]]), labels: [lab(0, -7.6, "HALF COURT")] }), showMode: false,
  path: [{ t: 0, x: 0, y: -0.6, f: 180, m: "run" }, { t: 1.4, x: 0, y: -7.8, f: 0, m: "run" }, { t: 2.8, x: 0, y: -0.6, f: 0, m: "stand" }, { t: 4.4, x: 0, y: -0.6, f: 180, m: "stand" }],
  ball: [{ t: 0, x: 0.5, y: 0.2, hide: true }, { t: 2.7, x: 0.5, y: 0.2 }, { t: 2.85, on: true }, { t: 3.1, on: true, lift: 1 }, { t: 3.6, x: 0, y: 4.0 }, { t: 4.3, x: 0.5, y: 0.2, hide: true }] });

// ================= HANDLES (front view) =================
const DRIB = { t: 0, tz: 0.82, py: 0.62, lfoot: 0.34, rfoot: -0.34, lu: 35, lf: 60, ru: 35, rf: 60, luz: 0.8, ruz: 0.8 };
const HANDW = { x0: -1.3, x1: 1.3, y0: -0.1, y1: 2.0 };

A("h_fingertip", { view: "front", dur: 3.2, world: HANDW,
  kf: [
    { t: 0, p: { t: 0, py: 0.78, lfoot: 0.2, rfoot: -0.2, lu: 170, lf: 168, ru: 170, rf: 168 } },
    { t: 1.6, p: { t: 0, tz: 0.8, py: 0.6, lfoot: 0.3, rfoot: -0.3, lu: 5, lf: 25, ru: 5, rf: 25, luz: 0.85, ruz: 0.85 } },
    { t: 3.2, p: { t: 0, py: 0.78, lfoot: 0.2, rfoot: -0.2, lu: 170, lf: 168, ru: 170, rf: 168 } }
  ],
  ball: [{ t: 0, mid: ["handL", "handR"], dy: 0.02, z: 1 }],
  props: { labels: [lab(0, 1.95, "TAP · TAP · TAP")] } });

A("h_around_world", { view: "front", dur: 3.6, world: HANDW,
  base: { t: 0, py: 0.78, lfoot: 0.2, rfoot: -0.2 },
  kf: [
    { t: 0, p: { lu: 160, lf: 110, ru: 160, rf: 110 } }, { t: 1.2, p: { lu: 160, lf: 110, ru: 160, rf: 110 } },
    { t: 1.5, p: { py: 0.76, lu: 40, lf: 80, ru: 40, rf: 80, luz: 0.7, ruz: 0.7 } }, { t: 2.3, p: { py: 0.76, lu: 40, lf: 80, ru: 40, rf: 80, luz: 0.7, ruz: 0.7 } },
    { t: 2.6, p: { py: 0.6, tz: 0.8, lfoot: 0.28, rfoot: -0.28, t: 0, lu: 15, lf: 20, ru: 15, rf: 20, luz: 0.8, ruz: 0.8 } }, { t: 3.4, p: { py: 0.6, tz: 0.8, lfoot: 0.28, rfoot: -0.28, lu: 15, lf: 20, ru: 15, rf: 20, luz: 0.8, ruz: 0.8 } }
  ],
  ball: [
    { t: 0, mid: ["neck", "neck"], dy: 0.12, z: 1, e: "lin" }, { t: 0.3, mid: ["neck", "neck"], dx: 0.3, dy: 0.12, z: 0, e: "lin" }, { t: 0.6, mid: ["neck", "neck"], dy: 0.12, z: -1, e: "lin" }, { t: 0.9, mid: ["neck", "neck"], dx: -0.3, dy: 0.12, z: 0, e: "lin" },
    { t: 1.35, mid: ["hipL", "hipR"], dy: 0.1, z: 1, e: "lin" }, { t: 1.6, mid: ["hipL", "hipR"], dx: 0.33, dy: 0.1, z: 0, e: "lin" }, { t: 1.85, mid: ["hipL", "hipR"], dy: 0.1, z: -1, e: "lin" }, { t: 2.1, mid: ["hipL", "hipR"], dx: -0.33, dy: 0.1, z: 0, e: "lin" },
    { t: 2.5, mid: ["kneeL", "kneeR"], z: 1, e: "lin" }, { t: 2.75, mid: ["kneeL", "kneeR"], dx: 0.38, z: 0, e: "lin" }, { t: 3.0, mid: ["kneeL", "kneeR"], z: -1, e: "lin" }, { t: 3.25, mid: ["kneeL", "kneeR"], dx: -0.38, z: 0, e: "lin" }
  ],
  props: { labels: [lab(0, 1.95, "HEAD", 0, 1.2), lab(0, 1.95, "WAIST", 1.3, 2.3), lab(0, 1.95, "KNEES", 2.4, 3.6)] } });

function fig8Spec(dribble, backward, label) {
  const base = { t: 0, tz: 0.72, py: 0.56, lfoot: 0.42, rfoot: -0.42, lu: 12, lf: 4, ru: 12, rf: 4, luz: 0.95, ruz: 0.95 };
  const kL = "kneeL", kR = "kneeR";
  // loop: center -> around left leg -> center -> around right leg (z sign sets front/back)
  const f = backward ? -1 : 1;
  const b = [
    { t: 0.0, mid: [kL, kR], dy: -0.15, z: -f, e: "lin" },
    { t: 0.4, j: kL, dx: 0.22, dy: -0.12, z: 0, e: "lin" },
    { t: 0.8, j: kL, dy: -0.12, z: f, e: "lin" },
    { t: 1.2, mid: [kL, kR], dy: -0.15, z: -f, e: "lin" },
    { t: 1.6, j: kR, dx: -0.22, dy: -0.12, z: 0, e: "lin" },
    { t: 2.0, j: kR, dy: -0.12, z: f, e: "lin" }
  ];
  if (dribble) b.forEach((k) => { k.dy = -0.32; });
  else b.forEach((k) => { k.dy = 0.02; });
  return { view: "front", dur: 2.4, world: HANDW,
    kf: [{ t: 0, p: M(base, { lu: 15, ru: 25 }) }, { t: 0.6, p: M(base, { lu: 30, ru: 10 }) }, { t: 1.2, p: M(base, { lu: 15, ru: 25 }) }, { t: 1.8, p: M(base, { lu: 10, ru: 30 }) }],
    ball: b, props: { labels: [lab(0, 1.95, label)] } };
}
A("h_fig8_wraps", fig8Spec(false, false, "AROUND & THROUGH · NO DRIBBLE"));
A("h_fig8_back", fig8Spec(true, true, "FRONT → BACK THROUGH THE LEGS"));
A("h_fig8_fwd", fig8Spec(true, false, "BACK → FRONT THROUGH THE LEGS"));

A("h_drop_catch", { view: "front", dur: 1.6, world: HANDW,
  base: { t: 0, tz: 0.75, py: 0.58, lfoot: 0.38, rfoot: -0.38 },
  kf: [
    { t: 0, p: { lu: 18, lf: 25, ru: 18, rf: 25, luz: 0.9, ruz: 0.7 } },
    { t: 0.35, p: { lu: 18, lf: 25, ru: 18, rf: 25, luz: 0.9, ruz: 0.7 }, e: "lin" },
    { t: 0.55, p: { lu: 30, lf: 40, ru: 30, rf: 40, luz: 0.7, ruz: 0.9 } },
    { t: 1.15, p: { lu: 30, lf: 40, ru: 30, rf: 40, luz: 0.7, ruz: 0.9 }, e: "lin" },
    { t: 1.35, p: { lu: 18, lf: 25, ru: 18, rf: 25, luz: 0.9, ruz: 0.7 } }
  ],
  ball: [{ t: 0, mid: ["kneeL", "kneeR"], dy: 0.08, z: 0 }, { t: 0.35, mid: ["kneeL", "kneeR"], dy: 0.08, e: "in" }, { t: 0.55, mid: ["kneeL", "kneeR"], dy: -0.12 }, { t: 0.8, mid: ["kneeL", "kneeR"], dy: 0.08 }, { t: 1.15, mid: ["kneeL", "kneeR"], dy: 0.08, e: "in" }, { t: 1.35, mid: ["kneeL", "kneeR"], dy: -0.12 }, { t: 1.6, mid: ["kneeL", "kneeR"], dy: 0.08 }],
  props: { labels: [lab(0, 1.95, "DROP · SWITCH HANDS · CATCH"), lab(0, 0.22, "FRONT ↔ BACK", 0.3, 0.7, { accent: 1 }), lab(0, 0.22, "FRONT ↔ BACK", 1.1, 1.5, { accent: 1 })] } });

function dribbleBounces(points, dur) {
  // points: [{t, x, hand}] bounce spot x, alternate top (hand) and floor
  const b = [];
  points.forEach((p) => {
    b.push({ t: p.t, j: p.hand, dy: -0.1, z: p.z || 0.3, e: "in" });
    b.push({ t: p.t + p.d / 2, x: p.x, y: 0.12, z: p.z || 0.3, e: "out" });
  });
  return b;
}
A("h_pound_R", { view: "front", dur: 1.2, world: HANDW,
  kf: [
    { t: 0, p: M(DRIB, { ru: 25, rf: 30, lu: 45, lf: 90 }), e: "in" }, { t: 0.2, p: M(DRIB, { ru: 10, rf: -5, lu: 45, lf: 90 }), e: "out" },
    { t: 0.4, p: M(DRIB, { ru: 25, rf: 30, lu: 45, lf: 90 }), e: "in" }, { t: 0.6, p: M(DRIB, { ru: 10, rf: -5, lu: 45, lf: 90 }), e: "out" },
    { t: 0.8, p: M(DRIB, { ru: 25, rf: 30, lu: 45, lf: 90 }), e: "in" }, { t: 1.0, p: M(DRIB, { ru: 10, rf: -5, lu: 45, lf: 90 }), e: "out" }
  ],
  ball: dribbleBounces([{ t: 0, x: -0.55, hand: "handR", d: 0.4 }, { t: 0.4, x: -0.55, hand: "handR", d: 0.4 }, { t: 0.8, x: -0.55, hand: "handR", d: 0.4 }]),
  props: { labels: [lab(0, 1.95, "HARD · 45° IN FRONT · BELOW THE KNEE")] } });
A("h_pound_L", mirrorSpec(ANIMS.h_pound_R));

A("h_side_R", { view: "front", dur: 1.2, world: HANDW,
  kf: [
    { t: 0, p: M(DRIB, { ru: 40, rf: 50, lu: 45, lf: 90 }) }, { t: 0.3, p: M(DRIB, { ru: 5, rf: -20, lu: 45, lf: 90 }) },
    { t: 0.6, p: M(DRIB, { ru: 40, rf: 50, lu: 45, lf: 90 }) }, { t: 0.9, p: M(DRIB, { ru: 5, rf: -20, lu: 45, lf: 90 }) }
  ],
  ball: [{ t: 0, j: "handR", dy: -0.1, z: 0.4, e: "in" }, { t: 0.15, x: -0.3, y: 0.12, z: 0.4, e: "out" }, { t: 0.3, j: "handR", dy: -0.1, z: 0.4, e: "in" }, { t: 0.45, x: -0.3, y: 0.12, z: 0.4, e: "out" }, { t: 0.6, j: "handR", dy: -0.1, z: 0.4, e: "in" }, { t: 0.75, x: -0.3, y: 0.12, z: 0.4, e: "out" }, { t: 0.9, j: "handR", dy: -0.1, z: 0.4, e: "in" }, { t: 1.05, x: -0.3, y: 0.12, z: 0.4, e: "out" }],
  props: { labels: [lab(0, 1.95, "ONE HAND · SIDE TO SIDE")] } });
A("h_side_L", mirrorSpec(ANIMS.h_side_R));

A("h_crossover", { view: "front", dur: 1.2, world: HANDW,
  kf: [
    { t: 0, p: M(DRIB, { ru: 35, rf: 40, lu: 25, lf: 20 }) }, { t: 0.6, p: M(DRIB, { lu: 35, lf: 40, ru: 25, rf: 20 }) }
  ],
  ball: [{ t: 0, j: "handR", dy: -0.1, z: 0.4, e: "in" }, { t: 0.3, x: 0, y: 0.12, z: 0.4, e: "out" }, { t: 0.6, j: "handL", dy: -0.1, z: 0.4, e: "in" }, { t: 0.9, x: 0, y: 0.12, z: 0.4, e: "out" }],
  props: { labels: [lab(0, 1.95, "V-BOUNCE · TIGHT, THEN WIDE")] } });

A("h_behind_back", { view: "front", dur: 1.6, world: HANDW,
  kf: [
    { t: 0, p: M(DRIB, { ru: 35, rf: 40, lu: 25, lf: 20 }) }, { t: 0.3, p: M(DRIB, { ru: 10, rf: 0, ruz: 0.6, lu: 25, lf: 20 }) },
    { t: 0.8, p: M(DRIB, { lu: 35, lf: 40, ru: 25, rf: 20 }) }, { t: 1.1, p: M(DRIB, { lu: 10, lf: 0, luz: 0.6, ru: 25, rf: 20 }) }
  ],
  ball: [{ t: 0, j: "handR", dy: -0.1, z: 0.3, e: "lin" }, { t: 0.3, j: "handR", dy: -0.15, z: -1, e: "in" }, { t: 0.55, x: 0, y: 0.12, z: -1, e: "out" }, { t: 0.8, j: "handL", dy: -0.1, z: 0.3, e: "lin" }, { t: 1.1, j: "handL", dy: -0.15, z: -1, e: "in" }, { t: 1.35, x: 0, y: 0.12, z: -1, e: "out" }],
  props: { labels: [lab(0, 1.95, "BEHIND · STAY LOW · BELOW THE KNEE")] } });

A("h_combo", { view: "front", dur: 2.4, world: HANDW,
  kf: [
    { t: 0, p: M(DRIB, { ru: 35, rf: 40, lu: 25, lf: 20 }) }, { t: 0.6, p: M(DRIB, { lu: 35, lf: 40, ru: 25, rf: 20 }) },
    { t: 1.2, p: M(DRIB, { ru: 35, rf: 40, lu: 25, lf: 20 }) }, { t: 1.5, p: M(DRIB, { ru: 10, rf: 0, ruz: 0.6 }) }, { t: 2.0, p: M(DRIB, { lu: 35, lf: 40, ru: 25, rf: 20 }) }
  ],
  ball: [
    { t: 0, j: "handR", dy: -0.1, z: 0.4, e: "in" }, { t: 0.3, x: 0, y: 0.12, z: 0.4, e: "out" },
    { t: 0.6, j: "handL", dy: -0.1, z: 0.4, e: "in" }, { t: 0.9, x: 0, y: 0.12, z: -0.2, e: "out" },
    { t: 1.2, j: "handR", dy: -0.1, z: 0.3, e: "lin" }, { t: 1.5, j: "handR", dy: -0.15, z: -1, e: "in" }, { t: 1.75, x: 0, y: 0.12, z: -1, e: "out" },
    { t: 2.0, j: "handL", dy: -0.1, z: 0.4, e: "in" }, { t: 2.2, x: 0, y: 0.12, z: 0.4, e: "out" }
  ],
  props: { labels: [lab(0, 1.95, "CROSS", 0, 0.55, { accent: 1 }), lab(0, 1.95, "BETWEEN", 0.6, 1.15, { accent: 1 }), lab(0, 1.95, "BEHIND", 1.2, 2.0, { accent: 1 })] } });

// ================= name → animation =================
const BY_NAME = {
  "W1 Fingertip Taps": "h_fingertip", "W2 Around the World": "h_around_world", "W3 Figure 8 Wraps": "h_fig8_wraps", "W4 Drop & Catch": "h_drop_catch",
  "01 Pound · Right": "h_pound_R", "02 Pound · Left": "h_pound_L", "03 Side-to-Side · Right": "h_side_R", "04 Side-to-Side · Left": "h_side_L",
  "05 Crossover": "h_crossover", "06 Behind the Back": "h_behind_back", "07 Figure 8 · Backward": "h_fig8_back", "08 Figure 8 · Forward": "h_fig8_fwd",
  "09 Cross–Between–Behind": "h_combo",
  "Jog & skip": "jog_skip", "Jog, skip & backpedal": "jog_skip_back", "Shuffle & carioca": "shuffle_carioca", "Lunge + twist": "lunge_twist",
  "3-D lunge": "lunge_3d", "Balance: ball around waist": "balance_waist", "Balance: wall toss": "balance_walltoss",
  "Squat jump & stick": "squat_jump_stick", "Countermovement jump & stick": "cmj_stick", "Plank shoulder taps": "plank_taps",
  "Glute bridge": "glute_bridge", "Single-leg glute bridge": "sl_glute_bridge", "Build-up runs": "buildup", "Nordic hamstring": "nordic",
  "Skater hop & stick": "skater", "Skater bounds & stick": "skater",
  "Fast feet on a line": "fast_feet_line", "In-and-out fast feet": "in_out_feet", "Reaction starts": "reaction_start",
  "Cone zig-zag": "cone_zigzag", "Shuttle 5-10-5": "shuttle_5105", "Pro agility 5-10-5": "shuttle_5105", "Sprint & stop": "sprint_stop",
  "Snap-downs": "snapdown", "Snap-down to drop squat": "snapdown", "Pogo hops": "pogo", "Line hops": "line_hops",
  "Broad jump & stick": "broad_jump", "TEST · Broad jump": "broad_jump", "Single-leg hop & stick": "sl_hop_stick",
  "Defensive stance hold": "def_stance", "Slides line to line": "slides", "Lane slides": "slides", "TEST · Slide test": "slides",
  "Zig-zag slides": "zigzag_slides", "Zig-zag + drop step": "zigzag_slides", "Closeout & chop": "closeout_chop",
  "Closeout, slide, recover": "closeout_recover", "Arrow slides": "arrow_slides", "Wall drive switches": "wall_drive",
  "Falling starts": "falling_start", "Arrow sprints": "arrow_sprints", "Crossover-step start": "crossover_start", "Line touch race": "line_touch",
  "Incline push-ups": "pushup_incline", "Push-ups": "pushup", "Tempo push-ups": "pushup_tempo", "Feet-up push-ups": "pushup_feetup",
  "Pike push-ups": "pike_pushup", "Bear crawl": "bear_crawl", "Plank": "plank", "TEST · Plank hold": "plank", "Plank reach-outs": "plank_reach",
  "Dead bug": "dead_bug", "Slow squats": "slow_squat", "Reverse lunges": "reverse_lunge", "Calf raises": "calf_raise",
  "Single-leg calf raise": "sl_calf_raise", "Side plank": "side_plank", "Bird dog": "bird_dog", "Superman hold": "superman",
  "Superman W-raise": "superman_w", "Split squat": "split_squat", "Tuck hollow hold": "tuck_hollow", "Hollow hold": "hollow_hold",
  "Wall sit": "wall_sit", "Crab walk": "crab_walk", "Slow mountain climbers": "mountain_climbers_slow", "Mountain climbers": "mountain_climbers",
  "Stretch": "stretch", "Stretch & breathe": "stretch", "Single-leg RDL": "sl_rdl", "Eyes-closed balance": "eyes_closed_balance", "Table rows": "table_row",
  "One-hand form shots": "form_shot", "Form shots, 3 spots": "form_3spots", "Bank shots": "bank_shot", "CHALLENGE · Hot Spot 60": "hot_spot",
  "Mikan drill": "mikan", "Mikan + reverse Mikan": "mikan", "CHALLENGE · Mikan Minute": "mikan",
  "Right-hand layups": "layup_right", "Left-hand layups": "layup_left", "Weak-hand layups": "layup_weak", "Layups, both hands": "layup_both",
  "Jump-stop power finish": "power_finish", "Power finishes": "power_finish", "Euro step layups": "euro_step",
  "Jump stop & pivots": "jump_stop_pivot", "Triple-threat jabs": "triple_threat", "Catch, pivot, shoot": "catch_pivot_shoot",
  "Free-throw routine": "free_throw", "CHALLENGE · Free Throw 10": "free_throw", "CHALLENGE · Free Throw 20": "free_throw",
  "5-spot shots, close": "spots_close", "CHALLENGE · Around the World": "spots_atw", "One-dribble pull-up": "pullup_1dribble",
  "Weak-hand form shots": "form_shot", "Warm-up shots": "shoot_generic", "Your favorite spots": "shoot_generic", "Spot-ups": "spots_mid",
  "CHALLENGE · Beat the Pro": "beat_pro", "1-2 step catch & shoot": "one_two_step", "Corner shots": "corner", "Elbow jumpers": "elbows",
  "CHALLENGE · Corner 60": "corner60", "Pass-fake pull-up": "passfake_pullup", "Rebound & outlet": "rebound_outlet",
  "Sprint-back jumpers": "sprint_back_jumper", "5-spot catch & shoot": "spots_mid", "5-spot threes": "spots_three",
  "Shot fake, side-step": "shotfake_sidestep", "CHALLENGE · 5-Spot 25": "spots_25"
};

const mirrored = {};
// name may carry " · Left" / " · Right" (L/R items in the timer)
export function animFor(name) {
  let base = name, side = null;
  const m = /^(.*) · (Left|Right)$/.exec(name);
  if (m && !BY_NAME[name]) { base = m[1]; side = m[2]; }
  const id = BY_NAME[base];
  if (!id || !ANIMS[id]) return null;
  if (side === "Right") {
    if (!mirrored[id]) mirrored[id] = mirrorSpec(ANIMS[id]);
    return mirrored[id];
  }
  return ANIMS[id];
}
export function hasAnim(name) { return !!animFor(name); }
