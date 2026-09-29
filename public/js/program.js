// 67 Days Streak Court · 67-day training program for players aged 10–15.
//
// Structure
// - Two age tracks: 10–11 and 12–15 (the NBA / USA Basketball youth age bands).
// - Sessions follow a 5-session cycle, A–E. E is always a test day.
// - Day N means the Nth session you complete, not a calendar date. Missed days never skip content.
// - Phases: Foundation (days 1–20), Build (21–45), Game Speed (46–65), Finals (66 taper, 67 graduation).
// - After day 67, bonus days repeat the Game Speed cycle.
//
// Each drill: I(name, seconds, cue, {r: rest s, x: sets, L: left+right, t: kind, dirs, ch, test})
// Every drill name needs an animation in BY_NAME (drills.js).

export function I(n, s, c, o) {
  o = o || {};
  return { n: n, s: s, c: c || "", r: o.r || 0, x: o.x || 1, L: !!o.L, t: o.t || null, dirs: o.dirs || null, ch: o.ch || null, test: o.test || null };
}

export const PROGRAM_DAYS = 67;
export const WEEK_MAX = 5; // sessions per Monday–Sunday week

export const AGES = [10, 11, 12, 13, 14, 15];
export const GROUPS = {
  "10-11": { id: "10-11", label: "Ages 10–11", short: "10–11", sleep: "9–12 hours" },
  "12-15": { id: "12-15", label: "Ages 12–15", short: "12–15", sleep: "8–10 hours" }
};
export const groupForAge = (age) => (Number(age) <= 11 ? "10-11" : "12-15");

export const PHASES = [
  { id: 1, name: "Foundation", from: 1, to: 20, goal: "Clean technique: form shooting, layups with both hands, handles standing still, quiet landings, a low stance." },
  { id: 2, name: "Build", from: 21, to: 45, goal: "More range and control: new moves with both hands, finishes on both sides, single-leg strength, more jumps." },
  { id: 3, name: "Game Speed", from: 46, to: 65, goal: "Skills at game speed: handles on the move, pull-ups, crossovers into finishes, reacting to signals." },
  { id: 4, name: "Finals", from: 66, to: 67, goal: "Day 66 is light so you're fresh. Day 67: final tests and the graduation game." }
];
export function phaseOf(n) {
  if (n > PROGRAM_DAYS) return PHASES[2];
  return PHASES.find((p) => n >= p.from && n <= p.to) || PHASES[0];
}
export const CYCLE = ["a", "b", "c", "d", "e"];
export const cycleOf = (n) => CYCLE[(Math.max(1, n) - 1) % 5];
export const isTestDay = (n) => n === PROGRAM_DAYS || (n !== PROGRAM_DAYS - 1 && cycleOf(n) === "e");

export const CHALLENGES = {
  hotspot60: { label: "Hot Spot 60", unit: "makes", max: 40, how: "Makes in 60 s from the block. Get your own rebound." },
  mikan60: { label: "Mikan Minute", unit: "makes", max: 60, how: "Makes in 60 s, alternating hands under the rim." },
  ft10: { label: "Free Throw 10", unit: "of 10", max: 10, how: "Shoot 10 free throws. Count the makes." },
  atw10: { label: "Around the World", unit: "of 10", max: 10, how: "2 shots at each of 5 close spots. Makes out of 10." },
  btp11: { label: "Beat the Pro", unit: "points", max: 11, how: "Make = 1 point for you. Miss = 2 for the Pro. First to 11. Enter your points (11 = you won)." },
  corner60: { label: "Corner 60", unit: "makes", max: 40, how: "Makes in 60 s from one corner. Get your own rebound." },
  ft20: { label: "Free Throw 20", unit: "of 20", max: 20, how: "Shoot 20 free throws. Count the makes." },
  spot25: { label: "5-Spot 25", unit: "of 25", max: 25, how: "5 shots from each of 5 spots. Makes out of 25." }
};
export const TESTS = {
  "10-11": [
    { id: "broad", label: "Broad jump", unit: "cm", max: 400, how: "Best of 3. Line to back heel." },
    { id: "slides", label: "Slide test", unit: "touches", max: 60, how: "Lines 3 m apart. Touches in 30 s." },
    { id: "plank", label: "Plank hold", unit: "sec", max: 180, how: "Max 90 s." }
  ],
  "12-15": [
    { id: "broad", label: "Broad jump", unit: "cm", max: 400, how: "Best of 3. Line to back heel." },
    { id: "slides", label: "Slide test", unit: "touches", max: 60, how: "Lane width (4.9 m). Touches in 30 s." },
    { id: "plank", label: "Plank hold", unit: "sec", max: 240, how: "Max 120 s." }
  ]
};

const STRETCH_CUE = "Calves, hamstrings, hips, quads. Slow breaths, no bouncing.";

/* ---------------- Handles: one circuit per phase (7 min) ---------------- */
const HANDLES_WARM = [
  I("W1 Fingertip Taps", 30, "Quick taps, overhead down to your knees and back."),
  I("W2 Around the World", 30, "Head, waist, knees, then back up. Switch direction halfway."),
  I("W3 Figure 8 Wraps", 30, "Around and through both legs, no dribble. Switch halfway."),
  I("W4 Drop & Catch", 30, "One hand in front, one behind your legs. Drop, switch hands, catch before it lands.")
];
export const HANDLES = {
  1: { title: "Handles · Level 1", items: HANDLES_WARM.concat([
    I("01 Pound · Right", 30, "As hard as you can, 45° in front of your right foot. Knee height or lower."),
    I("02 Pound · Left", 30, "Same power on the left. Eyes forward."),
    I("03 Side-to-Side · Right", 30, "One hand. Push the ball side to side in front of you."),
    I("04 Side-to-Side · Left", 30, "Right arm up to protect the ball."),
    I("05 Crossover", 30, "Find the rhythm. Tight, then wide."),
    I("06 Behind the Back", 30, "Stay low. Keep it below the knee."),
    I("07 Figure 8 · Backward", 30, "Through the legs, front to back."),
    I("08 Figure 8 · Forward", 30, "Back to front. The hand switch is the hard part."),
    I("09 Cross–Between–Behind", 60, "One full minute. Mess up? Pick up where you left off.")
  ]) },
  2: { title: "Handles · Level 2: Control", items: HANDLES_WARM.concat([
    I("01 Pound, eyes up · Right", 30, "Hard pounds. Eyes on a spot on the wall, not on the ball."),
    I("02 Pound, eyes up · Left", 30, "Same power on the left. Eyes up the whole time."),
    I("03 In & Out · Right", 30, "Push the ball toward your middle, then snap it back out. Same hand."),
    I("04 In & Out · Left", 30, "Sell it with your head and shoulders."),
    I("05 Low Crossover", 30, "Below the knee. Quick and low, hand to hand."),
    I("06 Between the Legs", 30, "Wide stance. Bounce it between your feet, then switch your front foot."),
    I("07 Behind the Back", 30, "Wrap it around your hip. Keep it low."),
    I("08 Double Crossover", 30, "Cross, cross again, hold. Repeat."),
    I("09 Cross–Between–Behind, fast", 60, "Same combo as Level 1, faster. Stay low.")
  ]) },
  3: { title: "Handles · Level 3: On the move", items: HANDLES_WARM.concat([
    I("01 Pound + Cross, eyes up", 30, "Two pounds, one crossover. Eyes up."),
    I("02 Zig-Zag Crossovers", 60, "Dribble on a diagonal, cross at every turn. Needs about 10 m."),
    I("03 Hesitation & Go", 60, "Dribble, slow down and rise up, then explode past. Walk back, repeat."),
    I("04 Retreat & Cross", 60, "Two dribbles forward, two back, crossover, go."),
    I("05 Spin Move", 30, "Plant your foot, pull the ball with you, keep it tight."),
    I("06 Combo into a Drive", 60, "Cross–between–behind, then 3 hard dribbles forward. Walk back.")
  ]) }
};

