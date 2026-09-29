// Drill animation engine: a stick figure driven by keyframed joint angles.
// World units are metres, y points up. Three views:
//   side  – figure faces +x (its left side is nearest the viewer)
//   front – figure faces the viewer (its right side is on the viewer's left)
//   top   – bird's-eye view of a player token moving along a path

const SEG = { torso: 0.46, neck: 0.07, head: 0.105, uarm: 0.26, farm: 0.25, thigh: 0.38, shin: 0.38, foot: 0.12 };
const HIP_HALF = 0.085, SHOULDER_HALF = 0.165;
const D2R = Math.PI / 180;

export const BASE = {
  t: 0, h: 0, x: 0, air: 0, rot: 0,
  lt: 0, ls: 0, rt: 0, rs: 0,          // thigh / shin (absolute, 0 = straight down, + = forward or outward)
  lfa: 90, rfa: 90,                   // foot angle relative to shin
  lu: 4, lf: 8, ru: 4, rf: 8,         // upper arm / forearm (absolute)
  lz: 1, rz: 1, luz: 1, ruz: 1, tz: 1, // front view: leg / arm / torso foreshortening (1 = full length)
  py: null,                           // IK mode: pelvis height; feet placed at lfoot / rfoot (world x)
  lfoot: 0, rfoot: 0, lfooty: 0.04, rfooty: 0.04, lknee: 1, rknee: 1
};

const JOINTS = ["pelvis", "neck", "head", "shoulderL", "shoulderR", "elbowL", "elbowR", "handL", "handR",
  "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR", "toeL", "toeR"];

function ease(k, e) {
  if (e === "lin") return k;
  if (e === "in") return k * k;
  if (e === "out") return 1 - (1 - k) * (1 - k);
  if (e === "hold") return 0;
  return k * k * (3 - 2 * k);
}
function lerp(a, b, k) { return a + (b - a) * k; }
function dirDown(a) { return [Math.sin(a * D2R), -Math.cos(a * D2R)]; }

// ---------- skeleton ----------
function jointsSide(p) {
  const J = {};
  J.pelvis = [0, 0];
  const td = [Math.sin(p.t * D2R), Math.cos(p.t * D2R)];
  J.neck = [td[0] * SEG.torso, td[1] * SEG.torso];
  const hd = [Math.sin((p.t + p.h) * D2R), Math.cos((p.t + p.h) * D2R)];
  J.head = [J.neck[0] + hd[0] * (SEG.neck + SEG.head), J.neck[1] + hd[1] * (SEG.neck + SEG.head)];
  const sh = [td[0] * (SEG.torso - 0.04), td[1] * (SEG.torso - 0.04)];
  J.shoulderL = sh; J.shoulderR = sh.slice();
  for (const s of ["L", "R"]) {
    const u = dirDown(p[s.toLowerCase() + "u"]), f = dirDown(p[s.toLowerCase() + "f"]);
    const S = J["shoulder" + s];
    J["elbow" + s] = [S[0] + u[0] * SEG.uarm, S[1] + u[1] * SEG.uarm];
    const E = J["elbow" + s];
    J["hand" + s] = [E[0] + f[0] * SEG.farm, E[1] + f[1] * SEG.farm];
    const th = p[s.toLowerCase() + "t"], shn = p[s.toLowerCase() + "s"], fa = p[s.toLowerCase() + "fa"];
    const tv = dirDown(th), sv = dirDown(shn), fv = dirDown(shn + fa);
    J["hip" + s] = [0, 0];
    J["knee" + s] = [tv[0] * SEG.thigh, tv[1] * SEG.thigh];
    const K = J["knee" + s];
    J["ankle" + s] = [K[0] + sv[0] * SEG.shin, K[1] + sv[1] * SEG.shin];
    const A = J["ankle" + s];
    J["toe" + s] = [A[0] + fv[0] * SEG.foot, A[1] + fv[1] * SEG.foot];
  }
  return J;
}

