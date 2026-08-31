/**
 * Konfigurasi konten & ambang penilaian.
 * Semua angka di sini boleh diubah tanpa menyentuh logika aplikasi.
 */

export const LANGS = {
  'id-ID': { label: 'Bahasa Indonesia', voice: ['id-ID', 'id'] },
  'en-US': { label: 'English (US)', voice: ['en-US', 'en'] }
};

/**
 * Daftar kata pengisi (filler). Sengaja konservatif: kata seperti "jadi",
 * "nah", "terus" sering dipakai sebagai konektor yang sah, jadi tidak dihitung
 * kecuali muncul sebagai ragu-ragu ("jadi eee").
 */
export const FILLERS = {
  'id-ID': ['eee', 'ee', 'emm', 'ehm', 'mmm', 'hmm', 'anu', 'apa ya', 'apa namanya',
            'kayak', 'kayaknya', 'gitu ya', 'pokoknya', 'ya kan', 'gimana ya'],
  'en-US': ['um', 'uh', 'erm', 'er', 'ah', 'like', 'you know', 'i mean',
            'basically', 'literally', 'kind of', 'sort of', 'actually']
};

/** Rentang kecepatan bicara ideal (kata per menit) saat pitching. */
export const PACE = {
  'id-ID': { min: 110, max: 150, ideal: 130 },
  'en-US': { min: 120, max: 160, ideal: 140 }
};

/** Ambang analisis audio. */
export const AUDIO = {
  silenceRms: 0.012,      // di bawah ini dianggap jeda
  breathMs: 280,          // diam sesingkat ini sudah dihitung sebagai ambil napas
  pauseMs: 700,           // jeda yang mulai dihitung sebagai jeda sadar
  longPauseMs: 2200,      // jeda yang dianggap terlalu lama
  quietRms: 0.035,        // di bawah ini dianggap suara terlalu pelan
  minSemitoneRange: 2.0,  // variasi nada minimal agar tidak monoton
  runIdealMin: 2.5,       // panjang satu tarikan napas yang wajar (detik)
  runIdealMax: 9,
  runTooLong: 15          // di atas ini namanya nyerocos
};

/** Lama jeda yang seharusnya diambil pada tiap tanda baca (milidetik). */
export const PAUSE_MS = {
  ',': 350, ';': 450, ':': 450, '.': 750, '!': 750, '?': 750, '...': 900
};

/** Bobot skor akhir. */
export const WEIGHTS = { pace: 0.18, filler: 0.18, clarity: 0.22, rhythm: 0.18, projection: 0.12, variety: 0.12 };

export const SCENARIOS = [
  {
    id: 'investor60',
    title: 'Pitch 60 Detik ke Investor',
    brief: 'Jelaskan masalah, solusi, siapa targetmu, dan kenapa timmu yang paling pas. Tutup dengan satu permintaan yang jelas.',
    seconds: 60,
    questions: [
      'Apa yang membuat solusi Anda sulit ditiru kompetitor?',
      'Berapa besar pasar yang realistis Anda ambil dalam 12 bulan?',
      'Uangnya akan dipakai untuk apa persisnya?'
    ]
  },
  {
    id: 'corporate',
    title: 'Presentasi Produk ke Klien Korporat',
    brief: 'Buka dengan masalah yang klien rasakan, bukan dengan fitur. Tunjukkan hasil yang terukur, lalu ajakan langkah berikutnya.',
    seconds: 120,
    questions: [
      'Bagaimana ini terhubung dengan sistem yang sudah kami pakai?',
      'Berapa lama sampai kami melihat hasilnya?',
      'Siapa klien Anda yang skalanya mirip kami?'
    ]
  },
  {
    id: 'objection',
    title: 'Menjawab Keberatan Harga',
    brief: 'Klien bilang "terlalu mahal". Akui dulu kekhawatirannya, ubah kerangka ke nilai dan biaya jika tidak melakukan apa-apa.',
    seconds: 60,
    questions: [
      'Kompetitor menawarkan setengah harga Anda. Kenapa saya harus bayar lebih?',
      'Bisa turunkan harga kalau kami komitmen setahun?'
    ]
  },
  {
    id: 'closing',
    title: 'Closing Statement',
    brief: 'Rangkum satu manfaat terbesar, satu bukti, dan satu langkah konkret berikutnya. Tanpa kata pengisi.',
    seconds: 45,
    questions: ['Kalau saya setuju hari ini, apa langkah pertamanya?']
  },
  {
    id: 'impromptu',
    title: 'Impromptu / Dadakan',
    brief: 'Anda diminta bicara mendadak. Pakai pola: Poin - Alasan - Contoh - Poin lagi.',
    seconds: 60,
    random: [
      'Kenapa bisnis kecil perlu otomasi?',
      'Satu kebiasaan kerja yang mengubah hasil tim Anda.',
      'Jelaskan pekerjaan Anda ke anak umur sepuluh tahun.',
      'Kesalahan terbesar yang pernah Anda pelajari.',
      'Kenapa klien harus percaya pada Anda, bukan pada harga?'
    ]
  }
];