/* ---------------- Warm-ups (every day) ---------------- */
const WARMUP = {
  "10-11": [
    I("Jog & skip", 45, "Jog forward, then skip. Swing your arms."),
    I("Shuffle & carioca", 45, "Side shuffle one way, carioca back."),
    I("Lunge + twist", 30, "Step, drop the back knee, turn toward the front leg."),
    I("Balance: ball around waist", 30, "Stand on one leg and pass the ball around your waist.", { L: true }),
    I("Squat jump & stick", 30, "About 5 jumps. Land soft, knees over toes, freeze 2 s."),
    I("Plank shoulder taps", 30, "Hips still. Tap left, tap right."),
    I("Glute bridge", 30, "Squeeze your glutes at the top."),
    I("Build-up runs", 30, "Two 10 m runs, easy to fast.")
  ],
  "12-15": [
    I("Jog, skip & backpedal", 45, "Jog, skip, then backpedal. Stay light."),
    I("Shuffle & carioca", 45, "Side shuffle one way, carioca back."),
    I("3-D lunge", 30, "Lunge forward, sideways, back. Knee tracks over the toes."),
    I("Balance: wall toss", 30, "On one leg, toss the ball off a wall and catch it.", { L: true }),
    I("Skater hop & stick", 30, "Hop sideways, land on one leg, hold 2 s."),
    I("Plank shoulder taps", 30, "Hips still. Tap left, tap right."),
    I("Nordic hamstring", 30, "Feet hooked under a couch. Lower slowly, 3 reps."),
    I("Build-up runs", 30, "Two 15 m runs, easy to fast.")
  ]
};

const B = (title, items, extra) => Object.assign({ title, items }, extra || {});
const CH = {
  hotspot: (s) => I("CHALLENGE · Hot Spot 60", s || 60, "Makes in 60 s from the block. Count out loud!", { t: "challenge", ch: "hotspot60" }),
  mikan: () => I("CHALLENGE · Mikan Minute", 60, "Makes in 60 s. Alternate hands.", { t: "challenge", ch: "mikan60" }),
  ft10: () => I("CHALLENGE · Free Throw 10", 120, "Shoot 10. Count your makes.", { t: "challenge", ch: "ft10" }),
  atw: () => I("CHALLENGE · Around the World", 120, "2 shots at each of 5 spots. Makes out of 10.", { t: "challenge", ch: "atw10" }),
  btp: () => I("CHALLENGE · Beat the Pro", 240, "Make = 1 for you. Miss = 2 for the Pro. First to 11.", { t: "challenge", ch: "btp11" }),
  corner: () => I("CHALLENGE · Corner 60", 60, "Makes in 60 s from one corner. Own rebound.", { t: "challenge", ch: "corner60" }),
  ft20: () => I("CHALLENGE · Free Throw 20", 180, "Shoot 20. Count your makes.", { t: "challenge", ch: "ft20" }),
  spot: () => I("CHALLENGE · 5-Spot 25", 180, "5 shots from each of 5 spots. Makes out of 25.", { t: "challenge", ch: "spot25" })
};
const READY = (cue) => I("Get ready", 60, cue, { t: "rest" });
const TEST_ITEMS = {
  "10-11": [
    I("TEST · Broad jump", 90, "3 tries. Measure line to back heel. Remember your best.", { test: "broad" }),
    I("TEST · Slide test", 30, "Lines 3 m apart. Count line touches in 30 s.", { test: "slides", r: 60 }),
    I("TEST · Plank hold", 90, "Hold as long as you can (max 90 s). Note your time.", { test: "plank", r: 30 })
  ],
  "12-15": [
    I("TEST · Broad jump", 90, "3 tries. Measure line to back heel. Remember your best.", { test: "broad" }),
    I("TEST · Slide test", 30, "Lane width. Count line touches in 30 s.", { test: "slides", r: 60 }),
    I("TEST · Plank hold", 120, "Hold as long as you can (max 120 s). Note your time.", { test: "plank" })
  ]
};

