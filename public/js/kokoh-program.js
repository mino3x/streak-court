// Iron Legs (Lari Kokoh): strength and stability for running hard in basketball (sprints, stops, cuts, contact).
// Two versions: KU10 (ages 10–11 track) and KU14 (ages 12–15 track). Public page: /kokoh/ku10, /kokoh/ku14.
//
// Each exercise: name, animation id (ANIMS in drills.js), coaching cues, demo video.
// Each item in a version: ex (exercise id), dose (text), and how the guided mode runs it:
//   kind "reps": sets × reps (side: per leg / per side), rest seconds between sets
//   kind "time": sets × seconds (side: each side), rest seconds
//   kind "free": no counting (e.g. ladder patterns), just "done"

export const EX = {
  jump_rope: { name: "Lompat Tali", anim: "jump_rope",
    cues: ["Mendarat di ujung kaki, lompatan kecil saja.", "Putar tali dari pergelangan tangan, bukan dari bahu."],
    video: { id: "FJmRQ5iTXKE", start: 63, by: "Jump Rope Dudes" } },
  ladder: { name: "Agility Ladder", anim: "in_out_feet",
    cues: ["3 pola: in-in-out-out, lateral (in-in-out), ickey shuffle.", "Langkah kecil dan cepat, jangan menginjak tangga."],
    video: { id: "wqJEBkiTD8o", start: 0, by: "Better Basketball Training" } },
  band_walk: { name: "Band Walk + Monster Walk", anim: "band_walk",
    cues: ["Mini band di atas lutut, posisi setengah jongkok.", "Lutut terus didorong ke luar. Monster walk: langkah lebar serong ke depan."],
    video: { id: "s_W3Gk0wEoQ", start: 0, by: "Highbar Physical Therapy" } },
  snapdown: { name: "Snap-Down & Stick", anim: "snapdown",
    cues: ["Jinjit dan tangan ke atas, lalu turun cepat ke posisi siap.", "Mendarat tanpa suara, tahan 2 detik."],
    video: { id: "x1nBhDLUUi0", start: 0, by: "PLT4M" } },
  box_jump: { name: "Box Jump", anim: "box_jump",
    cues: ["Ayun tangan, lompat, mendarat pelan di atas box.", "Turun dengan berjalan. Jangan pernah lompat turun."],
    video: { id: "W5QzqIbEWvk", start: 0, by: "OPEX Fitness" } },
  lateral_bound: { name: "Lateral Bound & Stick", anim: "skater",
    cues: ["Lompat ke samping, mendarat dengan 1 kaki.", "Tahan 2 detik tanpa goyang. Lutut tidak masuk ke dalam."],
    video: { id: "XDBHOQoAa3w", start: 0, by: "Champion Physical Therapy and Performance" } },
  mb_slam: { name: "Weight Ball Slam", anim: "mb_slam",
    cues: ["Angkat bola setinggi mungkin, lalu banting sekuat tenaga.", "Ambil bola dengan jongkok, punggung tetap lurus."],
    video: { id: "EsAhU1jHpiQ", start: 0, by: "Horton Barbell" } },
  sprint_stop: { name: "Sprint & Stop", anim: "sprint_stop",
    cues: ["Sprint penuh, lalu berhenti dalam 2–3 langkah pendek.", "Pinggul turun, dada di atas lutut, tahan 2 detik."],
    video: { id: "sdgPBkKNO4Y", start: 0, by: "Brandon Smitley · THIRSTgym" } },
  cut: { name: "Cut 45° & 90°", anim: "cut_45_90",
    cues: ["Sprint ke cone, tanam kaki LUAR, dorong ke arah baru.", "Badan tetap rendah, mata ke depan. Kanan dan kiri sama banyak."],
    video: { id: "2megQ_g-wVE", start: 0, by: "Simple Speed Coach" } },
  band_slide: { name: "Defensive Slide + Band", anim: "band_slide",
    cues: ["Band di atas lutut, tetap rendah seperti saat bertahan.", "Dorong dengan kaki belakang. Kaki jangan sampai rapat."],
    video: { id: "GakoIRLVCnU", start: 0, by: "Youth drills: defensive slides" } },
  squat: { name: "Squat", anim: "slow_squat",
    cues: ["Turun 3 detik, pinggul ke belakang, tumit menempel.", "Lutut searah jari kaki. Naik dengan kuat."],
    video: { id: "vhGMD_BfYz4", start: 0, by: "Children's Hospital Colorado" } },
  goblet_squat: { name: "Goblet Squat", anim: "goblet_squat",
    cues: ["Dumbel dipegang di depan dada, dada tegak.", "Turun 3 detik, naik dengan kuat. Lutut searah jari kaki."],
    video: { id: "nfX7IFK9UNI", start: 0, by: "NASM" } },
  step_up: { name: "Step-Up", anim: "step_up",
    cues: ["Seluruh telapak kaki di atas box.", "Dorong lewat tumit, lutut kaki lain naik tinggi, turun pelan."],
    video: { id: "RRuWVDefORg", start: 0, by: "OPEX Fitness" } },
  step_up_db: { name: "Step-Up + Dumbel", anim: "step_up_db",
    cues: ["Dumbel di kedua tangan, seluruh telapak kaki di atas box.", "Dorong lewat tumit, jangan mendorong dengan kaki bawah. Turun pelan."],
    video: { id: "RRuWVDefORg", start: 0, by: "OPEX Fitness" } },
  sl_rdl: { name: "Single-Leg RDL", anim: "sl_rdl",
    cues: ["Pinggul ke belakang, punggung lurus.", "Kaki belakang dan badan membentuk satu garis."],
    video: { id: "6pEL3KxnlEo", start: 0, by: "NASM" } },
  sl_rdl_db: { name: "Single-Leg RDL + Dumbel", anim: "sl_rdl_db",
    cues: ["Pinggul ke belakang, punggung lurus, dumbel dekat ke kaki.", "Turun 2 detik, rasakan tarikan di paha belakang."],
    video: { id: "6pEL3KxnlEo", start: 0, by: "NASM" } },
  sl_calf_raise: { name: "Single-Leg Calf Raise", anim: "sl_calf_raise",
    cues: ["Naik setinggi mungkin, turun 2 detik.", "Boleh pegang dinding untuk keseimbangan."],
    video: { id: "qPd73snQfUs", start: 0, by: "Hospital for Special Surgery" } },
  pallof_press: { name: "Pallof Press", anim: "pallof_press",
    cues: ["Ikat resistance band di samping, setinggi dada.", "Dorong lurus ke depan, tahan 2 detik. Badan jangan sampai berputar."],
    video: { id: "LA6Uc5yIV1c", start: 20, by: "FITBODY with Julie Lohre" } },
  side_plank: { name: "Side Plank", anim: "side_plank",
    cues: ["Kepala, pinggul, dan kaki membentuk satu garis.", "Pinggul tetap tinggi, jangan turun."],
    video: { id: "N_s9em1xTqU", start: 0, by: "Children's Hospital Colorado" } },
  sl_glute_bridge: { name: "Single-Leg Glute Bridge", anim: "sl_glute_bridge",
    cues: ["Dorong lewat tumit, pinggul naik dan tetap rata.", "Tahan 1 detik di atas."],
    video: { id: "egs6m4J8u8c", start: 0, by: "Rehab My Patient" } },
  sl_balance: { name: "Balance 1 Kaki di Bantal", anim: "sl_balance_pad",
    cues: ["Berdiri tegak di atas bantal, lutut sedikit ditekuk.", "Sudah mudah? Coba dengan mata tertutup."],
    video: { id: "Z9_ThjKQyOg", start: 0, by: "Children's Hospital Colorado" } },
  nordic: { name: "Nordic Hamstring", anim: "nordic",
    cues: ["Tumit dikunci di sit-up holder, badan lurus dari lutut ke kepala.", "Turun sepelan mungkin, tangkap dengan tangan, dorong kembali."],
    video: { id: "v31DMiLfM4U", start: 0, by: "E3 Rehab" } }
};