/** Latihan artikulasi: kalimat sulit untuk melenturkan mulut & lidah. */
export const ARTICULATION = {
  'id-ID': [
    'Kuku kaki kakak kakekku kaku-kaku.',
    'Ular melingkar-lingkar di atas pagar pak Umar.',
    'Kepala kelapa, kelapa kepala, dikepala kelapa dikelapa kepala.',
    'Tujuh puluh tujuh tekukur terbang terbirit-birit.',
    'Pak Prapto pergi ke Prapatan pakai pikap Pak Parto.',
    'Bapak Bakar membakar bakwan biar Bakri beli bakwan bakar.',
    'Saya sedang mencari sarang serangga di sekitar semak.',
    'Toko-toko di kota Tokyo tutup total tiap tanggal tujuh.'
  ],
  'en-US': [
    'She sells seashells by the seashore.',
    'Red lorry, yellow lorry, red lorry, yellow lorry.',
    'A proper copper coffee pot.',
    'Six slick slim sycamore saplings.',
    'Unique New York, you know you need unique New York.'
  ]
};

/** Latihan kejelasan pelafalan: kalimat yang sering muncul saat pitching. */
export const CLARITY = {
  'id-ID': [
    'Kami menargetkan pertumbuhan tiga puluh tujuh persen pada kuartal keempat.',
    'Struktur biaya kami transparan, terukur, dan tanpa biaya tersembunyi.',
    'Implementasinya membutuhkan empat belas hari kerja termasuk pelatihan tim.',
    'Prioritas kami adalah retensi pelanggan, bukan sekadar akuisisi.',
    'Sistem ini terintegrasi langsung dengan proses distribusi dan pergudangan.',
    'Kesimpulannya, investasi ini kembali dalam sembilan sampai sebelas bulan.'
  ],
  'en-US': [
    'We are targeting thirty seven percent growth in the fourth quarter.',
    'Our pricing structure is transparent, measurable, and free of hidden fees.',
    'Implementation takes fourteen working days including team training.',
    'In conclusion, this investment pays back within nine to eleven months.'
  ]
};

/** Naskah untuk latihan mengatur kecepatan bicara. */
export const PACE_SCRIPT = {
  'id-ID': `Setiap bisnis punya satu masalah yang sama: waktu. Tim menghabiskan berjam-jam untuk pekerjaan berulang, padahal sistem bisa menyelesaikannya sendiri. Kami memetakan pekerjaan itu, lalu memindahkannya ke alur kerja otomatis. Manusia tetap yang memegang kendali. Hasilnya sederhana. Pekerjaan yang tadinya makan tiga jam sehari, sekarang selesai dalam dua puluh menit. Biaya operasional turun. Tim punya ruang untuk mengurus pelanggan. Jadi, kami tidak menjual perangkat lunak. Kami menjual waktu yang kembali ke tangan Anda. Beri kami tiga puluh menit minggu ini, dan kami tunjukkan satu proses di perusahaan Anda yang bisa berjalan otomatis mulai bulan depan.`,
  'en-US': `Every business shares the same problem: time. Teams spend hours on repetitive work, even though a system could finish it alone. We map that work, then move it into automated workflows. People still hold the controls. The result is simple. Work that used to take three hours a day, now takes twenty minutes. Operating costs drop. The team gets room to serve customers. So, we do not sell software. We sell time returned to your hands. Give us thirty minutes this week, and we will show you one process in your company that can run automatically from next month.`
};

/** Naskah pendek khusus latihan ritme: banyak titik, kalimat singkat. */
export const RHYTHM_SCRIPT = {
  'id-ID': `Terima kasih atas waktunya. Saya Wenny, dari Digital Geekz. Hari ini saya bawa satu angka. Tim Anda kehilangan enam ratus jam setiap tahun, hanya untuk menyalin data. Enam ratus jam. Itu setara tiga bulan kerja satu orang. Kami sudah memperbaiki ini di tiga perusahaan retail. Rata-rata, mereka hemat delapan puluh persen waktu. Bukan teori. Angka nyata, dari klien nyata. Saya minta satu hal saja hari ini: tiga puluh menit, minggu depan, bersama tim operasional Anda.`,
  'en-US': `Thank you for your time. I am Wenny, from Digital Geekz. Today I bring one number. Your team loses six hundred hours every year, just copying data. Six hundred hours. That equals three months of one person's work. We have fixed this in three retail companies. On average, they saved eighty percent of that time. Not theory. Real numbers, from real clients. I ask one thing today: thirty minutes, next week, with your operations team.`
};

/** Kalimat pembuka pelatih suara per mode. */
export const COACH_INTRO = {
  'id-ID': {
    pitch: 'Siap. Tarik napas, bicara ke arah klien, dan mulai saat aba-aba.',
    articulation: 'Baca perlahan dan berlebihan. Buka mulut lebih lebar dari biasanya.',
    clarity: 'Baca kalimat di layar. Ucapkan setiap suku kata sampai selesai.',
    pace: 'Ikuti sorotan kata. Berhenti setiap ketemu garis miring, itu tempat ambil napas.'
  },
  'en-US': {
    pitch: 'Ready. Breathe, face your client, and start on the cue.',
    articulation: 'Read slowly and exaggerate. Open your mouth wider than usual.',
    clarity: 'Read the sentence on screen. Finish every syllable.',
    pace: 'Follow the highlight. Stop at every slash, that is where you breathe.'
  }
};