function jointsFront(p) {
  // side sign: figure's left is on the viewer's right (+x)
  const J = {};
  J.pelvis = [0, 0];
  const tv = [Math.sin(p.t * D2R), Math.cos(p.t * D2R)];
  const perp = [tv[1], -tv[0]];           // points to viewer's right when upright
  const tl = SEG.torso * p.tz;
  J.neck = [tv[0] * tl, tv[1] * tl];
  J.head = [J.neck[0] + Math.sin((p.t + p.h) * D2R) * (SEG.neck + SEG.head) * (0.6 + 0.4 * p.tz), J.neck[1] + Math.cos((p.t + p.h) * D2R) * (SEG.neck + SEG.head) * (0.6 + 0.4 * p.tz)];
  const shc = [tv[0] * (tl - 0.05), tv[1] * (tl - 0.05)];
  for (const s of ["L", "R"]) {
    const sg = s === "L" ? 1 : -1, k = s.toLowerCase();
    const S = [shc[0] + perp[0] * SHOULDER_HALF * sg, shc[1] + perp[1] * SHOULDER_HALF * sg];
    J["shoulder" + s] = S;
    const az = p[k + "uz"];
    const u = dirDown(p[k + "u"]), f = dirDown(p[k + "f"]);
    J["elbow" + s] = [S[0] + sg * u[0] * SEG.uarm * az, S[1] + u[1] * SEG.uarm * az];
    const E = J["elbow" + s];
    J["hand" + s] = [E[0] + sg * f[0] * SEG.farm * az, E[1] + f[1] * SEG.farm * az];
    const H = [perp[0] * HIP_HALF * sg, perp[1] * HIP_HALF * sg];
    J["hip" + s] = H;
    const lz = p[k + "z"];
    const th = dirDown(p[k + "t"]), sv = dirDown(p[k + "s"]);
    J["knee" + s] = [H[0] + sg * th[0] * SEG.thigh * lz, H[1] + th[1] * SEG.thigh * lz];
    const K = J["knee" + s];
    J["ankle" + s] = [K[0] + sg * sv[0] * SEG.shin * lz, K[1] + sv[1] * SEG.shin * lz];
    const A = J["ankle" + s];
    J["toe" + s] = [A[0] + sg * 0.05, A[1] - 0.02];
  }
  return J;
}

function rotateAll(J, cx, cy, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (const k in J) {
    const x = J[k][0] - cx, y = J[k][1] - cy;
    J[k] = [cx + x * c - y * s, cy + x * s + y * c];
  }
}

function legIK(hx, hy, ax, ay, bend) {
  const a = SEG.thigh, b = SEG.shin;
  let dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy);
  if (d > a + b - 1e-4) { const k = (a + b - 1e-4) / d; dx *= k; dy *= k; d = a + b - 1e-4; }
  const theta = Math.atan2(dx, -dy);
  const alpha = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const th = theta + bend * alpha;
  const kx = hx + a * Math.sin(th), ky = hy - a * Math.cos(th);
  const sh = Math.atan2(hx + dx - kx, -(hy + dy - ky));
  return [th / D2R, sh / D2R];
}
function applyIK(p, view) {
  if (typeof p.py !== "number") return p;
  const q = Object.assign({}, p);
  for (const s of ["l", "r"]) {
    const fx = p[s + "foot"], fy = p[s + "footy"];
    if (typeof fx !== "number") continue;
    if (view === "front") {
      const sg = s === "l" ? 1 : -1;
      const hx = p.x + sg * HIP_HALF, hy = p.py;
      const dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
      q[s + "z"] = Math.min(1, d / (SEG.thigh + SEG.shin));
      const ang = Math.atan2(sg * dx, -dy) / D2R;
      const knee = (1 - q[s + "z"]) * 60;
      q[s + "t"] = ang + knee; q[s + "s"] = ang - knee * 1.05;
    } else {
      const r = legIK(p.x, p.py, fx, fy, p[s + "knee"]);
      q[s + "t"] = r[0]; q[s + "s"] = r[1];
    }
  }
  return q;
}

