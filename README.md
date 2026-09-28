# Streak Court

Aplikasi latihan basket harian untuk **Harvell (U10)** dan **Jasper (U14)**: jadwal Senin–Jumat, timer otomatis dengan animasi gerakan untuk setiap drill, video demo asli, streak, badge, dan rekor pribadi. Data disimpan di Firebase (Firestore) dan hanya bisa diakses akun Google yang terdaftar.

## Isi project

| Path | Isi |
|---|---|
| `public/index.html` | Halaman aplikasi |
| `public/js/program.js` | Program latihan (drill, durasi, instruksi, challenge, tes) |
| `public/js/drills.js` | Animasi setiap drill + peta nama drill → animasi |
| `public/js/anim.js` | Mesin animasi (tampak samping, depan, atas) |
| `public/js/videos.js` | Video demo YouTube per drill |
| `public/js/store.js` | Login Google + Firestore |
| `public/js/firebase-config.js` | Konfigurasi web app Firebase |
| `firestore.rules` | Aturan akses: daftar email yang boleh masuk |
| `.github/workflows/deploy.yml` | Deploy otomatis ke Firebase Hosting setiap push ke `main` |
| `tools/` | Alat bantu pengembangan (pratinjau animasi, bundel SDK) |

## Setup sekali saja

1. **Firebase console** (project `streak-court`):
   - Authentication → Sign-in method → aktifkan **Google**.
   - Firestore Database → Create database → `asia-southeast2` → production mode.
   - Hosting → Get started.
   - Project settings → Your apps → Web app → salin `firebaseConfig` ke `public/js/firebase-config.js`.
2. **Project id**: isi `.firebaserc` → `"default": "<project-id>"`.
3. **Email yang boleh login**: isi daftar di `firestore.rules` (fungsi `allowed()`).
4. **GitHub secret**: Firebase → Project settings → Service accounts → *Generate new private key*. Tempel isi file JSON-nya ke repo → Settings → Secrets and variables → Actions → secret `FIREBASE_SERVICE_ACCOUNT`. Jangan commit file JSON itu.
5. Push ke `main`. GitHub Actions akan men-deploy hosting dan aturan Firestore. Alamat aplikasinya: `https://<project-id>.web.app`.

## Menambah/mengubah akses

Edit daftar email di `firestore.rules`, commit, lalu push. Aturan baru langsung terpasang.

## Mengubah program latihan

Semua drill ada di `public/js/program.js`. Setiap drill: `I(nama, detik, instruksi, {r: istirahat, x: set, L: kiri+kanan})`. Kalau menambah drill baru, tambahkan juga animasinya di peta `BY_NAME` di `public/js/drills.js` (boleh memakai animasi yang sudah ada).

## Pratinjau animasi (pengembangan)

```bash
python3 -m http.server 8765
# buka http://localhost:8765/tools/preview.html
```

Tanpa `firebase-config.js` yang terisi, aplikasi berjalan dalam **mode demo**: data hanya tersimpan di perangkat itu.

## Sumber standar latihan

- NBA & USA Basketball Youth Guidelines — https://youthguidelines.nba.com
- Canada Basketball Athlete Development Model (LTAD)
- NSCA Youth Resistance Training position statement
- SHRed Injuries Basketball warm-up (University of Calgary)
- Sirkuit handles: Coach Rock, Revenge Basketball — https://www.youtube.com/watch?v=moPEMNHmwc4
