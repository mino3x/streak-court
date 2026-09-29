// Real demo videos. Curated YouTube videos play embedded (with a start time);
// every other drill opens a YouTube search for that drill.

const COACH_ROCK = "moPEMNHmwc4"; // How To GET BETTER HANDLES In Just 5 Minutes a Day — Revenge Basketball
const SHRED = "QLvB9eTC5J8";      // SHRed Injuries: Basketball NMT Warmup (University of Calgary)

const CURATED = {
  "01 Pound · Right": { id: COACH_ROCK, start: 71, by: "Coach Rock · Revenge Basketball" },
  "02 Pound · Left": { id: COACH_ROCK, start: 101, by: "Coach Rock · Revenge Basketball" },
  "03 Side-to-Side · Right": { id: COACH_ROCK, start: 132, by: "Coach Rock · Revenge Basketball" },
  "04 Side-to-Side · Left": { id: COACH_ROCK, start: 162, by: "Coach Rock · Revenge Basketball" },
  "05 Crossover": { id: COACH_ROCK, start: 193, by: "Coach Rock · Revenge Basketball" },
  "06 Behind the Back": { id: COACH_ROCK, start: 224, by: "Coach Rock · Revenge Basketball" },
  "07 Figure 8 · Backward": { id: COACH_ROCK, start: 250, by: "Coach Rock · Revenge Basketball" },
  "08 Figure 8 · Forward": { id: COACH_ROCK, start: 284, by: "Coach Rock · Revenge Basketball" },
  "09 Cross–Between–Behind": { id: COACH_ROCK, start: 315, by: "Coach Rock · Revenge Basketball" },
  "01 Pound, eyes up · Right": { id: COACH_ROCK, start: 71, by: "Coach Rock · Revenge Basketball" },
  "02 Pound, eyes up · Left": { id: COACH_ROCK, start: 101, by: "Coach Rock · Revenge Basketball" },
  "05 Low Crossover": { id: COACH_ROCK, start: 193, by: "Coach Rock · Revenge Basketball" },
  "07 Behind the Back": { id: COACH_ROCK, start: 224, by: "Coach Rock · Revenge Basketball" },
  "09 Cross–Between–Behind, fast": { id: COACH_ROCK, start: 315, by: "Coach Rock · Revenge Basketball" },
  "Mikan drill": { id: "_VcY9M49JAs", by: "Intro to the Mikan drill" },
  "Mikan + reverse Mikan": { id: "_VcY9M49JAs", by: "Intro to the Mikan drill" },
  "CHALLENGE · Mikan Minute": { id: "_VcY9M49JAs", by: "Intro to the Mikan drill" },
  "Shuttle 5-10-5": { id: "tYhCJd7LaBU", by: "How to run the pro agility (5-10-5)" },
  "Pro agility 5-10-5": { id: "tYhCJd7LaBU", by: "How to run the pro agility (5-10-5)" },
  "Nordic hamstring": { id: "QCVces5NcPc", by: "Nordic curl progressions" },
  "Euro step layups": { id: "MDbS4QF71Iw", by: "Euro step guide" },
  "Slides line to line": { id: "GakoIRLVCnU", by: "Youth drills: defensive slides" },
  "Lane slides": { id: "GakoIRLVCnU", by: "Youth drills: defensive slides" },
  "TEST · Slide test": { id: "GakoIRLVCnU", by: "Youth drills: defensive slides" },
  "Defensive stance hold": { id: "GakoIRLVCnU", by: "Youth drills: defensive slides" },
  "Closeout & chop": { id: "lFY__uSOJIY", by: "Closeouts, slides and deflections" },
  "Closeout, slide, recover": { id: "lFY__uSOJIY", by: "Closeouts, slides and deflections" },
  "One-hand form shots": { id: "drjHBtMgbF4", by: "One-hand form shot" },
  "Weak-hand form shots": { id: "drjHBtMgbF4", by: "One-hand form shot" },
  "Form shots, 3 spots": { id: "EztEhywHzko", by: "Beginner shooting drills" }
};