function solve(p, view) {
  p = applyIK(p, view);
  const J = view === "front" ? jointsFront(p) : jointsSide(p);
  if (typeof p.py === "number") {
    if (p.rot) rotateAll(J, 0, 0, p.rot * D2R);
    for (const k in J) J[k] = [J[k][0] + p.x, J[k][1] + p.py];
    return J;
  }
  if (p.rot) rotateAll(J, 0, 0, p.rot * D2R);
  let ax, ay;
  if (p.c && p.c.length) {
    const A = J[p.c[0]];
    if (p.c.length > 1) {
      const B = J[p.c[1]];
      const vx = B[0] - A[0], vy = B[1] - A[1], R = Math.hypot(vx, vy) || 1;
      const want = Math.max(-0.999, Math.min(0.999, (p.cdy || 0) / R));
      const phi = Math.atan2(vy, vx);
      let th = Math.asin(want) - phi;
      const dir = p.cdir || 1;
      const nx = vx * Math.cos(th) - vy * Math.sin(th);
      if (Math.sign(nx) !== dir) th = Math.PI - Math.asin(want) - phi;
      rotateAll(J, A[0], A[1], th);
    }
    ax = A[0]; ay = A[1];
    const dx = p.x - ax, dy = p.air - ay;
    for (const k in J) J[k] = [J[k][0] + dx, J[k][1] + dy];
  } else {
    let low = Infinity;
    for (const k of ["ankleL", "ankleR", "toeL", "toeR"]) low = Math.min(low, J[k][1]);
    const dy = p.air - low + (view === "front" ? 0.03 : 0.035);
    for (const k in J) J[k] = [J[k][0] + p.x, J[k][1] + dy];
  }
  return J;
}

// ---------- keyframe sampling ----------
function normKF(spec) {
  if (spec._kf) return spec._kf;
  const base = Object.assign({}, BASE, spec.base || {});
  const kf = spec.kf.map((k) => {
    const p = Object.assign({}, base, k.p || {});
    return { t: k.t, p, e: k.e, ball: k.ball, sig: k.sig };
  });
  if (kf[kf.length - 1].t < spec.dur) kf.push({ t: spec.dur, p: kf[0].p, e: "io", ball: kf[0].ball });
  spec._kf = kf;
  return kf;
}
function samplePose(kf, t) {
  let i = 0;
  while (i < kf.length - 2 && t >= kf[i + 1].t) i++;
  const a = kf[i], b = kf[i + 1];
  const span = b.t - a.t || 1;
  const k = ease(Math.max(0, Math.min(1, (t - a.t) / span)), a.e);
  const p = {};
  for (const key in a.p) {
    const va = a.p[key], vb = b.p[key];
    p[key] = typeof va === "number" && typeof vb === "number" ? lerp(va, vb, k) : (k < 0.5 ? va : vb);
  }
  return p;
}

function ballPos(spec, t, J) {
  const tl = spec.ball;
  if (!tl || !tl.length) return null;
  const pts = tl.slice();
  if (pts[pts.length - 1].t < spec.dur) pts.push(Object.assign({}, pts[0], { t: spec.dur }));
  let i = 0;
  while (i < pts.length - 2 && t >= pts[i + 1].t) i++;
  const a = pts[i], b = pts[i + 1];
  const span = b.t - a.t || 1;
  const raw = Math.max(0, Math.min(1, (t - a.t) / span));
  const k = ease(raw, a.e || "io");
  const pa = resolveBall(a, J), pb = resolveBall(b, J);
  if (!pa || !pb) return null;
  let x = lerp(pa[0], pb[0], a.arc ? raw : k), y = lerp(pa[1], pb[1], a.arc ? raw : k);
  if (a.arc) y += a.arc * 4 * raw * (1 - raw);
  const z = lerp(a.z || 0, b.z || 0, k);
  return { x, y, z, hide: !!a.hide };
}
function resolveBall(k, J) {
  if (k.j) { const P = J[k.j]; return [P[0] + (k.dx || 0), P[1] + (k.dy || 0)]; }
  if (k.mid) { const A = J[k.mid[0]], B = J[k.mid[1]]; return [(A[0] + B[0]) / 2 + (k.dx || 0), (A[1] + B[1]) / 2 + (k.dy || 0)]; }
  return [k.x, k.y];
}

// ---------- drawing ----------
export const THEME = {
  paper: "#FBF8F2", ink: "#1B1814", far: "#A39888", floor: "#CFC4B2", prop: "#BDB1A0", propFill: "#E9E1D2",
  ball: "#E0571F", text: "#4B453C", signal: "#E0571F"
};

