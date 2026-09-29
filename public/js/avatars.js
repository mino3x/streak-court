// Player avatars (no photos) and nickname checks.

export const AVATARS = [
  { id: "fox", e: "🦊", bg: "#FFD9B8" }, { id: "panda", e: "🐼", bg: "#DCE3EC" }, { id: "tiger", e: "🐯", bg: "#FFE3A6" },
  { id: "lion", e: "🦁", bg: "#F5D9A8" }, { id: "wolf", e: "🐺", bg: "#D3DBE8" }, { id: "eagle", e: "🦅", bg: "#E8DDCF" },
  { id: "shark", e: "🦈", bg: "#C8E5F3" }, { id: "bear", e: "🐻", bg: "#EAD4C1" }, { id: "frog", e: "🐸", bg: "#D3EEC5" },
  { id: "penguin", e: "🐧", bg: "#D8E6F6" }, { id: "owl", e: "🦉", bg: "#EADDF4" }, { id: "koala", e: "🐨", bg: "#DDE3E7" },
  { id: "monkey", e: "🐵", bg: "#F2DCC6" }, { id: "dino", e: "🦖", bg: "#CDEBD6" }, { id: "octopus", e: "🐙", bg: "#F8D5DF" },
  { id: "dragon", e: "🐉", bg: "#D2EFE3" }
];
export const AVATAR_IDS = AVATARS.map((a) => a.id);
const BY_ID = Object.fromEntries(AVATARS.map((a) => [a.id, a]));

export function avatarHtml(id, cls) {
  const a = BY_ID[id] || AVATARS[0];
  return '<span class="av' + (cls ? " " + cls : "") + '" style="background:' + a.bg + '" aria-hidden="true">' + a.e + "</span>";
}

// Letters, numbers, spaces, dot, dash, underscore. 2–16 characters, starting with a letter or number.
export const NICK_RE = /^[A-Za-z0-9][A-Za-z0-9 ._-]{1,15}$/;
const BAD_LONG = ["anjing", "anjeng", "bangsat", "kontol", "memek", "ngentot", "jancok", "jancuk", "goblok", "tolol", "kampret", "bajingan",
  "pepek", "fuck", "shit", "bitch", "pussy", "nigger", "nigga", "whore", "slut", "porn", "penis", "vagina", "bokep"];
const BAD_WORD = ["asu", "babi", "bego", "sex", "dick", "cock", "cum", "ass", "tai", "ngewe", "coli", "fck", "wtf"];

export function nicknameProblem(raw) {
  const n = String(raw || "").trim().replace(/\s+/g, " ");
  if (n.length < 2) return "Use at least 2 characters.";
  if (n.length > 16) return "Use 16 characters or fewer.";
  if (!NICK_RE.test(n)) return "Use letters, numbers, spaces, dots or dashes only.";
  const flat = n.toLowerCase().replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
  const squashed = flat.replace(/[^a-z]/g, "");
  if (BAD_LONG.some((w) => squashed.includes(w))) return "Please pick a different nickname.";
  const words = flat.split(/[^a-z]+/).filter(Boolean);
  if (words.some((w) => BAD_WORD.includes(w))) return "Please pick a different nickname.";
  return "";
}
export const cleanNickname = (raw) => String(raw || "").trim().replace(/\s+/g, " ");
