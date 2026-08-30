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
  pauseMs: 700,           // jeda yang mulai dihitung
  longPauseMs: 2200,      // jeda yang dianggap terlalu lama
  quietRms: 0.035,        // di bawah ini dianggap suara terlalu pelan
  minSemitoneRange: 2.0   // variasi nada minimal agar tidak monoton
};

/** Bobot skor akhir. */
export const WEIGHTS = { pace: 0.22, filler: 0.22, clarity: 0.26, projection: 0.15, variety: 0.15 };

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
  'id-ID': `Setiap bisnis punya satu masalah yang sama: waktu. Tim menghabiskan berjam-jam untuk pekerjaan berulang yang sebenarnya bisa diselesaikan sistem. Kami membantu perusahaan memetakan pekerjaan itu, lalu memindahkannya ke alur kerja otomatis yang tetap dipegang manusia. Hasilnya sederhana. Pekerjaan yang tadinya makan tiga jam sehari sekarang selesai dalam dua puluh menit. Biaya operasional turun, dan tim punya ruang untuk mengurus pelanggan. Kami tidak menjual perangkat lunak, kami menjual waktu yang kembali ke tangan Anda. Kalau Anda memberi kami tiga puluh menit minggu ini, kami akan tunjukkan satu proses di perusahaan Anda yang bisa berjalan otomatis sejak bulan depan.`,
  'en-US': `Every business shares the same problem: time. Teams spend hours on repetitive work that a system could finish on its own. We help companies map that work, then move it into automated workflows that people still control. The result is simple. Work that used to take three hours a day now takes twenty minutes. Operating costs drop, and the team gets room to serve customers. We do not sell software, we sell time returned to your hands. Give us thirty minutes this week and we will show you one process in your company that can run automatically starting next month.`
};

/** Kalimat pembuka pelatih suara per mode. */
export const COACH_INTRO = {
  'id-ID': {
    pitch: 'Siap. Tarik napas, bicara ke arah klien, dan mulai saat aba-aba.',
    articulation: 'Baca perlahan dan berlebihan. Buka mulut lebih lebar dari biasanya.',
    clarity: 'Baca kalimat di layar. Ucapkan setiap suku kata sampai selesai.',
    pace: 'Ikuti penunjuk kecepatan. Jangan mendahului, jangan tertinggal.'
  },
  'en-US': {
    pitch: 'Ready. Breathe, face your client, and start on the cue.',
    articulation: 'Read slowly and exaggerate. Open your mouth wider than usual.',
    clarity: 'Read the sentence on screen. Finish every syllable.',
    pace: 'Follow the pacer. Do not rush, do not lag.'
  }
};