function setup(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
function camera(spec, w, h) {
  const W = spec.world || (spec.view === "top" ? { x0: -4, x1: 4, y0: -3, y1: 3 } : { x0: -1.3, x1: 1.3, y0: -0.12, y1: 2.0 });
  const pad = 10;
  const s = Math.min((w - pad * 2) / (W.x1 - W.x0), (h - pad * 2) / (W.y1 - W.y0));
  const ox = pad + ((w - pad * 2) - (W.x1 - W.x0) * s) / 2 - W.x0 * s;
  const oy = h - pad - ((h - pad * 2) - (W.y1 - W.y0) * s) / 2 + W.y0 * s;
  return { s, X: (x) => ox + x * s, Y: (y) => oy - y * s, W, h, w, fpx: Math.round(Math.max(12, Math.min(22, h * 0.068))) };
}

// Draw a label that always fits inside the canvas (shrinks, then shifts inward).
function fitLabel(ctx, cam, text, x, y, px, weight) {
  const maxW = cam.w - 16;
  let size = px;
  ctx.font = `${weight} ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  let tw = ctx.measureText(text).width;
  while (tw > maxW && size > 9) { size -= 1; ctx.font = `${weight} ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`; tw = ctx.measureText(text).width; }
  const cx = Math.max(8 + tw / 2, Math.min(cam.w - 8 - tw / 2, x));
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, cx, y);
}

function drawProps(ctx, cam, spec, t) {
  const P = spec.props || {}, { X, Y, s } = cam;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  // floor
  ctx.strokeStyle = THEME.floor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X(cam.W.x0 - 1), Y(0)); ctx.lineTo(X(cam.W.x1 + 1), Y(0)); ctx.stroke();
  (P.lines || []).forEach((lx) => {
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(lx - 0.12), Y(0) + 1); ctx.lineTo(X(lx + 0.12), Y(0) + 1); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(lx), Y(0)); ctx.lineTo(X(lx), Y(0) + 6); ctx.stroke();
  });
  (P.cones || []).forEach((cx) => {
    ctx.fillStyle = THEME.ball;
    ctx.beginPath(); ctx.moveTo(X(cx - 0.09), Y(0)); ctx.lineTo(X(cx + 0.09), Y(0)); ctx.lineTo(X(cx), Y(0.22)); ctx.closePath(); ctx.fill();
  });
  if (P.wall !== undefined) {
    ctx.fillStyle = THEME.propFill; ctx.strokeStyle = THEME.prop; ctx.lineWidth = 2;
    const wx = P.wall, ww = 0.14 * (P.wallSide || 1);
    ctx.fillRect(Math.min(X(wx), X(wx + ww)), Y(2.4), Math.abs(ww * s), 2.4 * s);
    ctx.beginPath(); ctx.moveTo(X(wx), Y(0)); ctx.lineTo(X(wx), Y(2.4)); ctx.stroke();
  }
  for (const key of ["bench", "box", "table"]) {
    const b = P[key]; if (!b) continue;
    ctx.fillStyle = THEME.propFill; ctx.strokeStyle = THEME.prop; ctx.lineWidth = 2;
    if (key === "table") {
      ctx.fillRect(X(b.x), Y(b.h), b.w * s, 0.05 * s); ctx.strokeRect(X(b.x), Y(b.h), b.w * s, 0.05 * s);
      ctx.beginPath(); ctx.moveTo(X(b.x + 0.05), Y(b.h)); ctx.lineTo(X(b.x + 0.05), Y(0)); ctx.moveTo(X(b.x + b.w - 0.05), Y(b.h)); ctx.lineTo(X(b.x + b.w - 0.05), Y(0)); ctx.stroke();
    } else {
      ctx.fillRect(X(b.x), Y(b.h), b.w * s, b.h * s); ctx.strokeRect(X(b.x), Y(b.h), b.w * s, b.h * s);
    }
  }
  if (P.anchor) {
    const a = P.anchor; ctx.fillStyle = THEME.propFill; ctx.strokeStyle = THEME.prop; ctx.lineWidth = 2;
    ctx.fillRect(X(a.x), Y(a.h), a.w * s, a.h * s); ctx.strokeRect(X(a.x), Y(a.h), a.w * s, a.h * s);
  }
  if (P.hoop) {
    const hp = P.hoop, d = hp.dir || 1, rimY = hp.h || 3.05, bx = hp.x;
    ctx.strokeStyle = THEME.prop; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(X(bx + d * 0.9), Y(0)); ctx.lineTo(X(bx + d * 0.9), Y(rimY + 0.5)); ctx.lineTo(X(bx + d * 0.05), Y(rimY + 0.5)); ctx.stroke();
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(X(bx), Y(rimY - 0.15)); ctx.lineTo(X(bx), Y(rimY + 0.9)); ctx.stroke();
    ctx.strokeStyle = THEME.ball; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(bx), Y(rimY)); ctx.lineTo(X(bx - d * 0.46), Y(rimY)); ctx.stroke();
    ctx.strokeStyle = THEME.far; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) { const nx = bx - d * (0.03 + i * 0.1); ctx.moveTo(X(nx), Y(rimY)); ctx.lineTo(X(bx - d * (0.1 + i * 0.065)), Y(rimY - 0.38)); }
    ctx.stroke();
  }
  if (P.hoopFront) {
    const hf = P.hoopFront, rimY = hf.h || 3.05;
    ctx.fillStyle = THEME.propFill; ctx.strokeStyle = THEME.ink; ctx.lineWidth = 3;
    ctx.fillRect(X(hf.x - 0.9), Y(rimY + 0.9), 1.8 * s, 1.05 * s); ctx.strokeRect(X(hf.x - 0.9), Y(rimY + 0.9), 1.8 * s, 1.05 * s);
    ctx.strokeRect(X(hf.x - 0.3), Y(rimY + 0.45), 0.6 * s, 0.45 * s);
    ctx.strokeStyle = THEME.ball; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(X(hf.x), Y(rimY), 0.23 * s, 0.06 * s, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = THEME.far; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -2; i <= 2; i++) { ctx.moveTo(X(hf.x + i * 0.1), Y(rimY)); ctx.lineTo(X(hf.x + i * 0.06), Y(rimY - 0.35)); }
    ctx.stroke();
  }
  (P.labels || []).forEach((L) => {
    if (L.t0 !== undefined && (t < L.t0 || t > L.t1)) return;
    if (!L.text) return;
    ctx.fillStyle = L.accent ? THEME.signal : THEME.text;
    fitLabel(ctx, cam, L.text, X(L.x), Math.max(cam.fpx * 0.7, Y(L.y)), L.size ? Math.round(L.size * s) : cam.fpx, L.bold ? 800 : 700);
  });
}

function limb(ctx, cam, pts, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cam.X(pts[0][0]), cam.Y(pts[0][1]));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(cam.X(pts[i][0]), cam.Y(pts[i][1]));
  ctx.stroke();
}

function drawBall(ctx, cam, b, dim) {
  const r = 0.12 * cam.s;
  ctx.globalAlpha = dim ? 0.45 : 1;
  ctx.fillStyle = THEME.ball; ctx.strokeStyle = THEME.ink; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cam.X(b.x), cam.Y(b.y), r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cam.X(b.x) - r, cam.Y(b.y)); ctx.lineTo(cam.X(b.x) + r, cam.Y(b.y));
  ctx.moveTo(cam.X(b.x), cam.Y(b.y) - r); ctx.lineTo(cam.X(b.x), cam.Y(b.y) + r); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFigure(ctx, cam, J, view, near) {
  const s = cam.s, limbW = Math.max(3, 0.075 * s), torsoW = Math.max(5, (view === "front" ? 0.2 : 0.12) * s);
  const leg = (k) => [J["hip" + k], J["knee" + k], J["ankle" + k], J["toe" + k]];
  const arm = (k) => [J["shoulder" + k], J["elbow" + k], J["hand" + k]];
  const F = near === "R" ? "L" : "R", N = near === "R" ? "R" : "L";
  if (view === "side") {
    limb(ctx, cam, arm(F), THEME.far, limbW);
    limb(ctx, cam, leg(F), THEME.far, limbW);
    limb(ctx, cam, [J.pelvis, J.neck], THEME.ink, torsoW);
    limb(ctx, cam, leg(N), THEME.ink, limbW);
  } else {
    limb(ctx, cam, leg("R"), THEME.ink, limbW);
    limb(ctx, cam, leg("L"), THEME.ink, limbW);
    limb(ctx, cam, [J.hipR, J.hipL], THEME.ink, limbW * 1.2);
    const mid = [(J.shoulderL[0] + J.shoulderR[0]) / 2, (J.shoulderL[1] + J.shoulderR[1]) / 2];
    limb(ctx, cam, [J.pelvis, mid], THEME.ink, torsoW);
    limb(ctx, cam, [J.shoulderR, J.shoulderL], THEME.ink, limbW * 1.2);
    limb(ctx, cam, arm("R"), THEME.ink, limbW);
  }
  // head
  ctx.fillStyle = THEME.ink;
  ctx.beginPath(); ctx.arc(cam.X(J.head[0]), cam.Y(J.head[1]), SEG.head * s, 0, Math.PI * 2); ctx.fill();
  if (view === "side") limb(ctx, cam, arm(N), THEME.ink, limbW);
  else limb(ctx, cam, arm("L"), THEME.ink, limbW);
}

function drawSignal(ctx, cam, spec, t, w, h) {
  const list = spec.signals || [];
  for (const g of list) {
    if (t < g.t0 || t > g.t1) continue;
    const cx = g.x !== undefined ? cam.X(g.x) : w - 44, cy = g.y !== undefined ? cam.Y(g.y) : 40;
    ctx.fillStyle = THEME.signal; ctx.strokeStyle = THEME.signal;
    if (g.text) {
      ctx.font = `400 ${Math.round(h * 0.16)}px Anton, Impact, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(g.text, cx, cy);
    }
    if (g.arrow) {
      const r = h * 0.1, a = { right: 0, left: Math.PI, up: -Math.PI / 2, down: Math.PI / 2 }[g.arrow];
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.lineWidth = Math.max(5, r * 0.28); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r * 0.8, 0); ctx.moveTo(r * 0.2, -r * 0.6); ctx.lineTo(r * 0.85, 0); ctx.lineTo(r * 0.2, r * 0.6); ctx.stroke();
      ctx.restore();
    }
  }
}

