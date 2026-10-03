# 67 Days Streak Court

Program latihan basket **67 hari** untuk anak **usia 10–15 tahun**. Siapa pun bisa masuk dengan akun Google, membuat kartu pemain (nama panggilan, usia, avatar), lalu berlatih setiap hari dengan timer, animasi gerakan, dan video demo. Hasil latihan masuk ke **leaderboard** dengan sistem poin yang sama untuk semua usia.

Alamat aplikasi: **https://streak-court.web.app**

## Cara kerja

- **Dua jalur usia**: 10–11 dan 12–15 (mengikuti pembagian usia NBA/USA Basketball). Usia yang dipilih menentukan program dan target challenge.
- **67 sesi**: Day 1 adalah sesi pertama yang selesai, Day 67 hari kelulusan. Hari yang terlewat tidak melompati materi; sesi berikutnya tetap nomor berikutnya.
- **Fase**: Foundation (hari 1–20), Build (21–45), Game Speed (46–65), Finals (66 ringan, 67 tes akhir dan graduation game). Setelah 67, bonus day mengulang fase Game Speed.
- **Siklus 5 sesi**: speed, lompat, defense, first step, lalu hari tes (setiap hari ke-5).
- **Setiap sesi**: fisik ±20 menit (warm-up 5, atletik 7–8, kekuatan 7), handles 7 menit, basket 10 menit dengan challenge berskor.
- **Streak**: hari kerja berturut-turut dengan sesi selesai. Akhir pekan tidak memutus streak. Maksimal 5 sesi per minggu; sesi pengganti (make-up) boleh di akhir pekan.
- **Peta 67 hari** (tab Program): hari yang selesai diberi centang hijau, hari berikutnya terbuka, hari-hari setelahnya terkunci sampai hari sebelumnya selesai. Coach view bisa membuka semua hari.
- **Lari Kokoh** (`/kokoh/ku10`, `/kokoh/ku14`): program tambahan kekuatan dan stabilitas untuk lari yang kokoh (sprint, stop, ganti arah, body contact), 2–3x seminggu. Halaman publik tanpa login, tidak menyimpan data, tidak mengubah XP. Ada animasi tiap gerakan, video demo, dan mode latihan dengan set dan timer istirahat. Kartu link ada di tab Today dan Guide. QR code di poster mengarah ke halaman ini.
- **Weekly bonus** (tab Today): push-up, sit-up, plank, glute bridge, kayang, cium lutut, butterfly stretch, dan lunge hip stretch. Boleh dikerjakan hari apa saja, termasuk hari istirahat. Masing-masing dihitung sekali per minggu.

## Poin (XP) yang adil

Aturan sama untuk semua pemain, maksimal **100 XP per hari**:

| Komponen | XP |
|---|---|
| Setiap blok selesai | 10 (5 blok = 50) |
| Challenge | sampai 30 = skor ÷ target usia (maks 100%) |
| Rekor pribadi baru (challenge atau tes) | +10 |
| Bonus streak | +1 per hari streak, maks +10 |
| Weekly bonus (di luar batas 100/hari) | +10 per latihan bonus, sekali seminggu, maks +80 |

Target challenge per usia ada di `public/js/scoring.js` (`TARGETS`). Anak 10 tahun yang mencapai targetnya mendapat poin yang sama dengan anak 15 tahun yang mencapai targetnya. Leaderboard punya tab **This week** (reset setiap Senin) dan **All time**, plus filter usia.

## Isi project

| Path | Isi |
|---|---|
| `public/index.html` | Halaman aplikasi |
| `public/js/program.js` | Program 67 hari: jalur usia, fase, siklus, drill, challenge, tes |
| `public/js/scoring.js` | Aturan XP dan target challenge per usia |
| `public/js/stats.js` | Streak, hitungan hari, dan pembaruan statistik publik |
| `public/js/avatars.js` | Avatar dan pengecekan nama panggilan |
| `public/js/drills.js` | Animasi setiap drill + peta nama drill → animasi |
| `public/js/anim.js` | Mesin animasi (tampak samping, depan, atas) |
| `public/js/videos.js` | Video demo YouTube per drill |
| `public/kokoh.html`, `public/js/kokoh.js`, `public/js/kokoh-program.js`, `public/css/kokoh.css` | Halaman Lari Kokoh: program KU10/KU14, gerakan, dosis, video |
| `public/js/store.js` | Login Google + Firestore |
| `public/js/app.js` | Tampilan aplikasi |
| `firestore.rules` | Aturan akses dan anti-curang |
| `tests/rules.test.mjs` | Tes aturan Firestore (jalan otomatis di GitHub Actions) |
| `.github/workflows/deploy.yml` | Tes, lalu deploy otomatis setiap push ke `main` |
| `tools/` | Alat bantu pengembangan |