/* ---------------- Ages 10–11 ---------------- */
const Y = {
  1: {
    a: {
      athletic: B("Speed & Agility", [
        I("Fast feet on a line", 20, "Tiny, quick steps over and back across a line.", { x: 3, r: 20 }),
        I("Reaction starts", 60, "Walk around. On every GO, sprint 5 m. Walk back.", { t: "reaction" }),
        I("Cone zig-zag", 30, "4 cones in a zig-zag. Sprint, plant, cut.", { x: 2, r: 30 }),
        I("Shuttle 5-10-5", 20, "3 lines, 5 m apart. Right, left, back through the middle.", { x: 3, r: 40 })
      ]),
      strength: B("Upper Body + Core", [
        I("Incline push-ups", 30, "Hands on a bench. Body straight like a plank.", { x: 2, r: 20 }),
        I("Bear crawl", 30, "Knees just off the floor. Crawl forward and back.", { x: 2, r: 20 }),
        I("Plank", 20, "Elbows under shoulders. Squeeze everything.", { x: 2, r: 15 }),
        I("Dead bug", 30, "Low back glued to the floor. Opposite arm and leg.", { x: 2, r: 20 }),
        I("Stretch", 50, STRETCH_CUE)
      ]),
      skill: B("Form & Feel", [
        I("One-hand form shots", 120, "1 m from the rim. Guide hand behind your back. Hold the follow-through."),
        I("Form shots, 3 spots", 180, "2 m out: left, middle, right. 5 makes, then move."),
        I("Bank shots", 180, "From the block, aim at the top corner of the box. Both sides."),
        READY("Grab your ball and stand on the block."), CH.hotspot()
      ], { ch: "hotspot60" })
    },
    b: {
      athletic: B("Jump & Land", [
        I("Snap-downs", 30, "Up on your toes, arms high, then snap into a quiet landing. No jump.", { r: 30 }),
        I("Pogo hops", 10, "Stiff ankles. Bounce fast on the balls of your feet.", { x: 2, r: 20 }),
        I("Squat jump & stick", 30, "About 5 jumps. Land soft, freeze 2 s.", { x: 2, r: 30 }),
        I("Line hops", 15, "Two feet, forward and back over a line.", { x: 2, r: 25 }),
        I("Broad jump & stick", 60, "4 jumps. Swing your arms, jump far, stick the landing.", { r: 40 }),
        I("Single-leg hop & stick", 30, "Small hop forward on one leg, hold 3 s. 3 hops.", { L: true })
      ]),
      strength: B("Legs", [
        I("Slow squats", 30, "3 seconds down, stand up tall.", { x: 2, r: 20 }),
        I("Reverse lunges", 30, "Alternate legs. Front knee over the toes.", { x: 2, r: 20 }),
        I("Glute bridge", 30, "Push through your heels, squeeze at the top.", { x: 2, r: 20 }),
        I("Calf raises", 30, "Up on your toes, slow down.", { r: 15 }),
        I("Stretch", 75, STRETCH_CUE)
      ]),
      skill: B("Finish Strong", [
        I("Mikan drill", 120, "Right hand, left hand, under the rim. Keep the ball high."),
        I("Right-hand layups", 120, "Take off from your left foot, right knee up."),
        I("Left-hand layups", 120, "Take off from your right foot, left knee up."),
        I("Jump-stop power finish", 120, "Dribble in, two-foot jump stop, chin the ball, go up strong."),
        READY("Stand under the rim with your ball."), CH.mikan()
      ], { ch: "mikan60" })
    },
    c: {
      athletic: B("Defense Footwork", [
        I("Defensive stance hold", 20, "Feet wide, hips down, back flat, hands active.", { x: 2, r: 20 }),
        I("Slides line to line", 20, "3–4 m. Push off, don't click your heels, stay low.", { x: 3, r: 20 }),
        I("Zig-zag slides", 30, "Slide on a diagonal, drop step, slide the other way.", { x: 2, r: 30 }),
        I("Closeout & chop", 20, "Sprint 3 steps, chop short steps, one hand high.", { x: 3, r: 20 }),
        I("Arrow slides", 40, "Slide the way the arrow points. Stay low the whole time.", { t: "arrows", dirs: ["left", "right"] })
      ]),
      strength: B("Core & Balance", [
        I("Side plank", 20, "Straight line from head to feet.", { L: true, x: 2, r: 20 }),
        I("Bird dog", 30, "Opposite arm and leg long. Slow.", { x: 2, r: 15 }),
        I("Balance: ball around waist", 30, "One leg. Keep your hips level.", { L: true }),
        I("Superman hold", 20, "Lift arms and legs, look at the floor.", { x: 2, r: 15 }),
        I("Stretch", 80, STRETCH_CUE)
      ]),
      skill: B("Footwork + Free Throws", [
        I("Jump stop & pivots", 120, "Jump stop, front pivot, reverse pivot. Ball chinned."),
        I("Triple-threat jabs", 120, "Jab, jab, shot fake. Keep your pivot foot down."),
        I("Catch, pivot, shoot", 120, "Spin the ball out, catch on a jump stop, pivot, shoot close."),
        I("Free-throw routine", 120, "Same routine every time: dribbles, breath, shoot."),
        CH.ft10()
      ], { ch: "ft10" })
    },
    d: {
      athletic: B("Speed & First Step", [
        I("Wall drive switches", 20, "Lean into a wall, drive a knee up, switch fast.", { x: 2, r: 20 }),
        I("Falling starts", 30, "Lean until you almost fall, then sprint 5 m. 2 per set.", { x: 2, r: 30 }),
        I("Arrow sprints", 60, "Sprint 3 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Crossover-step start", 30, "Turn your hips, cross over, sprint 5 m. Both sides.", { x: 2, r: 30 }),
        I("Line touch race", 20, "Touch 3 lines and come back, as fast as you can.", { x: 2, r: 30 })
      ]),
      strength: B("Full Body", [
        I("Push-ups", 30, "Knees down is fine. Chest to the floor.", { x: 2, r: 20 }),
        I("Superman W-raise", 30, "On your belly, lift your chest, squeeze your shoulder blades.", { x: 2, r: 20 }),
        I("Split squat", 30, "Back knee drops straight down.", { L: true, r: 20 }),
        I("Tuck hollow hold", 20, "Low back pressed down, knees tucked.", { x: 2, r: 15 }),
        I("Stretch", 70, STRETCH_CUE)
      ]),
      skill: B("Around the World", [
        I("5-spot shots, close", 180, "2–3 m around the rim. 3 makes at each spot."),
        I("One-dribble pull-up", 150, "One hard dribble, jump stop, shoot."),
        I("Weak-hand form shots", 150, "Close to the rim, weak hand only."),
        CH.atw()
      ], { ch: "atw10" })
    },
    e: {
      athletic: B("Jump + Test Day", [
        I("Pogo hops", 10, "Stiff ankles. Bounce fast.", { x: 2, r: 20 }),
        I("Squat jump & stick", 30, "About 5 jumps. Freeze every landing.", { x: 2, r: 30 })
      ].concat(TEST_ITEMS["10-11"]), { test: true }),
      strength: B("Recover", [
        I("Wall sit", 30, "Thighs level with the floor.", { r: 30 }),
        I("Crab walk", 30, "Hips up. Forward and back.", { x: 2, r: 20 }),
        I("Slow mountain climbers", 20, "Knee to chest, hips low.", { x: 2, r: 20 }),
        I("Stretch & breathe", 180, STRETCH_CUE)
      ]),
      skill: B("Game Day", [
        I("Warm-up shots", 120, "Close shots, both hands."),
        I("Layups, both hands", 120, "Right side right hand, left side left hand."),
        I("Your favorite spots", 120, "Game speed. Shoot like it's a real game."),
        CH.btp()
      ], { ch: "btp11" })
    }
  },
  2: {
    a: {
      athletic: B("Speed & Agility", [
        I("In-and-out fast feet", 20, "Both feet in, both feet out of a line. Fast and light.", { x: 3, r: 20 }),
        I("Reaction starts", 60, "Walk around. On every GO, sprint 5 m and stop in your stance.", { t: "reaction" }),
        I("Sprint & stop", 30, "Sprint 5 m, stop in two steps, hold your stance 2 s.", { x: 2, r: 30 }),
        I("Shuttle 5-10-5", 20, "3 lines, 5 m apart. Touch each line with your hand.", { x: 3, r: 40 })
      ]),
      strength: B("Upper Body + Core", [
        I("Push-ups", 30, "Knees down if you need to. Chest to the floor, body straight.", { x: 2, r: 20 }),
        I("Bear crawl", 30, "Forward, back, then sideways. Knees just off the floor.", { x: 2, r: 20 }),
        I("Plank", 30, "Elbows under shoulders. Squeeze everything.", { x: 2, r: 15 }),
        I("Dead bug", 30, "Slow: 3 seconds each rep. Low back glued down.", { x: 2, r: 20 }),
        I("Stretch", 30, STRETCH_CUE)
      ]),
      skill: B("Form & Range", [
        I("One-hand form shots", 60, "Close to the rim. Perfect finish, hold it."),
        I("Form shots, 5 spots", 180, "2–3 m out, 5 spots around the rim. 3 makes, then move."),
        I("1-2 step catch & shoot", 120, "Spin the ball out, step in 1-2, rise, shoot close."),
        I("Bank shots", 120, "From both blocks. Aim at the top corner of the box."),
        READY("Grab your ball and stand on the block."), CH.hotspot()
      ], { ch: "hotspot60" })
    },
    b: {
      athletic: B("Jump & Land", [
        I("Snap-down to drop squat", 30, "Snap into a deep, quiet landing.", { r: 30 }),
        I("Pogo hops", 15, "Stiff ankles. Bounce fast on the balls of your feet.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "About 5 jumps. Jump high, land soft, knees out, hold 2 s.", { x: 2, r: 30 }),
        I("Skater hop & stick", 20, "Hop sideways, land on one leg, hold 2 s.", { x: 2, r: 20 }),
        I("Broad jump & stick", 60, "5 jumps. Swing your arms, jump far, stick the landing.", { r: 40 }),
        I("Single-leg hop & stick", 30, "Hop forward and sideways on one leg. Hold 3 s each.", { L: true })
      ]),
      strength: B("Legs", [
        I("Split squat", 30, "Back knee drops straight down. Tall chest.", { L: true, r: 20 }),
        I("Reverse lunges", 30, "Alternate legs. Front knee over the toes.", { x: 2, r: 20 }),
        I("Single-leg glute bridge", 30, "Hips level, squeeze at the top.", { L: true, r: 15 }),
        I("Calf raises", 30, "Up on your toes, 3 seconds down.", { x: 2, r: 15 }),
        I("Stretch", 75, STRETCH_CUE)
      ]),
      skill: B("Finish Both Sides", [
        I("Mikan + reverse Mikan", 120, "Both hands, both sides of the rim. Keep the ball high."),
        I("Layups, both hands", 120, "Right side right hand, left side left hand. Start from the wing."),
        I("Reverse layups", 120, "Go under the rim and finish on the other side. The rim protects the ball."),
        I("Power finishes", 120, "Two-foot jump stop, chin the ball, go up strong."),
        READY("Stand under the rim with your ball."), CH.mikan()
      ], { ch: "mikan60" })
    },
    c: {
      athletic: B("Defense Footwork", [
        I("Defensive stance hold", 20, "Feet wide, hips down, back flat, hands active.", { x: 2, r: 20 }),
        I("Slides line to line", 20, "4 m. Push off, don't click your heels, stay low.", { x: 3, r: 20 }),
        I("Zig-zag + drop step", 30, "Slide on a diagonal, drop step, slide back.", { x: 2, r: 30 }),
        I("Closeout, slide, recover", 20, "Close out, slide 2 steps, sprint back.", { x: 3, r: 20 }),
        I("Arrow slides", 40, "Slide the way the arrow points. Stay low the whole time.", { t: "arrows", dirs: ["left", "right"] })
      ]),
      strength: B("Core & Balance", [
        I("Side plank", 25, "Straight line from head to feet.", { L: true, x: 2, r: 20 }),
        I("Bird dog", 30, "Opposite arm and leg long. Slow.", { x: 2, r: 15 }),
        I("Balance: wall toss", 30, "On one leg, toss the ball off a wall and catch it.", { L: true }),
        I("Superman W-raise", 20, "Lift your chest, squeeze your shoulder blades.", { x: 2, r: 15 }),
        I("Stretch", 60, STRETCH_CUE)
      ]),
      skill: B("Footwork Into Shots", [
        I("Jump stop & pivots", 90, "Jump stop, front pivot, reverse pivot. Ball chinned."),
        I("Jab & go", 120, "Jab, then drive past with a long first step. Two dribbles, layup."),
        I("Catch, pivot, shoot", 120, "Spin the ball out, catch on a jump stop, pivot, shoot close."),
        I("Free-throw routine", 150, "Same routine every time: dribbles, breath, shoot."),
        CH.ft10()
      ], { ch: "ft10" })
    },
    d: {
      athletic: B("Speed & First Step", [
        I("Wall drive switches", 20, "Lean into a wall, drive a knee up, switch fast.", { x: 2, r: 20 }),
        I("Falling starts", 30, "Lean until you almost fall, then sprint 10 m. 2 per set.", { x: 2, r: 30 }),
        I("Arrow sprints", 60, "Sprint 3 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Crossover-step start", 30, "Turn your hips, cross over, sprint 5 m. Both sides.", { x: 2, r: 30 }),
        I("Build-up runs", 20, "Build up for 10 m, full speed for the last 5 m.", { x: 2, r: 30 })
      ]),
      strength: B("Full Body", [
        I("Table rows", 30, "Under a sturdy table or low bar. Pull your chest up.", { x: 2, r: 20 }),
        I("Push-ups", 30, "Chest to the floor. Body straight like a plank.", { x: 2, r: 20 }),
        I("Reverse lunges", 30, "Alternate legs. Stay tall.", { x: 2, r: 20 }),
        I("Hollow hold", 20, "Low back pressed down, arms by your ears.", { x: 2, r: 15 }),
        I("Stretch", 50, STRETCH_CUE)
      ]),
      skill: B("Spots & Pull-ups", [
        I("5-spot shots, mid", 150, "3–4 m out, 5 spots. Game speed, same shot every time."),
        I("One-dribble pull-up", 150, "One hard dribble, jump stop, shoot. Go both ways."),
        I("Weak-hand form shots", 90, "Close to the rim, weak hand only."),
        I("Shot fake, side-step", 90, "Shot fake, one side-step, shoot."),
        CH.atw()
      ], { ch: "atw10" })
    },
    e: {
      athletic: B("Jump + Test Day", [
        I("Pogo hops", 15, "Stiff ankles. Bounce fast.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "About 5 jumps. Freeze every landing.", { x: 2, r: 30 })
      ].concat(TEST_ITEMS["10-11"]), { test: true }),
      strength: B("Recover", [
        I("Wall sit", 40, "Thighs level with the floor.", { r: 20 }),
        I("Crab walk", 30, "Hips up. Forward and back.", { x: 2, r: 20 }),
        I("Mountain climbers", 20, "Knee to chest, hips low.", { x: 2, r: 20 }),
        I("Stretch & breathe", 180, STRETCH_CUE)
      ]),
      skill: B("Game Day", [
        I("Warm-up shots", 90, "Close shots, both hands."),
        I("Layups, both hands", 90, "Game speed, both sides."),
        I("Jab & go", 90, "Jab, drive, finish. Both directions."),
        I("Your favorite spots", 90, "Game speed. Shoot like it's a real game."),
        CH.btp()
      ], { ch: "btp11" })
    }
  },
  3: {
    a: {
      athletic: B("Reactive Agility", [
        I("In-and-out fast feet", 20, "Both feet in, both out. As fast as you can.", { x: 2, r: 20 }),
        I("Arrow sprints", 60, "Sprint 3 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Reaction starts", 60, "On every GO, sprint 5 m and stop in your stance.", { t: "reaction" }),
        I("Cone zig-zag", 30, "4 cones. Plant on the outside foot, cut hard.", { x: 2, r: 30 }),
        I("Pro agility 5-10-5", 20, "Full speed. Touch each line with your hand.", { x: 3, r: 40 })
      ]),
      strength: B("Upper Body + Core", [
        I("Tempo push-ups", 30, "3 seconds down, 1 second up.", { x: 2, r: 20 }),
        I("Bear crawl", 30, "Forward, back and sideways. Keep your back flat.", { x: 2, r: 20 }),
        I("Plank reach-outs", 30, "Reach one arm forward without moving your hips.", { x: 2, r: 15 }),
        I("Tuck hollow hold", 20, "Low back pressed down, knees tucked.", { x: 2, r: 15 }),
        I("Stretch", 60, STRETCH_CUE)
      ]),
      skill: B("Shoot on the Move", [
        I("One-hand form shots", 60, "Close to the rim. Perfect finish, hold it."),
        I("1-2 step catch & shoot", 120, "Spin it out, 1-2 step, rise. 3 spots, 3 makes each."),
        I("One-dribble pull-up", 150, "One hard dribble, stop, shoot. Both directions."),
        I("Crossover pull-up", 150, "Crossover, one dribble, stop, shoot. Stay balanced."),
        READY("Grab your ball and stand on the block."), CH.hotspot()
      ], { ch: "hotspot60" })
    },
    b: {
      athletic: B("Jump & Land", [
        I("Snap-downs", 30, "Up on your toes, arms high, then snap into a quiet landing."),
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "5 max jumps. Land soft, knees out.", { x: 2, r: 30 }),
        I("Skater bounds & stick", 30, "Bound sideways, land on one leg, hold 2 s.", { x: 2, r: 30 }),
        I("Double broad jump", 60, "Two jumps in a row. Stick the second landing. 4 times.", { r: 30 }),
        I("Single-leg hop & stick", 30, "Forward, sideways and diagonal. Hold 3 s.", { L: true })
      ]),
      strength: B("Legs", [
        I("Split squat", 30, "Back knee drops straight down. Slow.", { L: true, x: 2, r: 20 }),
        I("Single-leg RDL", 30, "Hinge at the hips, reach down, back flat.", { L: true, r: 20 }),
        I("Single-leg glute bridge", 30, "Hips level, squeeze at the top.", { L: true, r: 15 }),
        I("Single-leg calf raise", 30, "Full range, slow down.", { L: true }),
        I("Stretch", 45, STRETCH_CUE)
      ]),
      skill: B("Finish Like a Game", [
        I("Mikan + reverse Mikan", 90, "Both hands, both sides. Fast feet."),
        I("Crossover into layup", 150, "Cross over at the cone, attack, finish. Both sides."),
        I("Euro step layups", 120, "Big step one way, long step the other, finish high."),
        I("Weak-hand layups", 120, "Weak hand only, both sides."),
        READY("Stand under the rim with your ball."), CH.mikan()
      ], { ch: "mikan60" })
    },
    c: {
      athletic: B("Defense Footwork", [
        I("Defensive stance hold", 20, "Feet wide, hips down, hands active.", { x: 2, r: 20 }),
        I("Arrow slides", 60, "Slide the way the arrow points. Stay low.", { t: "arrows", dirs: ["left", "right"] }),
        I("Closeout, slide, recover", 20, "Close out, slide 2 steps, sprint back.", { x: 3, r: 20 }),
        I("Zig-zag + drop step", 30, "Slide on a diagonal, drop step, slide back.", { x: 2, r: 30 }),
        I("Slides line to line", 20, "4 m. Race the clock, stay low.", { x: 2, r: 20 })
      ]),
      strength: B("Core & Balance", [
        I("Side plank", 30, "Straight line, hips high.", { L: true, x: 2, r: 20 }),
        I("Bird dog", 30, "Slow and long. Don't rotate.", { x: 2, r: 15 }),
        I("Eyes-closed balance", 30, "One leg, eyes closed. Stay tall.", { L: true }),
        I("Hollow hold", 20, "Low back pressed down, arms by your ears.", { x: 2, r: 15 }),
        I("Stretch", 40, STRETCH_CUE)
      ]),
      skill: B("Read & React", [
        I("Triple-threat jabs", 90, "Jab, jab, shot fake. Keep your pivot foot down."),
        I("Pass-fake pull-up", 120, "Pass fake, one dribble, pull up close."),
        I("Rebound & outlet", 120, "Toss off the backboard, grab it high, chin it, pivot, outlet."),
        I("Free throws after sprints", 150, "Sprint to half court and back, then 2 free throws. Repeat."),
        CH.ft10()
      ], { ch: "ft10" })
    },
    d: {
      athletic: B("Speed & First Step", [
        I("Arrow sprints", 60, "Sprint 3 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Falling starts", 30, "Lean until you almost fall, sprint 10 m. 2 per set.", { x: 2, r: 30 }),
        I("Crossover-step start", 30, "Turn your hips, cross over, sprint 10 m. Both sides.", { x: 2, r: 30 }),
        I("Reaction starts", 60, "On every GO, sprint 5 m. Walk back.", { t: "reaction" }),
        I("Line touch race", 20, "Touch 3 lines and come back, as fast as you can.", { x: 2, r: 30 })
      ]),
      strength: B("Full Body", [
        I("Table rows", 30, "Pull your chest to the table. Slow down.", { x: 2, r: 20 }),
        I("Tempo push-ups", 30, "3 seconds down, 1 second up.", { x: 2, r: 20 }),
        I("Split squat", 30, "Back knee drops straight down.", { L: true, r: 20 }),
        I("Hollow hold", 20, "Low back pressed down.", { x: 2, r: 15 }),
        I("Stretch", 70, STRETCH_CUE)
      ]),
      skill: B("Shot Creation", [
        I("5-spot catch & shoot", 150, "Corners, wings, top. Mid-range, game speed."),
        I("Shot fake, side-step", 150, "Shot fake, one side-step, shoot. Both directions."),
        I("One-dribble pull-up", 180, "Attack a spot, one dribble, stop, shoot. Both ways."),
        CH.atw()
      ], { ch: "atw10" })
    },
    e: {
      athletic: B("Jump + Test Day", [
        I("Pogo hops", 15, "Stiff ankles. Bounce fast.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "About 5 jumps. Freeze every landing.", { x: 2, r: 30 })
      ].concat(TEST_ITEMS["10-11"]), { test: true }),
      strength: B("Recover", [
        I("Wall sit", 40, "Thighs level with the floor.", { r: 20 }),
        I("Crab walk", 30, "Hips up. Forward and back.", { x: 2, r: 20 }),
        I("Mountain climbers", 20, "Knee to chest, hips low.", { x: 2, r: 20 }),
        I("Stretch & breathe", 180, STRETCH_CUE)
      ]),
      skill: B("Game Day", [
        I("Warm-up shots", 90, "Close shots, both hands."),
        I("Crossover into layup", 90, "Game speed, both sides."),
        I("Crossover pull-up", 90, "Cross, stop, shoot."),
        I("Your favorite spots", 90, "Game speed. Shoot like it's a real game."),
        CH.btp()
      ], { ch: "btp11" })
    }
  }
};

/* ---------------- Ages 12–15 ---------------- */
const T = {
  1: {
    a: {
      athletic: B("Speed & Agility", [
        I("In-and-out fast feet", 20, "Both feet in, both out of a line. Fast and light.", { x: 3, r: 20 }),
        I("Reaction starts", 60, "Walk around. On every GO, sprint 10 m. Walk back.", { t: "reaction" }),
        I("Sprint & stop", 30, "Sprint 10 m, stop in two steps, hold your stance 2 s.", { x: 2, r: 30 }),
        I("Pro agility 5-10-5", 20, "Full speed. Touch each line with your hand.", { x: 3, r: 40 })
      ]),
      strength: B("Upper Body + Core", [
        I("Tempo push-ups", 40, "3 seconds down, 1 second up.", { x: 2, r: 20 }),
        I("Pike push-ups", 30, "Hips high, lower your head toward the floor.", { x: 2, r: 20 }),
        I("Plank", 45, "Squeeze glutes and abs. No sagging.", { r: 15 }),
        I("Plank shoulder taps", 30, "Hips still.", { r: 15 }),
        I("Dead bug", 40, "Low back glued down. Slow.", { r: 20 }),
        I("Stretch", 35, STRETCH_CUE)
      ]),
      skill: B("Catch & Shoot", [
        I("One-hand form shots", 90, "Close to the rim. Perfect finish, hold it."),
        I("1-2 step catch & shoot", 150, "Spin the ball out, step in, rise, shoot. Elbows and wings."),
        I("Corner shots", 150, "Both corners. Three if your form holds, long two if not."),
        I("Elbow jumpers", 90, "Both elbows. Same shot every time."),
        READY("Go to your corner with the ball."), CH.corner()
      ], { ch: "corner60" })
    },
    b: {
      athletic: B("Jump & Land", [
        I("Snap-down to drop squat", 30, "Snap into a deep, quiet landing.", { r: 10 }),
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "5 max jumps. Land soft, knees out, hold 2 s.", { x: 2, r: 30 }),
        I("Skater bounds & stick", 30, "Bound sideways, land on one leg, hold 2 s. About 8.", { x: 2, r: 30 }),
        I("Broad jump & stick", 60, "5 max jumps. Reset between each.", { r: 20 }),
        I("Single-leg hop & stick", 30, "Forward and sideways, 3 each. Hold 3 s.", { L: true })
      ]),
      strength: B("Legs", [
        I("Split squat", 40, "Rear foot on a bench when it gets easy.", { L: true, x: 2, r: 20 }),
        I("Single-leg RDL", 30, "Hinge at the hips, reach down, back flat.", { L: true, r: 20 }),
        I("Single-leg calf raise", 30, "Full range, slow down.", { L: true }),
        I("Stretch", 80, STRETCH_CUE)
      ]),
      skill: B("Finish Through Contact", [
        I("Mikan + reverse Mikan", 120, "Both hands, both sides of the rim."),
        I("Euro step layups", 120, "Big step one way, long step the other, finish high."),
        I("Power finishes", 120, "Two-foot gather, chin the ball, finish through contact."),
        I("Weak-hand layups", 120, "Weak hand only, both sides."),
        READY("Stand under the rim with your ball."), CH.mikan()
      ], { ch: "mikan60" })
    },
    c: {
      athletic: B("Defense Footwork", [
        I("Defensive stance hold", 30, "Feet wide, hips down, back flat, hands active.", { x: 2, r: 15 }),
        I("Lane slides", 25, "Lane width (4.9 m). Touch the line each side.", { x: 3, r: 20 }),
        I("Zig-zag + drop step", 30, "Slide on a diagonal, drop step, slide back.", { x: 2, r: 25 }),
        I("Closeout, slide, recover", 20, "Close out, slide 2 steps, sprint back to help.", { x: 3, r: 15 }),
        I("Arrow slides", 40, "Slide the way the arrow points. Stay low.", { t: "arrows", dirs: ["left", "right"] })
      ]),
      strength: B("Core & Balance", [
        I("Side plank", 30, "Straight line, hips high.", { L: true, x: 2, r: 20 }),
        I("Bird dog", 40, "Slow and long. Don't rotate.", { r: 20 }),
        I("Hollow hold", 30, "Low back pressed down, arms by ears.", { x: 2, r: 15 }),
        I("Eyes-closed balance", 30, "One leg, eyes closed. Stay tall.", { L: true }),
        I("Stretch", 50, STRETCH_CUE)
      ]),
      skill: B("Shoot Tired + Free Throws", [
        I("Pass-fake pull-up", 120, "Pass fake, one dribble, pull up from 4 m."),
        I("Rebound & outlet", 120, "Toss off the backboard, grab it high, chin it, pivot, outlet."),
        I("Sprint-back jumpers", 120, "Sprint to half court and back, catch and shoot."),
        I("Free-throw routine", 60, "Same routine every time."),
        CH.ft20()
      ], { ch: "ft20" })
    },
    d: {
      athletic: B("Speed & First Step", [
        I("Wall drive switches", 20, "Lean into a wall, drive a knee up, switch fast.", { x: 2, r: 20 }),
        I("Falling starts", 30, "Lean until you almost fall, sprint 10 m. 2 per set.", { x: 2, r: 30 }),
        I("Arrow sprints", 60, "Sprint 5 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Crossover-step start", 30, "Turn your hips, cross over, sprint 10 m. Both sides.", { x: 2, r: 30 }),
        I("Build-up runs", 20, "Build up for 10 m, full speed for the last 10 m.", { x: 2, r: 30 })
      ]),
      strength: B("Pull + Push + Legs", [
        I("Table rows", 40, "Under a sturdy table or low bar. Pull your chest up.", { x: 2, r: 20 }),
        I("Feet-up push-ups", 40, "Feet on a step. Body straight.", { x: 2, r: 20 }),
        I("Reverse lunges", 40, "Alternate legs. Stay tall.", { r: 20 }),
        I("Plank reach-outs", 30, "Reach one arm forward without moving your hips.", { r: 15 }),
        I("Stretch", 75, STRETCH_CUE)
      ]),
      skill: B("Spot-Up Tour", [
        I("5-spot catch & shoot", 150, "Corners, wings, top. Mid-range, game speed."),
        I("5-spot threes", 150, "Only while your form holds. Otherwise step inside the line."),
        I("Shot fake, side-step", 120, "Shot fake, one side-step, shoot."),
        CH.spot()
      ], { ch: "spot25" })
    },
    e: {
      athletic: B("Jump + Test Day", [
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "5 max jumps. Freeze every landing.", { x: 2, r: 30 })
      ].concat(TEST_ITEMS["12-15"]), { test: true }),
      strength: B("Recover", [
        I("Wall sit", 45, "Thighs level with the floor.", { r: 15 }),
        I("Single-leg glute bridge", 30, "Hips level, squeeze at the top.", { L: true, r: 15 }),
        I("Mountain climbers", 30, "Fast knees, hips low.", { x: 2, r: 20 }),
        I("Stretch & breathe", 185, STRETCH_CUE)
      ]),
      skill: B("Game Day", [
        I("Warm-up shots", 120, "Close shots, both hands."),
        I("Layups, both hands", 120, "Game speed, both sides."),
        I("Spot-ups", 120, "Your best spots, game speed."),
        CH.btp()
      ], { ch: "btp11" })
    }
  },
  2: {
    a: {
      athletic: B("Speed & Agility", [
        I("In-and-out fast feet", 20, "Both feet in, both out of a line. Fast and light.", { x: 3, r: 20 }),
        I("Reaction starts", 60, "On every GO, sprint 10 m and stop in two steps.", { t: "reaction" }),
        I("Cone zig-zag", 30, "4 cones. Plant on the outside foot, cut hard.", { x: 2, r: 30 }),
        I("Pro agility 5-10-5", 20, "Full speed. Touch each line with your hand.", { x: 3, r: 40 })
      ]),
      strength: B("Upper Body + Core", [
        I("Feet-up push-ups", 40, "Feet on a step. Body straight.", { x: 2, r: 20 }),
        I("Pike push-ups", 30, "Hips high, lower your head toward the floor.", { x: 2, r: 20 }),
        I("Plank reach-outs", 45, "Reach one arm forward without moving your hips.", { r: 15 }),
        I("Hollow hold", 30, "Low back pressed down, arms by your ears.", { r: 15 }),
        I("Dead bug", 40, "Low back glued down. Slow.", { r: 20 }),
        I("Stretch", 35, STRETCH_CUE)
      ]),
      skill: B("Shoot Off the Move", [
        I("One-hand form shots", 60, "Close to the rim. Perfect finish, hold it."),
        I("1-2 step catch & shoot", 120, "Spin the ball out, step in, rise, shoot. Elbows and wings."),
        I("Relocate corner shots", 150, "Shoot from the corner, sprint to the wing, shoot again. Both sides."),
        I("Off-dribble elbow jumpers", 150, "One hard dribble into the elbow, stop, shoot. Both elbows."),
        READY("Go to your corner with the ball."), CH.corner()
      ], { ch: "corner60" })
    },
    b: {
      athletic: B("Jump & Land", [
        I("Snap-down to drop squat", 30, "Snap into a deep, quiet landing.", { r: 10 }),
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "5 max jumps. Land soft, knees out, hold 2 s.", { x: 2, r: 30 }),
        I("Skater bounds & stick", 30, "Bound far sideways, land on one leg, hold 2 s.", { x: 2, r: 30 }),
        I("Double broad jump", 60, "Two jumps in a row. Stick the second. 4 times.", { r: 20 }),
        I("Single-leg hop & stick", 30, "Forward, sideways and diagonal. Hold 3 s.", { L: true })
      ]),
      strength: B("Legs", [
        I("Rear-foot elevated split squat", 40, "Back foot on a bench. Slow down, drive up.", { L: true, x: 2, r: 20 }),
        I("Single-leg RDL", 30, "Hinge at the hips, reach down, back flat.", { L: true, r: 20 }),
        I("Single-leg calf raise", 30, "Full range, slow down.", { L: true }),
        I("Stretch", 80, STRETCH_CUE)
      ]),
      skill: B("Finish Every Way", [
        I("Mikan + reverse Mikan", 90, "Both hands, both sides of the rim."),
        I("Reverse layups", 120, "Go under the rim, finish on the other side. The rim protects the ball."),
        I("Floaters", 150, "Stop short, take off from one foot, soft high release."),
        I("Euro step layups", 120, "Big step one way, long step the other, finish high."),
        READY("Stand under the rim with your ball."), CH.mikan()
      ], { ch: "mikan60" })
    },
    c: {
      athletic: B("Defense Footwork", [
        I("Defensive stance hold", 30, "Feet wide, hips down, back flat, hands active.", { r: 15 }),
        I("Lane slides", 25, "Lane width (4.9 m). Touch the line each side.", { x: 3, r: 20 }),
        I("Zig-zag + drop step", 30, "Slide on a diagonal, drop step, slide back.", { x: 2, r: 25 }),
        I("Closeout, slide, recover", 20, "Close out, slide 2 steps, sprint back to help.", { x: 3, r: 15 }),
        I("Arrow slides", 60, "Slide the way the arrow points. Stay low.", { t: "arrows", dirs: ["left", "right"] })
      ]),
      strength: B("Core & Balance", [
        I("Side plank", 35, "Straight line, hips high.", { L: true, x: 2, r: 20 }),
        I("Bird dog", 40, "Slow and long. Don't rotate.", { r: 20 }),
        I("Hollow hold", 30, "Low back pressed down, arms by ears.", { x: 2, r: 15 }),
        I("Eyes-closed balance", 30, "One leg, eyes closed. Stay tall.", { L: true }),
        I("Stretch", 30, STRETCH_CUE)
      ]),
      skill: B("Shoot Tired", [
        I("Pass-fake pull-up", 90, "Pass fake, one dribble, pull up from 4 m."),
        I("Sprint-back jumpers", 120, "Sprint to half court and back, catch and shoot."),
        I("Crossover pull-up", 90, "Crossover, one dribble, stop, shoot. Both ways."),
        I("Rebound & outlet", 60, "Grab it high, chin it, pivot, outlet."),
        I("Free-throw routine", 60, "Same routine every time."),
        CH.ft20()
      ], { ch: "ft20" })
    },
    d: {
      athletic: B("Speed & First Step", [
        I("Wall drive switches", 20, "Lean into a wall, drive a knee up, switch fast.", { x: 2, r: 20 }),
        I("Falling starts", 30, "Lean until you almost fall, sprint 10 m. 2 per set.", { x: 2, r: 30 }),
        I("Arrow sprints", 60, "Sprint 5 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Crossover-step start", 30, "Turn your hips, cross over, sprint 10 m. Both sides.", { x: 2, r: 30 }),
        I("Sprint & stop", 20, "Sprint 10 m, stop in two steps, hold your stance.", { x: 2, r: 30 })
      ]),
      strength: B("Pull + Push + Legs", [
        I("Table rows", 40, "Feet further out makes it harder. Pull your chest up.", { x: 2, r: 20 }),
        I("Feet-up push-ups", 40, "Feet on a step. Body straight.", { x: 2, r: 20 }),
        I("Split squat", 40, "Back knee drops straight down.", { L: true, r: 20 }),
        I("Stretch", 80, STRETCH_CUE)
      ]),
      skill: B("Spot-Up + One Dribble", [
        I("5-spot catch & shoot", 120, "Corners, wings, top. Mid-range, game speed."),
        I("Shot fake, one-dribble pull-up", 150, "Shot fake, one hard dribble, pull up. Both ways."),
        I("5-spot threes", 150, "Only while your form holds. Otherwise step inside the line."),
        CH.spot()
      ], { ch: "spot25" })
    },
    e: {
      athletic: B("Jump + Test Day", [
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Skater bounds & stick", 30, "Bound sideways, land on one leg, hold 2 s.", { x: 2, r: 30 })
      ].concat(TEST_ITEMS["12-15"]), { test: true }),
      strength: B("Recover", [
        I("Wall sit", 60, "Thighs level with the floor.", { r: 15 }),
        I("Single-leg glute bridge", 30, "Hips level, squeeze at the top.", { L: true, r: 15 }),
        I("Mountain climbers", 30, "Fast knees, hips low.", { x: 2, r: 20 }),
        I("Stretch & breathe", 170, STRETCH_CUE)
      ]),
      skill: B("Game Day", [
        I("Warm-up shots", 90, "Close shots, both hands."),
        I("Crossover pull-up", 90, "Game speed, both ways."),
        I("Floaters", 90, "Soft and high, off one foot."),
        I("Spot-ups", 90, "Your best spots, game speed."),
        CH.btp()
      ], { ch: "btp11" })
    }
  },
  3: {
    a: {
      athletic: B("Reactive Speed", [
        I("In-and-out fast feet", 20, "As fast as you can, eyes up.", { x: 2, r: 20 }),
        I("Arrow sprints", 60, "Sprint 5 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Reaction starts", 60, "On every GO, sprint 10 m and stop in two steps.", { t: "reaction" }),
        I("Sprint & stop", 30, "Sprint 10 m, stop in two steps, hold 2 s.", { x: 2, r: 30 }),
        I("Pro agility 5-10-5", 20, "Full speed. Touch each line with your hand.", { x: 3, r: 40 })
      ]),
      strength: B("Upper Body + Core", [
        I("Explosive push-ups", 30, "Push fast so your hands leave the floor. Land soft. Quality over reps.", { x: 2, r: 20 }),
        I("Pike push-ups", 30, "Hips high, head toward the floor.", { x: 2, r: 20 }),
        I("Plank reach-outs", 30, "Reach one arm forward without moving your hips.", { x: 2, r: 15 }),
        I("Hollow hold", 30, "Low back pressed down, arms by your ears.", { x: 2, r: 15 }),
        I("Stretch", 40, STRETCH_CUE)
      ]),
      skill: B("Create Your Shot", [
        I("One-hand form shots", 60, "Close to the rim. Perfect finish."),
        I("Crossover pull-up", 150, "Crossover, one dribble, stop, shoot. Both ways."),
        I("Step-back jumper", 150, "Attack, plant, push back, shoot on balance. Both ways."),
        I("Corner threes", 120, "Both corners. Only while your form holds."),
        READY("Go to your corner with the ball."), CH.corner()
      ], { ch: "corner60" })
    },
    b: {
      athletic: B("Jump & Land", [
        I("Depth drop & stick", 30, "Step off a low step (about 30 cm). Land quiet, hold 2 s.", { r: 20 }),
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 25, "5 max jumps. Land soft, knees out.", { x: 2, r: 30 }),
        I("Skater bounds & stick", 30, "Bound far sideways, land on one leg, hold 2 s.", { x: 2, r: 30 }),
        I("Double broad jump", 60, "Two jumps in a row. Stick the second. 4 times.", { r: 20 }),
        I("Single-leg hop & stick", 30, "3 hops in a row, stick the last one.", { L: true })
      ]),
      strength: B("Legs", [
        I("Rear-foot elevated split squat", 40, "Back foot on a bench. 3 seconds down.", { L: true, x: 2, r: 20 }),
        I("Single-leg RDL", 40, "Hinge at the hips, reach down, back flat.", { L: true, r: 20 }),
        I("Single-leg calf raise", 30, "Full range, slow down.", { L: true }),
        I("Stretch", 60, STRETCH_CUE)
      ]),
      skill: B("Finish Through Traffic", [
        I("Mikan + reverse Mikan", 60, "Both hands, both sides. Fast."),
        I("Euro step layups", 120, "Big step one way, long step the other, finish high."),
        I("Floaters", 120, "Stop short, take off from one foot, soft high release."),
        I("Crossover into layup", 120, "Cross over at the cone, attack, finish. Both sides."),
        I("Power finishes", 60, "Two-foot gather, chin the ball, finish through contact."),
        READY("Stand under the rim with your ball."), CH.mikan()
      ], { ch: "mikan60" })
    },
    c: {
      athletic: B("Defense Footwork", [
        I("Arrow slides", 60, "Slide the way the arrow points. Stay low.", { t: "arrows", dirs: ["left", "right"] }),
        I("Lane slides", 25, "Lane width. Touch the line each side.", { x: 3, r: 20 }),
        I("Closeout, slide, recover", 20, "Close out, slide 2 steps, sprint back to help.", { x: 3, r: 15 }),
        I("Zig-zag + drop step", 30, "Slide on a diagonal, drop step, slide back.", { x: 2, r: 25 }),
        I("Reaction starts", 60, "On every GO, drop step and sprint 5 m.", { t: "reaction" })
      ]),
      strength: B("Core & Balance", [
        I("Side plank", 35, "Straight line, hips high. Lift your top leg if it's easy.", { L: true, x: 2, r: 20 }),
        I("Plank reach-outs", 40, "Reach without moving your hips.", { r: 20 }),
        I("Hollow hold", 30, "Low back pressed down.", { x: 2, r: 15 }),
        I("Eyes-closed balance", 30, "One leg, eyes closed. Stay tall.", { L: true }),
        I("Stretch", 30, STRETCH_CUE)
      ]),
      skill: B("Clutch Shooting", [
        I("Sprint-back jumpers", 120, "Sprint to half court and back, catch and shoot."),
        I("Step-back jumper", 120, "Attack, plant, push back, shoot on balance."),
        I("Free throws after sprints", 120, "Sprint to half court and back, then 2 free throws. Repeat."),
        I("Rebound & outlet", 60, "Grab it high, chin it, pivot, outlet."),
        CH.ft20()
      ], { ch: "ft20" })
    },
    d: {
      athletic: B("Speed & First Step", [
        I("Arrow sprints", 60, "Sprint 5 m the way the arrow points, back to the middle.", { t: "arrows", dirs: ["left", "right", "up"] }),
        I("Reaction starts", 60, "On every GO, sprint 10 m.", { t: "reaction" }),
        I("Falling starts", 30, "Lean until you almost fall, sprint 10 m. 2 per set.", { x: 2, r: 30 }),
        I("Crossover-step start", 30, "Turn your hips, cross over, sprint 10 m. Both sides.", { x: 2, r: 30 }),
        I("Build-up runs", 20, "Build up for 10 m, full speed for the last 10 m.", { x: 2, r: 30 })
      ]),
      strength: B("Pull + Push + Legs", [
        I("Table rows", 40, "Feet out far. 2 seconds down.", { x: 2, r: 20 }),
        I("Explosive push-ups", 30, "Hands leave the floor. Land soft.", { x: 2, r: 20 }),
        I("Reverse lunges", 40, "Alternate legs. Stay tall.", { x: 2, r: 20 }),
        I("Plank reach-outs", 30, "Reach without moving your hips.", { r: 15 }),
        I("Stretch", 35, STRETCH_CUE)
      ]),
      skill: B("Relocate & Create", [
        I("Relocation threes", 150, "Shoot, sprint to the next spot, catch, shoot. Only with good form."),
        I("Step-back jumper", 120, "Attack, plant, push back, shoot on balance."),
        I("Shot fake, side-step", 150, "Shot fake, side-step, shoot. Both directions."),
        CH.spot()
      ], { ch: "spot25" })
    },
    e: {
      athletic: B("Jump + Test Day", [
        I("Pogo hops", 15, "Stiff ankles, fast off the floor.", { x: 2, r: 15 }),
        I("Countermovement jump & stick", 30, "5 max jumps. Freeze every landing.", { x: 2, r: 30 })
      ].concat(TEST_ITEMS["12-15"]), { test: true }),
      strength: B("Recover", [
        I("Wall sit", 60, "Thighs level with the floor.", { r: 15 }),
        I("Single-leg glute bridge", 30, "Hips level, squeeze at the top.", { L: true, r: 15 }),
        I("Mountain climbers", 30, "Fast knees, hips low.", { x: 2, r: 20 }),
        I("Stretch & breathe", 170, STRETCH_CUE)
      ]),
      skill: B("Game Day", [
        I("Warm-up shots", 60, "Close shots, both hands."),
        I("Step-back jumper", 90, "Game speed, both ways."),
        I("Crossover into layup", 90, "Game speed, both sides."),
        I("Spot-ups", 120, "Your best spots, game speed."),
        CH.btp()
      ], { ch: "btp11" })
    }
  }
};