const B = (id, name, min, why, items, tip) => ({ id, name, min, why, items, tip: tip || null });
const R = (ex, dose, sets, reps, rest, o) => Object.assign({ ex, dose, kind: "reps", sets, reps, rest }, o || {});
const T = (ex, dose, sets, secs, rest, o) => Object.assign({ ex, dose, kind: "time", sets, secs, rest }, o || {});
const F = (ex, dose, o) => Object.assign({ ex, dose, kind: "free" }, o || {});

export const VERSIONS = {
  ku10: {
    id: "ku10", group: "10-11", label: "KU10", ages: "10–11 tahun", minutes: 35,
    focus: "Teknik dulu. Hampir semua pakai berat badan sendiri. Jumlah lompatan sengaja sedikit.",
    blocks: [
      B("warm", "Pemanasan", 7, "Kaki lebih cepat, lutut lebih stabil.", [
        T("jump_rope", "4 × 30 dtk", 4, 30, 15),
        F("ladder", "3 pola × 2 putaran"),
        R("band_walk", "2 × 8 langkah ke kanan & kiri", 2, 8, 20, { side: "tiap arah", note: "Lanjut monster walk 2 × 8 langkah." })
      ], "2–3x seminggu, selang sehari. Contoh: Senin · Rabu · Jumat."),
      B("power", "Lompat & Mendarat", 7, "Kerjakan selagi segar. Mendarat pelan = lutut aman.", [
        R("snapdown", "2 × 5", 2, 5, 30),
        R("box_jump", "3 × 3 · box ±30 cm", 3, 3, 45),
        R("lateral_bound", "2 × 4 tiap sisi", 2, 4, 45, { side: "tiap sisi" }),
        R("mb_slam", "2 × 6", 2, 6, 45)
      ]),
      B("speed", "Sprint, Stop, Ganti Arah", 7, "Lari harus 100% cepat, jadi istirahatnya penuh.", [
        R("sprint_stop", "4 × 10 m", 4, 1, 45, { unit: "sprint", restText: "jalan balik" }),
        R("cut", "4 × (2 tiap sisi)", 4, 1, 45, { unit: "cut", restText: "jalan balik" }),
        T("band_slide", "3 × 10 dtk", 3, 10, 30)
      ], "Istirahat = jalan balik ke start (±45 dtk). Mulai lambat? Berhenti untuk hari ini."),
      B("strength", "Kekuatan", 9, "Gerakan rapi dulu, baru tambah beban.", [
        R("squat", "3 × 10", 3, 10, 45, { level: "Sudah rapi 3 × 10? Pegang 1 dumbel 2,5 kg di dada." }),
        R("step_up", "2 × 8 tiap kaki · box ±30 cm", 2, 8, 45, { side: "tiap kaki" }),
        R("sl_rdl", "2 × 6 tiap kaki", 2, 6, 30, { side: "tiap kaki" }),
        R("sl_calf_raise", "2 × 10 tiap kaki", 2, 10, 30, { side: "tiap kaki" })
      ]),
      B("core", "Core & Stabil", 6, "Badan tidak goyang saat sprint dan saat kena body contact.", [
        R("pallof_press", "2 × 8 tiap sisi", 2, 8, 30, { side: "tiap sisi" }),
        T("side_plank", "2 × 15 dtk tiap sisi", 2, 15, 20, { side: "tiap sisi" }),
        R("sl_glute_bridge", "2 × 8 tiap kaki", 2, 8, 20, { side: "tiap kaki" }),
        T("sl_balance", "2 × 30 dtk tiap kaki", 2, 30, 10, { side: "tiap kaki" })
      ])
    ]
  },
  ku14: {
    id: "ku14", group: "12-15", label: "KU14", ages: "12–15 tahun", minutes: 45,
    focus: "Prioritas kekuatan. Beban naik sedikit demi sedikit, dan makan harus cukup supaya otot bertambah.",
    blocks: [
      B("warm", "Pemanasan", 8, "Kaki lebih cepat, lutut lebih stabil.", [
        T("jump_rope", "3 × 45 dtk", 3, 45, 15),
        F("ladder", "3 pola × 3 putaran"),
        R("band_walk", "2 × 10 langkah ke kanan & kiri", 2, 10, 20, { side: "tiap arah", note: "Lanjut monster walk 2 × 10 langkah." })
      ], "2–3x seminggu, selang sehari. Contoh: Senin · Rabu · Jumat."),
      B("power", "Lompat & Mendarat", 9, "Kerjakan selagi segar. Mendarat pelan = lutut aman.", [
        R("snapdown", "2 × 5", 2, 5, 30),
        R("box_jump", "3 × 4 · box 40–50 cm", 3, 4, 60),
        R("lateral_bound", "3 × 4 tiap sisi", 3, 4, 45, { side: "tiap sisi" }),
        R("mb_slam", "3 × 6", 3, 6, 45)
      ]),
      B("speed", "Sprint, Stop, Ganti Arah", 9, "Lari harus 100% cepat, jadi istirahatnya penuh.", [
        R("sprint_stop", "6 × 15 m", 6, 1, 50, { unit: "sprint", restText: "jalan balik" }),
        R("cut", "6 × (3 tiap sisi)", 6, 1, 50, { unit: "cut", restText: "jalan balik" }),
        T("band_slide", "3 × 15 dtk", 3, 15, 30)
      ], "Istirahat = jalan balik ke start (±50 dtk). Mulai lambat? Berhenti untuk hari ini."),
      B("strength", "Kekuatan", 13, "Ini yang membuat badan lebih kuat dan berisi.", [
        R("goblet_squat", "3 × 10", 3, 10, 60, { level: "Mulai 2 dumbel 2,5 kg di dada. Rapi 2 sesi berturut-turut? Naik ke dumbel 8–10 kg." }),
        R("step_up_db", "3 × 8 tiap kaki", 3, 8, 60, { side: "tiap kaki", level: "Dumbel 2,5 kg di tiap tangan, naik bertahap seperti squat." }),
        R("sl_rdl_db", "3 × 8 tiap kaki", 3, 8, 45, { side: "tiap kaki" }),
        R("sl_calf_raise", "3 × 12 tiap kaki + dumbel", 3, 12, 30, { side: "tiap kaki" })
      ]),
      B("core", "Core & Anti-Cedera", 7, "Badan tidak goyang saat body contact, paha belakang terlindungi.", [
        R("pallof_press", "3 × 8 tiap sisi", 3, 8, 30, { side: "tiap sisi" }),
        T("side_plank", "3 × 25 dtk tiap sisi", 3, 25, 20, { side: "tiap sisi" }),
        R("nordic", "2 × 4 · turun pelan", 2, 4, 60)
      ], "Mau otot bertambah? Makan 3x + 2 snack, protein tiap makan (telur, ayam, ikan, tempe, susu). Tidur 8–10 jam.")
    ]
  }
};

export const SAFETY = [
  "Mendarat pelan. Lutut searah jari kaki, tidak masuk ke dalam.",
  "Gerakan harus rapi dulu. Baru setelah itu tambah beban atau tinggi box.",
  "Nyeri di bawah lutut atau di tumit? Berhenti, istirahat, beri tahu pelatih atau orang tua.",
  "Ada latihan tim yang berat hari itu? Cukup pemanasan dan blok Core."
];

export const GEAR = {
  ku10: ["Tali skipping", "Agility ladder", "Mini band", "Plyo box ±30 cm", "Weight ball 2 kg", "Resistance band", "Dumbel 2,5 kg", "Bantal", "Cone / botol"],
  ku14: ["Tali skipping", "Agility ladder", "Mini band", "Plyo box 40–50 cm", "Weight ball 2 kg", "Resistance band", "Dumbel 2,5 kg (×2)", "Sit-up holder", "Cone / botol"]
};

export function versionFor(key) { return VERSIONS[String(key || "").toLowerCase()] || null; }
export function allItems(v) { return v.blocks.flatMap((b) => b.items.map((it) => Object.assign({ block: b }, it))); }