// Whole-block demos (shown for any warm-up drill without its own video)
const BLOCK = {
  warmup: { id: SHRED, by: "SHRed Injuries Basketball warm-up" },
  handles: { id: COACH_ROCK, start: 71, by: "Coach Rock · Revenge Basketball" }
};

const SEARCH_WORDS = {
  "W1 Fingertip Taps": "basketball fingertip taps drill",
  "W2 Around the World": "basketball around the world ball handling head waist knees",
  "W3 Figure 8 Wraps": "basketball figure 8 ball wraps no dribble",
  "W4 Drop & Catch": "basketball drop and catch front back between legs drill",
  "Snap-downs": "snap down drill landing mechanics athletes",
  "Snap-down to drop squat": "snap down drop squat drill",
  "Pogo hops": "pogo hops plyometric drill",
  "Reaction starts": "reaction sprint start drill",
  "Wall drive switches": "wall drill acceleration switches",
  "Falling starts": "falling start sprint drill",
  "Crossover-step start": "crossover step start drill",
  "Beat the Pro": "beat the pro basketball shooting game",
  "Triple-threat jabs": "triple threat jab step drill basketball",
  "1-2 step catch & shoot": "1-2 step catch and shoot basketball",
  "Rebound & outlet": "rebound and outlet pass drill basketball",
  "03 In & Out": "in and out dribble drill basketball",
  "04 In & Out": "in and out dribble drill basketball",
  "06 Between the Legs": "between the legs dribble drill stationary",
  "08 Double Crossover": "double crossover dribble drill",
  "01 Pound + Cross, eyes up": "pound dribble crossover drill eyes up",
  "02 Zig-Zag Crossovers": "zig zag crossover dribble drill",
  "03 Hesitation & Go": "hesitation dribble move drill youth basketball",
  "04 Retreat & Cross": "retreat dribble crossover drill",
  "05 Spin Move": "spin move basketball drill youth",
  "06 Combo into a Drive": "combo dribble into drive drill",
  "Jab & go": "jab step drive basketball drill",
  "Reverse layups": "reverse layup basketball drill",
  "Floaters": "floater shot basketball drill",
  "Step-back jumper": "step back jumper basketball drill",
  "Crossover pull-up": "crossover pull up jumper drill",
  "Crossover into layup": "crossover into layup drill cone",
  "Double broad jump": "double broad jump plyometric",
  "Depth drop & stick": "depth drop landing drill",
  "Rear-foot elevated split squat": "rear foot elevated split squat bodyweight",
  "Explosive push-ups": "explosive push up plyometric push up",
  "Sit-ups": "curl up sit up proper form kids",
  "Kayang (bridge)": "bridge pose backbend kids gymnastics how to",
  "Cium lutut (forward fold)": "seated forward fold hamstring stretch",
  "Butterfly stretch": "butterfly stretch how to",
  "Lunge hip stretch": "kneeling hip flexor stretch"
};

function baseName(name) {
  return name.replace(/ · (Left|Right)$/, "").replace(/^(CHALLENGE|TEST) · /, "").replace(/^(W\d|\d\d) /, "");
}

export function videoFor(name, blockId) {
  const bare = name.replace(/ · (Left|Right)$/, "");
  const cur = CURATED[name] || CURATED[bare];
  if (cur) return { type: "embed", id: cur.id, start: cur.start || 0, by: cur.by };
  const q = SEARCH_WORDS[bare] || SEARCH_WORDS[baseName(name)] ||
    (baseName(name) + (blockId === "skill" || blockId === "challenge" ? " basketball drill" : blockId === "handles" ? " basketball ball handling" : " exercise how to"));
  const search = { type: "search", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(q), q };
  if (blockId === "warmup") return Object.assign({ type: "embed", id: BLOCK.warmup.id, start: 0, by: BLOCK.warmup.by, alt: search });
  return search;
}
export function embedUrl(v) {
  return "https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&rel=0&playsinline=1" + (v.start ? "&start=" + v.start : "");
}
export function watchUrl(v) {
  return "https://www.youtube.com/watch?v=" + v.id + (v.start ? "&t=" + v.start + "s" : "");
}