/* ---------------- Finals: day 66 taper, day 67 graduation ---------------- */
const TAPER_ATHLETIC = B("Light & Fast", [
  I("Fast feet on a line", 15, "Quick and light. Stay fresh.", { x: 2, r: 20 }),
  I("Snap-downs", 30, "Quiet landings. Nothing hard today.", { r: 20 }),
  I("Build-up runs", 20, "Easy to fast. Three runs.", { x: 3, r: 30 })
]);
const TAPER_STRENGTH = B("Mobility", [
  I("Glute bridge", 30, "Squeeze at the top.", { r: 15 }),
  I("Bird dog", 30, "Slow and long.", { r: 15 }),
  I("Stretch & breathe", 150, STRETCH_CUE)
]);
const TRACKS = {
  "10-11": {
    warmup: WARMUP["10-11"], days: Y,
    taper: { title: "Taper Day", athletic: TAPER_ATHLETIC, strength: TAPER_STRENGTH, skill: B("Review Your Best Moves", [
      I("Warm-up shots", 120, "Close shots, both hands."),
      I("Layups, both hands", 120, "Easy rhythm, both sides."),
      I("Your favorite spots", 120, "Only good-looking shots today."),
      I("Free-throw routine", 120, "Same routine every time."),
      CH.ft10()
    ], { ch: "ft10" }) },
    final: { title: "Graduation Day", athletic: B("Final Tests", Y[3].e.athletic.items, { test: true }), strength: Y[3].e.strength, skill: B("Graduation Game", Y[3].e.skill.items, { ch: "btp11" }) }
  },
  "12-15": {
    warmup: WARMUP["12-15"], days: T,
    taper: { title: "Taper Day", athletic: TAPER_ATHLETIC, strength: TAPER_STRENGTH, skill: B("Review Your Best Moves", [
      I("Warm-up shots", 120, "Close shots, both hands."),
      I("Layups, both hands", 90, "Easy rhythm, both sides."),
      I("Spot-ups", 120, "Only good-looking shots today."),
      I("Free-throw routine", 90, "Same routine every time."),
      CH.ft20()
    ], { ch: "ft20" }) },
    final: { title: "Graduation Day", athletic: B("Final Tests", T[3].e.athletic.items, { test: true }), strength: T[3].e.strength, skill: B("Graduation Game", T[3].e.skill.items, { ch: "btp11" }) }
  }
};