## Data

- `players/{uid}`: kartu publik (nama panggilan, avatar, grup usia, XP, hari, streak). Bisa dibaca semua pemain yang login.
- `users/{uid}`: data pribadi (usia, persetujuan orang tua). Hanya pemilik dan admin.
- `logs/{uid}_{tanggal}`: sesi harian. Hanya pemilik dan admin.

Aturan Firestore memastikan XP hanya bisa naik maksimal 100 per hari, hari bertambah satu per satu, dan streak tidak melebihi jumlah hari. Email, foto, dan usia persis tidak pernah tampil di leaderboard. Pemain bisa menghapus semua datanya dari kartu pemain (tombol di kanan atas).

## Setup sekali saja

1. **Firebase console** (project `streak-court`):
   - Authentication → Sign-in method → aktifkan **Google**.
   - Firestore Database → Create database → production mode.
   - Project settings → Your apps → Web app → salin `firebaseConfig` ke `public/js/firebase-config.js`.
2. **Izin service account** (Google Cloud → IAM, project `streak-court`): beri akun `firebase-adminsdk-…@streak-court.iam.gserviceaccount.com` role **Service Usage Consumer**, **Firebase Hosting Admin**, dan **Firebase Rules Admin**.
3. **GitHub secret**: Firebase → Project settings → Service accounts → *Generate new private key*. Tempel isi file JSON ke repo → Settings → Secrets and variables → Actions → secret `FIREBASE_SERVICE_ACCOUNT`. Jangan commit file JSON itu, dan hapus dari komputer setelah ditempel.
4. Push ke `main`. GitHub Actions menjalankan tes, lalu men-deploy hosting dan aturan Firestore.

## Admin

- Admin (`henrysastrak@gmail.com`) masuk dalam **Coach view**: bisa melihat program kedua jalur usia dan leaderboard.
- Di leaderboard, admin bisa **Hide** pemain (misalnya nama panggilan tidak pantas). Pemain tetap bisa berlatih, tetapi tidak tampil untuk pemain lain.
- Menambah admin: ubah `isAdmin()` di `firestore.rules` dan `public/js/access.js`, lalu push.
- Anak di bawah 13 tahun biasanya memakai akun Google yang diawasi (Family Link). Jika login ditolak, orang tua mungkin perlu mengizinkan login ke aplikasi pihak ketiga lewat Family Link.

## Mengubah program

Semua drill ada di `public/js/program.js`. Setiap drill: `I(nama, detik, instruksi, {r: istirahat, x: set, L: kiri+kanan})`. Drill baru juga perlu animasi di peta `BY_NAME` di `public/js/drills.js` (boleh memakai animasi yang sudah ada). Cek sebelum push:

```bash
node tools/check-program.mjs   # durasi setiap blok per sesi
node tools/check-anims.mjs     # setiap drill punya animasi
```

## Pengembangan lokal

```bash
python3 -m http.server 8765
# pratinjau animasi: http://localhost:8765/tools/preview.html
# tes aplikasi (mode demo): python3 tools/apptest3.py /tmp
```

Tanpa `firebase-config.js` yang terisi, aplikasi berjalan dalam **mode demo**: data hanya tersimpan di perangkat itu, dan leaderboard berisi pemain contoh.

## Sumber standar latihan

- NBA & USA Basketball Youth Guidelines — https://youthguidelines.nba.com
- Canada Basketball Athlete Development Model (LTAD)
- NSCA Youth Resistance Training position statement
- SHRed Injuries Basketball warm-up (University of Calgary)
- Sirkuit handles level 1: Coach Rock, Revenge Basketball — https://www.youtube.com/watch?v=moPEMNHmwc4