// ---------- top view ----------
function sampleTop(path, t, dur) {
  const pts = path.slice();
  if (pts[pts.length - 1].t < dur) pts.push(Object.assign({}, pts[0], { t: dur }));
  let i = 0;
  while (i < pts.length - 2 && t >= pts[i + 1].t) i++;
  const a = pts[i], b = pts[i + 1];
  const k = ease(Math.max(0, Math.min(1, (t - a.t) / ((b.t - a.t) || 1))), a.e || "lin");
  let df = (b.f ?? a.f ?? 0) - (a.f ?? 0);
  while (df > 180) df -= 360; while (df < -180) df += 360;
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), f: (a.f ?? 0) + df * k, m: a.m || "run", moving: Math.hypot(b.x - a.x, b.y - a.y) > 0.01 };
}
function drawTop(ctx, cam, spec, t) {
  const P = spec.props || {}, { X, Y, s } = cam;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  (P.court || []).forEach((l) => { ctx.strokeStyle = THEME.floor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(l[0]), Y(l[1])); ctx.lineTo(X(l[2]), Y(l[3])); ctx.stroke(); });
  (P.arcs || []).forEach((a) => { ctx.strokeStyle = THEME.floor; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(a[0]), Y(a[1]), a[2] * s, a[3] * D2R, a[4] * D2R); ctx.stroke(); });
  (P.lines || []).forEach((l) => { ctx.strokeStyle = THEME.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(l[0]), Y(l[1])); ctx.lineTo(X(l[2]), Y(l[3])); ctx.stroke(); });
  (P.cones || []).forEach((c) => { ctx.fillStyle = THEME.ball; ctx.beginPath(); ctx.moveTo(X(c[0]), Y(c[1] + 0.14)); ctx.lineTo(X(c[0] + 0.12), Y(c[1] - 0.1)); ctx.lineTo(X(c[0] - 0.12), Y(c[1] - 0.1)); ctx.closePath(); ctx.fill(); });
  (P.spots || []).forEach((c, i) => {
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 2; ctx.fillStyle = THEME.paper;
    ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), 0.22 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = THEME.ink; ctx.font = `800 ${Math.round(0.26 * s)}px "Barlow Condensed", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), X(c[0]), Y(c[1]));
  });
  if (P.hoop) {
    const [hx, hy] = P.hoop;
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(hx - 0.9), Y(hy + 0.35)); ctx.lineTo(X(hx + 0.9), Y(hy + 0.35)); ctx.stroke();
    ctx.strokeStyle = THEME.ball; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(hx), Y(hy), 0.23 * s, 0, Math.PI * 2); ctx.stroke();
  }
  // trail
  if (spec.trail !== false && spec.path) {
    ctx.strokeStyle = THEME.far; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); spec.path.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)))); ctx.stroke(); ctx.setLineDash([]);
  }
  (P.labels || []).forEach((L) => {
    if (L.t0 !== undefined && (t < L.t0 || t > L.t1)) return;
    if (!L.text) return;
    ctx.fillStyle = L.accent ? THEME.signal : THEME.text;
    fitLabel(ctx, cam, L.text, X(L.x), Y(L.y), L.size ? Math.round(L.size * s) : cam.fpx, 700);
  });
  if (!spec.path) return;
  const st = sampleTop(spec.path, t, spec.dur);
  const fr = st.f * D2R, fwd = [Math.sin(fr), Math.cos(fr)], side = [Math.cos(fr), -Math.sin(fr)];
  // ball: `on` = with the player (sd: -1 left hand, 1 right hand), db = dribbling (bounces)
  let ball = null;
  if (spec.ball) {
    const bp = spec.ball.slice(); if (bp[bp.length - 1].t < spec.dur) bp.push(Object.assign({}, bp[0], { t: spec.dur }));
    let i = 0; while (i < bp.length - 2 && t >= bp[i + 1].t) i++;
    const a = bp[i], b = bp[i + 1], k = Math.max(0, Math.min(1, (t - a.t) / ((b.t - a.t) || 1)));
    const onPos = (q) => {
      const sd = q.sd || 0, f = sd ? 0.12 : 0.25;
      return [st.x + fwd[0] * f + side[0] * sd * 0.3, st.y + fwd[1] * f + side[1] * sd * 0.3];
    };
    const pa = a.on ? onPos(a) : [a.x, a.y];
    const pb = b.on ? onPos(b) : [b.x, b.y];
    const bounce = a.db ? Math.abs(Math.sin(t * Math.PI * 2.6)) : 0;
    if (!a.hide) ball = [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k), a.lift ? a.lift * 4 * k * (1 - k) : bounce];
  }
  // player token
  const ph = (t * (st.m === "slide" ? 3 : 4)) % 1, sw = Math.sin(ph * Math.PI * 2);
  let fl, frt;
  const stance = st.m === "slide" ? 0.2 + (st.moving ? 0.08 * sw : 0) : 0.13;
  const stride = st.moving && st.m !== "slide" && st.m !== "stand" ? 0.2 * sw * (st.m === "back" ? -1 : 1) : 0;
  fl = [st.x - side[0] * stance + fwd[0] * stride, st.y - side[1] * stance + fwd[1] * stride];
  frt = [st.x + side[0] * stance - fwd[0] * stride, st.y + side[1] * stance - fwd[1] * stride];
  ctx.fillStyle = THEME.ink;
  for (const f of [fl, frt]) { ctx.save(); ctx.translate(X(f[0]), Y(f[1])); ctx.rotate(-fr); ctx.beginPath(); ctx.ellipse(0, 0, 0.07 * s, 0.13 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(X(st.x), Y(st.y)); ctx.rotate(-fr);
  ctx.fillStyle = THEME.paper; ctx.strokeStyle = THEME.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.3 * s, 0.14 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = THEME.ink; ctx.beginPath(); ctx.arc(0, 0, 0.12 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-0.07 * s, -0.16 * s); ctx.lineTo(0, -0.28 * s); ctx.lineTo(0.07 * s, -0.16 * s); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (ball) {
    const r = 0.12 * s * (1 + ball[2] * 0.25);
    ctx.fillStyle = THEME.ball; ctx.strokeStyle = THEME.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(X(ball[0]), Y(ball[1]), r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // mode label
  if (spec.showMode !== false) {
    const lab = { run: "RUN", slide: "SLIDE", back: "BACKPEDAL", stand: "", shoot: "SHOOT", jump: "JUMP", walk: "WALK", pivot: "PIVOT" }[st.m] || "";
    if (lab) { ctx.fillStyle = THEME.text; ctx.font = `800 ${Math.round(cam.fpx * 0.8)}px "Barlow Condensed", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(lab, X(st.x), Y(st.y - 0.55)); }
  }
}