// Everything the app needs to show and run session number n for an age group.
export function sessionFor(group, n) {
  const G = TRACKS[group] || TRACKS["10-11"];
  const day = Math.max(1, Math.floor(n) || 1);
  const phase = phaseOf(day);
  const hp = Math.min(3, phase.id);
  let d, kind = "regular";
  if (day === PROGRAM_DAYS - 1) { d = G.taper; kind = "taper"; }
  else if (day === PROGRAM_DAYS) { d = G.final; kind = "final"; }
  else d = G.days[hp][cycleOf(day)];
  return {
    n: day, group, phase, cycle: cycleOf(day), kind, bonus: day > PROGRAM_DAYS,
    title: d.title || d.athletic.title,
    warmup: G.warmup, handles: HANDLES[hp], athletic: d.athletic, strength: d.strength, skill: d.skill,
    ch: d.skill.ch, test: !!d.athletic.test
  };
}

/* ---------------- Weekly bonus: extra strength & flexibility, any day ---------------- */
// Each exercise counts once per Monday–Sunday week for BONUS_XP. Do them on rest days or after a session.
// Keep BONUS_IDS in sync with the list in firestore.rules (bonusIds()).
export const BONUS_XP = 10;
const BI = (id, kind, n, s, c, o) => Object.assign(I(n, s, c, o), { id, kind });
export const BONUS = {
  "10-11": [
    BI("pushups", "Strength", "Push-ups", 40, "8 push-ups each set. Knees down is fine. Chest to the floor.", { x: 3, r: 30 }),
    BI("situps", "Strength", "Sit-ups", 40, "12 each set. Knees bent, feet flat, arms crossed. Curl up, lower slowly.", { x: 3, r: 30 }),
    BI("plank", "Strength", "Plank", 30, "Elbows under shoulders, body straight. Hold.", { x: 3, r: 20 }),
    BI("bridge", "Strength", "Glute bridge", 40, "12 each set. Push through your heels, squeeze 2 s at the top.", { x: 3, r: 20 }),
    BI("kayang", "Flexibility", "Kayang (bridge)", 10, "On a mat. Hands by your ears, push up into an arch and hold. Come down slowly. Can't push up yet? Do a glute bridge hold. Stop if your back hurts.", { x: 3, r: 20 }),
    BI("fold", "Flexibility", "Cium lutut (forward fold)", 30, "Sit with straight legs. Reach for your toes and bring your nose toward your knees. Breathe, never bounce.", { x: 2, r: 15 }),
    BI("butterfly", "Flexibility", "Butterfly stretch", 30, "Soles together, sit tall, let your knees drop gently.", { x: 2, r: 15 }),
    BI("hip", "Flexibility", "Lunge hip stretch", 30, "Back knee down, push your hips forward. Feel the front of the back hip.", { L: true })
  ],
  "12-15": [
    BI("pushups", "Strength", "Push-ups", 45, "12 push-ups each set. Body straight, chest to the floor.", { x: 3, r: 30 }),
    BI("situps", "Strength", "Sit-ups", 45, "15 each set. Knees bent, feet flat, arms crossed. Curl up, lower slowly.", { x: 3, r: 30 }),
    BI("plank", "Strength", "Plank", 45, "Elbows under shoulders, body straight. Hold.", { x: 3, r: 20 }),
    BI("bridge", "Strength", "Glute bridge", 45, "15 each set. Push through your heels, squeeze 2 s at the top.", { x: 3, r: 20 }),
    BI("kayang", "Flexibility", "Kayang (bridge)", 15, "On a mat. Hands by your ears, push up into an arch and hold. Come down slowly. Stop if your back hurts.", { x: 3, r: 20 }),
    BI("fold", "Flexibility", "Cium lutut (forward fold)", 30, "Sit with straight legs. Reach for your toes and bring your nose toward your knees. Breathe, never bounce.", { x: 2, r: 15 }),
    BI("butterfly", "Flexibility", "Butterfly stretch", 30, "Soles together, sit tall, let your knees drop gently.", { x: 2, r: 15 }),
    BI("hip", "Flexibility", "Lunge hip stretch", 30, "Back knee down, push your hips forward. Feel the front of the back hip.", { L: true })
  ]
};
export const BONUS_IDS = BONUS["10-11"].map((b) => b.id);
export const BONUS_MAX = BONUS_IDS.length * BONUS_XP;

// Every drill name used anywhere in the program (for checks and previews).
export function allDrillNames() {
  const names = new Set();
  const add = (items) => items.forEach((it) => names.add(it.n));
  Object.values(HANDLES).forEach((h) => add(h.items));
  Object.values(BONUS).forEach(add);
  Object.keys(TRACKS).forEach((g) => {
    for (let n = 1; n <= PROGRAM_DAYS; n++) {
      const s = sessionFor(g, n);
      [s.warmup, s.athletic.items, s.strength.items, s.skill.items].forEach(add);
    }
  });
  return Array.from(names);
}

export const BADGES = [
  { n: 5, label: "First week" }, { n: 10, label: "Two weeks" }, { n: 20, label: "Four weeks" },
  { n: 30, label: "Thirty" }, { n: 50, label: "Fifty" }, { n: 67, label: "Sixty-seven" }, { n: 100, label: "Hundred club" }
];
export const MILESTONES = [
  { n: 1, label: "Day 1" }, { n: 20, label: "Foundation done" }, { n: 45, label: "Build done" },
  { n: 65, label: "Game Speed done" }, { n: 67, label: "Graduate" }
];
