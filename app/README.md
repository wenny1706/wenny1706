# 🎤 Panggung — Latihan Public Speaking & Pitching

Aplikasi web untuk melatih bicara di depan klien, investor, atau publik. Aplikasi
mendengarkan lewat mikrofon, menilai cara bicara kamu, lalu memberi koreksi lewat
asisten suara AI.

Tanpa instalasi, tanpa server, tanpa akun. Semua analisis berjalan di browser.

## Yang dilatih

| Aspek | Cara aplikasi mengukurnya |
|---|---|
| **Artikulasi** | Kalimat sulit (tongue twister) dibandingkan kata per kata dengan hasil ucapanmu. Kata yang meleset ditandai merah. |
| **Kecepatan bicara** | Kata per menit dihitung langsung. Ada penunjuk tempo yang menyorot kata yang harus kamu ucapkan saat itu, sesuai target 110–150 kpm. |
| **Ritme &amp; jeda** | Naskah ditampilkan lengkap dengan tanda bacanya, ditambah tanda ambil napas: `/` berhenti sebentar (koma), `//` tarik napas (titik). Aplikasi mengukur panjang tiap tarikan bicara dan menghitung berapa kali kamu benar-benar berhenti dibanding jumlah tanda baca yang seharusnya. |
| **Kejelasan pelafalan** | Kalimat pitching dibaca ulang, lalu dicocokkan dengan naskah target memakai perbandingan kata (toleran terhadap imbuhan). |
| **Kata pengisi** | "eee", "emm", "kayak", "apa ya", "um", "like" dihitung per menit. |
| **Proyeksi suara** | Level suara (RMS) dipantau: berapa persen waktu bicaramu cukup lantang. |
| **Variasi nada** | Nada dasar suara diperkirakan dengan autokorelasi, lalu diukur rentangnya dalam semitone untuk mendeteksi bicara yang monoton. |
| **Jeda** | Jeda diam dihitung; jeda di atas 2,2 detik ditandai sebagai "menggantung". |

## Empat mode latihan

1. **Latihan Pitch** — skenario nyata: pitch 60 detik ke investor, presentasi ke klien
   korporat, menjawab keberatan harga, closing statement, dan impromptu dengan topik acak.
   Setelah selesai, asisten AI melontarkan **pertanyaan sulit dari klien** dan kamu bisa
   langsung latihan menjawabnya dalam 30 detik.
2. **Artikulasi** — kalimat pelenturan lidah, dinilai per kata.
3. **Kejelasan Pelafalan** — kalimat yang sering muncul saat pitching (angka, istilah bisnis).
4. **Kecepatan & Ritme** — naskah dengan penunjuk tempo yang ikut berhenti di setiap tanda baca,
   jadi kamu berlatih berhenti di tempat yang benar, bukan sekadar mengejar kecepatan. Ada empat
   pilihan: naskah ritme berkalimat pendek (paling pas kalau cenderung nyerocos), lalu tempo
   tenang, ideal, dan energik.

## Asisten suara AI

- Memberi aba-aba sebelum latihan dimulai.
- **Menegur saat kamu bicara**: terlalu cepat, terlalu pelan, suara kurang lantang,
  kebanyakan kata pengisi, terlalu lama diam, atau bicara lebih dari 15 detik tanpa ambil napas
  sama sekali (nyerocos). Teguran muncul sebagai teks, dan bisa
  diubah jadi suara lewat sakelar **"Tegur langsung"** (matikan kalau pakai speaker,
  karena suaranya akan ikut terekam mikrofon).
- Membacakan **penilaian akhir**: skor, satu kalimat vonis, dan perbaikan paling penting.
- Membacakan pertanyaan klien pada sesi tanya jawab.

## Skor

Setiap sesi diberi skor 0–100 dari enam aspek berbobot: kejelasan (22%), kecepatan (18%),
bebas kata pengisi (18%), ritme & jeda (18%), proyeksi suara (12%), variasi nada (12%). Sepuluh sesi
terakhir dirata-rata di beranda supaya kemajuanmu terlihat. Sesi di bawah lima detik atau
tanpa suara tidak dinilai dan tidak disimpan.

## Cara menjalankan

Mikrofon hanya bisa diakses dari `https://` atau `http://localhost`, jadi berkasnya perlu
disajikan lewat server kecil, bukan dibuka lewat klik ganda.

```bash
cd app
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

Saat pertama dibuka, klik **"Izinkan mikrofon"** dan izinkan di prompt browser.

Bisa juga di-hosting gratis lewat GitHub Pages (Settings → Pages → arahkan ke folder ini),
karena aplikasinya murni statis.

## Browser

- **Chrome / Edge terbaru (disarankan)** — semua fitur jalan, termasuk transkripsi langsung.
- **Safari** — mikrofon, rekaman, dan analisis suara jalan; transkripsi terbatas.
- **Firefox** — belum mendukung Web Speech API, jadi kata pengisi dan kecepatan bicara tidak
  dihitung. Analisis volume, jeda, dan nada tetap berjalan. Aplikasi menampilkan
  peringatan otomatis kalau ada fitur yang tidak tersedia.

## Privasi

Audio tidak dikirim ke server mana pun oleh aplikasi ini. Rekaman hanya ada di memori
browser untuk diputar ulang, dan riwayat skor disimpan di `localStorage` perangkatmu.
Catatan: transkripsi memakai Web Speech API bawaan browser — pada Chrome, pemrosesannya
dilakukan di layanan Google, sama seperti fitur voice typing.

## Struktur berkas

```
app/
├── index.html          # kerangka layar: beranda, pemilihan, sesi, laporan
├── css/style.css
└── js/
    ├── app.js          # alur aplikasi & tampilan
    ├── config.js       # materi latihan, daftar kata pengisi, ambang penilaian
    ├── audio.js        # mikrofon, level suara, deteksi jeda, perkiraan nada, perekaman
    ├── recognition.js  # transkripsi langsung (Web Speech API)
    ├── metrics.js      # kpm, kata pengisi, pencocokan naskah, perhitungan skor
    ├── coach.js        # asisten suara AI: aba-aba, teguran langsung, umpan balik akhir
    └── storage.js      # riwayat sesi & preferensi
```

Materi latihan dan ambang penilaian ada di `js/config.js` — tambah skenario atau kalimat
baru cukup dengan mengedit berkas itu.
