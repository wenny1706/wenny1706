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

/** Kata yang paling berguna dijadikan tombol ketuk manual saat latihan. */
export const TAP_FILLERS = {
  'id-ID': ['eee', 'emm', 'anu', 'kayak', 'gitu', 'apa ya'],
  'en-US': ['um', 'uh', 'like', 'you know', 'so', 'actually']
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
export const WEIGHTS = { clarity: 0.20, pace: 0.16, filler: 0.16, rhythm: 0.16, variety: 0.12, projection: 0.10, energy: 0.10 };

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


/**
 * Kartu topik dadakan (table topics) untuk melatih berpikir cepat.
 */
export const TOPICS = {
  'id-ID': {
    'Bisnis & Klien': [
      'Jelaskan bisnismu ke orang yang baru kamu temui di lift.',
      'Kenapa klien harus memilih kamu, bukan yang lebih murah?',
      'Satu hal yang paling sering disalahpahami tentang pekerjaanmu.',
      'Ceritakan satu klien yang paling banyak mengajarimu.',
      'Kalau anggaranmu dipotong setengah, apa yang tetap kamu pertahankan?',
      'Bagaimana kamu tahu sebuah proyek layak ditolak?',
      'Apa yang berubah di industrimu dalam tiga tahun terakhir?',
      'Jual satu produk sederhana: sebuah pulpen di meja ini.',
      'Kenapa harga jasamu segitu? Jelaskan tanpa minta maaf.',
      'Satu kesalahan yang sering dilakukan pemula di bidangmu.'
    ],
    'Pengalaman & Cerita': [
      'Kegagalan yang ternyata menyelamatkan kamu.',
      'Hari kerja terburuk yang pernah kamu alami, dan apa hikmahnya.',
      'Orang yang paling mengubah cara kerjamu.',
      'Keputusan yang kamu ambil dengan informasi setengah.',
      'Momen ketika kamu tahu kamu berada di jalur yang benar.',
      'Pengalaman pertama yang bikin kamu jatuh cinta pada pekerjaanmu.',
      'Sesuatu yang dulu kamu yakini, tapi sekarang tidak lagi.',
      'Pujian terbaik yang pernah kamu terima dari klien.'
    ],
    'Opini & Argumen': [
      'Kerja dari rumah: lebih produktif atau tidak?',
      'Apakah AI akan menghapus pekerjaan kreatif?',
      'Pendidikan formal masih penting atau tidak?',
      'Media sosial: alat bisnis atau pemborosan waktu?',
      'Lebih baik cepat tapi kasar, atau lambat tapi rapi?',
      'Pelanggan selalu benar. Setuju atau tidak?',
      'Haruskah harga dipasang terbuka di website?',
      'Kerja keras atau kerja cerdas, mana yang lebih menentukan?'
    ],
    'Diri Sendiri': [
      'Perkenalkan dirimu dalam tiga puluh detik, tanpa menyebut jabatan.',
      'Satu kebiasaan kecil yang mengubah hasil kerjamu.',
      'Apa yang ingin kamu kuasai tahun ini, dan kenapa?',
      'Bagaimana kamu memutuskan sesuatu ketika ragu?',
      'Apa yang membuatmu tetap bertahan di hari yang berat?',
      'Satu nasihat yang akan kamu berikan pada dirimu lima tahun lalu.'
    ],
    'Situasi Sulit': [
      'Kamu terlambat mengirim pekerjaan. Jelaskan pada klien.',
      'Timmu membuat kesalahan besar. Sampaikan pada atasan.',
      'Klien minta diskon lima puluh persen. Jawab sekarang.',
      'Kamu harus menolak proyek besar. Sampaikan alasannya.',
      'Presentasimu tinggal lima menit, padahal disiapkan tiga puluh menit.',
      'Kompetitormu menjelekkan produkmu di depan klien. Tanggapi.',
      'Kamu tidak tahu jawaban dari pertanyaan klien. Apa yang kamu katakan?'
    ]
  },
  'en-US': {
    'Business & Clients': [
      'Explain your business to a stranger in an elevator.',
      'Why should a client pick you over a cheaper option?',
      'Sell me a simple pen on this table.',
      'One thing people misunderstand about your work.'
    ],
    'Stories': [
      'A failure that saved you later.',
      'The person who changed how you work.',
      'A decision you made with half the information.'
    ],
    'Opinions': [
      'Is remote work more productive?',
      'Will AI replace creative work?',
      'Should prices be public on a website?'
    ],
    'Hard Situations': [
      'You delivered late. Explain it to the client.',
      'A client asks for a fifty percent discount. Answer now.',
      'You do not know the answer to their question. What do you say?'
    ]
  }
};

/** Lama waktu berpikir dan bicara pada kartu dadakan (detik). */
export const CARD_TIMING = { prep: 15, speak: 60 };

/**
 * Kerangka pitch siap pakai. Setiap bagian punya jatah waktu, dipakai
 * sebagai penunjuk saat latihan supaya durasinya terkendali.
 */
export const OUTLINES = [
  {
    id: 'hook-story-point-cta',
    title: 'Hook → Cerita → Poin → Ajakan',
    desc: 'Paling kuat untuk membuka presentasi atau konten. Orang ingat cerita, bukan daftar fitur.',
    sections: [
      { name: 'Hook', hint: 'Satu kalimat yang bikin orang berhenti dan mendengarkan. Angka mengejutkan, pertanyaan tajam, atau pernyataan berani.', seconds: 15 },
      { name: 'Cerita', hint: 'Satu kejadian nyata dengan tokoh dan masalahnya. Bukan ringkasan, tapi adegan.', seconds: 45 },
      { name: 'Poin', hint: 'Pelajaran dari cerita itu, dihubungkan ke masalah yang dialami pendengarmu.', seconds: 30 },
      { name: 'Ajakan', hint: 'Satu langkah konkret berikutnya. Sebutkan waktunya, bukan sekadar "hubungi kami".', seconds: 15 }
    ]
  },
  {
    id: 'problem-solution-proof-ask',
    title: 'Masalah → Solusi → Bukti → Permintaan',
    desc: 'Kerangka standar pitch ke investor atau klien korporat.',
    sections: [
      { name: 'Masalah', hint: 'Masalah yang dirasakan pendengar, bukan masalah yang kamu ingin selesaikan. Pakai angka.', seconds: 25 },
      { name: 'Solusi', hint: 'Apa yang kamu lakukan, dalam satu kalimat yang bisa diulang orang lain.', seconds: 25 },
      { name: 'Bukti', hint: 'Hasil nyata: nama klien, angka, sebelum dan sesudah.', seconds: 40 },
      { name: 'Permintaan', hint: 'Apa yang kamu minta hari ini. Satu hal saja, jelas dan terukur.', seconds: 20 }
    ]
  },
  {
    id: 'prep',
    title: 'PREP: Poin → Alasan → Contoh → Poin',
    desc: 'Untuk menjawab pertanyaan mendadak tanpa berputar-putar.',
    sections: [
      { name: 'Poin', hint: 'Jawabanmu, langsung di kalimat pertama.', seconds: 10 },
      { name: 'Alasan', hint: 'Kenapa begitu. Satu alasan utama saja.', seconds: 20 },
      { name: 'Contoh', hint: 'Bukti singkat dari pengalamanmu sendiri.', seconds: 25 },
      { name: 'Poin lagi', hint: 'Ulangi jawaban awal dengan kalimat berbeda, lalu berhenti.', seconds: 10 }
    ]
  },
  {
    id: 'star',
    title: 'STAR: Situasi → Tugas → Aksi → Hasil',
    desc: 'Untuk menceritakan pengalaman kerja saat wawancara atau membangun kredibilitas.',
    sections: [
      { name: 'Situasi', hint: 'Latar singkat: kapan, di mana, kondisinya seperti apa.', seconds: 20 },
      { name: 'Tugas', hint: 'Apa yang menjadi tanggung jawabmu.', seconds: 15 },
      { name: 'Aksi', hint: 'Langkah yang kamu ambil. Pakai kata "saya", bukan "kami".', seconds: 40 },
      { name: 'Hasil', hint: 'Angka atau perubahan nyata setelah itu.', seconds: 20 }
    ]
  },
  {
    id: 'objection',
    title: 'Keberatan: Akui → Ubah Sudut → Bukti → Tutup',
    desc: 'Untuk menjawab "terlalu mahal", "kami sudah punya vendor", atau "nanti dulu".',
    sections: [
      { name: 'Akui', hint: 'Ulangi keberatannya dengan kalimatmu sendiri supaya klien merasa didengar.', seconds: 15 },
      { name: 'Ubah sudut', hint: 'Geser dari harga ke nilai, atau ke biaya kalau tidak melakukan apa-apa.', seconds: 25 },
      { name: 'Bukti', hint: 'Satu contoh klien dengan kekhawatiran yang sama, dan hasilnya.', seconds: 25 },
      { name: 'Tutup', hint: 'Tawarkan langkah kecil dengan risiko rendah.', seconds: 15 }
    ]
  }
];