// ---------- public API ----------
export function drawFrame(canvas, spec, t) {
  const { ctx, w, h } = setup(canvas);
  ctx.fillStyle = THEME.paper; ctx.fillRect(0, 0, w, h);
  const cam = camera(spec, w, h);
  if (spec.view === "top") { drawTop(ctx, cam, spec, t); drawSignal(ctx, cam, spec, t, w, h); return; }
  drawProps(ctx, cam, spec, t);
  const kf = normKF(spec);
  const p = samplePose(kf, t);
  const J = solve(p, spec.view);
  const b = ballPos(spec, t, J);
  const behind = b && !b.hide && (b.z < 0);
  if (behind) drawBall(ctx, cam, b, true);
  drawFigure(ctx, cam, J, spec.view, spec.near);
  if (b && !b.hide && !behind) drawBall(ctx, cam, b, false);
  drawSignal(ctx, cam, spec, t, w, h);
}

export class Player {
  constructor(canvas) { this.canvas = canvas; this.spec = null; this.raf = 0; this.t0 = 0; this.paused = false; this.pauseAt = 0; this.speed = 1; }
  play(spec) {
    this.spec = spec; this.t0 = performance.now(); this.paused = false;
    cancelAnimationFrame(this.raf);
    const loop = (now) => {
      if (!this.spec) return;
      const el = (this.paused ? this.pauseAt : now - this.t0) / 1000 * this.speed;
      try { drawFrame(this.canvas, this.spec, el % this.spec.dur); } catch (e) { console.error(e); this.stop(); return; }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  pause() { if (!this.paused) { this.paused = true; this.pauseAt = performance.now() - this.t0; } }
  resume() { if (this.paused) { this.t0 = performance.now() - this.pauseAt; this.paused = false; } }
  stop() { cancelAnimationFrame(this.raf); this.spec = null; }
}

// helpers for authoring
export function mirrorSpec(spec) {
  const swap = (o) => {
    if (!o) return o;
    const n = {};
    for (const k in o) {
      let nk = k;
      if (/^l(t|s|fa|u|f|z|uz|foot|footy|knee)$/.test(k)) nk = "r" + k.slice(1);
      else if (/^r(t|s|fa|u|f|z|uz|foot|footy|knee)$/.test(k)) nk = "l" + k.slice(1);
      n[nk] = (spec.view === "front" && /^(l|r)foot$/.test(k) && typeof o[k] === "number") ? -o[k] : o[k];
    }
    if (o.c) n.c = o.c.map((j) => j.replace(/L$/, "#").replace(/R$/, "L").replace(/#$/, "R"));
    if (typeof o.t === "number" && spec.view === "front") n.t = -o.t;
    if (typeof o.x === "number" && spec.view === "front") n.x = -o.x;
    if (typeof o.rot === "number" && spec.view === "front") n.rot = -o.rot;
    return n;
  };
  const out = Object.assign({}, spec, { _kf: null });
  out.base = swap(spec.base);
  out.kf = spec.kf.map((k) => Object.assign({}, k, { p: swap(k.p) }));
  if (spec.signals) out.signals = spec.signals.map((g) => Object.assign({}, g, g.arrow ? { arrow: { left: "right", right: "left" }[g.arrow] || g.arrow } : {}));
  if (spec.ball) out.ball = spec.ball.map((b) => {
    const nb = Object.assign({}, b);
    if (b.j) nb.j = b.j.replace(/L$/, "#").replace(/R$/, "L").replace(/#$/, "R");
    if (b.mid) nb.mid = b.mid.map((j) => j.replace(/L$/, "#").replace(/R$/, "L").replace(/#$/, "R"));
    if (spec.view === "front") { if (typeof b.x === "number") nb.x = -b.x; if (typeof b.dx === "number") nb.dx = -b.dx; }
    return nb;
  });
  if (spec.view === "front" && spec.props) {
    const pr = Object.assign({}, spec.props);
    if (pr.lines) pr.lines = pr.lines.map((x) => -x);
    if (pr.cones) pr.cones = pr.cones.map((x) => -x);
    if (pr.labels) pr.labels = pr.labels.map((L) => Object.assign({}, L, { x: -L.x }));
    out.props = pr;
  }
  return out;
}
