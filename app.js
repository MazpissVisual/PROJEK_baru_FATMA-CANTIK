/**
 * ============================================================================
 * CHEMLAB 3D - MAIN APPLICATION CONTROLLER
 * ============================================================================
 * Handles:
 * 1. Student Login, Session & Profile Persistence (localStorage)
 * 2. Cartoon APD Dress-Up Game & Lab Airlock Entrance Check
 * 3. Web Audio API Procedural Sound Effects & Audio Synthesizer
 * 4. Tab Navigation & GHS Hazard Pictogram Flip Cards
 * 5. Problem-Based Learning (PBL) Syntax & LKPD Digital
 * 6. Interactive Quiz Engine with Timer, Instant Feedback & Confetti
 * 7. Student Reflection Journal (3-2-1 Model)
 * 8. Official Certificate Generator with Dynamic QR Code & Print Support
 */

// Global Application State
const AppState = {
  // Student Profile Data
  student: {
    isLoggedIn: false,
    name: 'Aisyah Putri',
    nisn: '20241005',
    className: 'X.1',
    school: 'SMAN 1 Abung Tinggi',
    avatar: 'avatar1',
    quizScore: null,
    quizPassed: false
  },

  // APD Dress-up State
  apdGear: {
    goggles: false,
    mask: false,
    coat: false,
    gloves: false,
    shoes: false
  },

  // Audio System
  audio: {
    enabled: true,
    ctx: null
  },

  // Current Active Tab
  currentTab: 'beranda',

  // Current Materi Subtab
  materiSubTab: 'alat',

  // PBL State
  pblCurrentPhase: 1,

  // Quiz Engine State
  quiz: {
    questions: [],
    currentIndex: 0,
    answers: {},
    timeRemaining: 600, // 10 minutes in seconds
    timerInterval: null,
    score: 0,
    isCompleted: false
  },

  // Reflection Journal State
  reflection: {
    mood: 'Sangat Bersemangat & Terinspirasi',
    rating: 5,
    q1: '',
    q2: '',
    q3: '',
    savedAt: null
  },

  // Teacher Portal & Dashboard State (Ibu Fatma Alawiyah, S.Pd.,Gr.)
  teacher: {
    isLoggedIn: false,
    username: 'Fatma_alawiyah',
    name: 'Fatma Alawiyah, S.Pd.,Gr.',
    currentSubTab: 'nilai',
    submissions: [],
    lkpdList: [],
    reflectionsList: [],
    gasUrl: ''
  }
};

const DEFAULT_GAS_URL = (window.CHEMLAB_CONFIG?.gasUrl || '').trim();

function isValidGASUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
  } catch (_) {
    return false;
  }
}

function getGASUrl() {
  return (AppState.teacher.gasUrl || DEFAULT_GAS_URL || '').trim();
}

// GHS Hazard Pictograms Catalog (9 Symbols)
const GHSData = [
  {
    id: 'ghs-flammable',
    name: 'Mudah Terbakar (Flammable)',
    icon: 'fa-fire-flame-curved',
    color: '#ef4444',
    meaning: 'Zat yang mudah menyala atau terbakar bila terkena percikan api, panas, atau udara lembap.',
    examples: 'Etanol, Aseton, Dietil Eter, Logam Natrium (Na), Gas Hidrogen.',
    sop: 'Jauhkan dari sumber api, pemanas bunsen, dan simpan di lemari tahan api (flammable cabinet).'
  },
  {
    id: 'ghs-corrosive',
    name: 'Korosif (Corrosive)',
    icon: 'fa-hand-dots',
    color: '#3b82f6',
    meaning: 'Zat yang dapat merusak jaringan hidup (kulit, mata) serta mengikis logam dan bahan lain.',
    examples: 'Asam Sulfat (H2SO4), Asam Klorida (HCl pekat), Natrium Hidroksida (NaOH padat/pekat).',
    sop: 'Gunakan sarung tangan nitril dan goggles. Jika terkena kulit, bilas air mengalir 15 menit.'
  },
  {
    id: 'ghs-toxic',
    name: 'Beracun / Toksik (Toxic / Skull)',
    icon: 'fa-skull-crossbones',
    color: '#a855f7',
    meaning: 'Zat yang dapat menyebabkan keracunan fatal atau kematian jika terhirup, tertelan, atau terserap kulit.',
    examples: 'Kalium Sianida (KCN), Merkuri (Hg), Metanol pekat, Senyawa Arsenik.',
    sop: 'Bekerja secara ketat di lemari asam (fume hood) dengan respirator khusus. Jangan pernah mencicipi!'
  },
  {
    id: 'ghs-oxidizing',
    name: 'Pengoksidasi (Oxidizing)',
    icon: 'fa-sun',
    color: '#f59e0b',
    meaning: 'Bahan kimia yang melepaskan oksigen dan memicu atau mempercepat kebakaran bahan lain.',
    examples: 'Kalium Permanganat (KMnO4), Hidrogen Peroksida (H2O2 pekat), Asam Nitrat (HNO3).',
    sop: 'Simpan terpisah jauh dari bahan organik dan pelarut yang mudah terbakar.'
  },
  {
    id: 'ghs-explosive',
    name: 'Mudah Meledak (Explosive)',
    icon: 'fa-bomb',
    color: '#dc2626',
    meaning: 'Zat padat atau cair yang dengan reaksi kimia dapat menghasilkan gas bertekanan dan suhu tinggi.',
    examples: 'Pikrat, Nitrogliserin, Amonium Nitrat, Peroksida organik yang teroksidasi.',
    sop: 'Hindari benturan, gesekan, lonjakan panas, dan simpan dalam wadah stabil dengan kelembapan terkontrol.'
  },
  {
    id: 'ghs-harmful',
    name: 'Iritasi / Berbahaya (Harmful / Irritant)',
    icon: 'fa-triangle-exclamation',
    color: '#f97316',
    meaning: 'Zat yang menyebabkan iritasi pada kulit, saluran pernapasan, serta pusing atau alergi ringan.',
    examples: 'Kloroform encer, Amonia encer (NH4OH), Kalsium Klorida (CaCl2), Trikloroetilen.',
    sop: 'Gunakan masker, sarung tangan pelindung, dan pastikan ventilasi ruangan lab mengalir lancar.'
  },
  {
    id: 'ghs-health',
    name: 'Bahaya Kesehatan Serius (Health Hazard)',
    icon: 'fa-lungs-virus',
    color: '#6366f1',
    meaning: 'Karsinogenik (penyebab kanker), mutagenik, atau toksisitas reproduksi jangka panjang.',
    examples: 'Benzena (C6H6), Formaldehida (Formalin), Asbes, Timbal (Pb).',
    sop: 'Hindari paparan kronis, gunakan lemari asam khusus dan alat proteksi tingkat tinggi.'
  },
  {
    id: 'ghs-gas',
    name: 'Gas Bertekanan (Compressed Gas)',
    icon: 'fa-bottle-droplet',
    color: '#06b6d4',
    meaning: 'Gas yang disimpan di dalam tabung bertekanan tinggi yang berisiko meledak jika terpapar panas.',
    examples: 'Tabung Gas N2, O2, Argon, Asetilena, Karbon Dioksida cair.',
    sop: 'Rantai tabung gas ke dinding agar tidak roboh, dan pasang regulator tekanan terstandar.'
  },
  {
    id: 'ghs-environment',
    name: 'Bahaya Lingkungan (Environmental Hazard)',
    icon: 'fa-tree',
    color: '#10b981',
    meaning: 'Zat yang merusak ekosistem perairan dan tanah jika dibuang langsung ke saluran pembuangan.',
    examples: 'Logam Berat (Kadmium, Tembaga Sulfat CuSO4 pekat, Pestisida kimia).',
    sop: 'DILARANG membuang ke wastafel! Buang ke wadah penampung limbah B3 anorganik/organik terpisah.'
  }
];

// 10 Comprehensive Chemistry Laboratory Questions
const QuizQuestionBank = [
  {
    id: 1,
    topic: 'Alat Laboratorium',
    question: 'Alat laboratorium kimia berikut yang memiliki ketelitian paling tinggi untuk membuat larutan standar dengan volume eksak 100,0 mL adalah...',
    options: [
      'Gelas Kimia (Beaker Glass)',
      'Labu Erlenmeyer',
      'Labu Ukur (Volumetric Flask)',
      'Gelas Ukur (Graduated Cylinder)'
    ],
    answer: 2,
    explanation: 'Labu Ukur (Volumetric Flask) adalah alat ukur kuantitatif Kelas A dengan toleransi ketelitian sangat tinggi (±0.08 mL) yang dirancang khusus untuk pembuatan larutan baku hingga batas garis tera.'
  },
  {
    id: 2,
    topic: 'Keselamatan Kerja (APD)',
    question: 'Sebelum memasuki laboratorium kimia, perlengkapan APD utama yang wajib dikenakan untuk melindungi mata dari cipratan zat asam pekat adalah...',
    options: [
      'Kacamata hitam biasa (Sunglasses)',
      'Kacamata pengaman lab (Safety Goggles)',
      'Lensa kontak (Contact Lens)',
      'Kaca pembesar (Magnifier)'
    ],
    answer: 1,
    explanation: 'Safety Goggles melindungi mata secara menyeluruh dengan segel samping (side-shield) yang mencegah percikan bahan kimia korosif langsung mengenai kornea mata.'
  },
  {
    id: 3,
    topic: 'Teknik Membaca Meniskus',
    question: 'Bagaimana cara membaca volume cairan yang benar pada gelas ukur saat mengukur larutan bening seperti air atau asam klorida encer?',
    options: [
      'Mata melihat dari sudut atas permukaan cairan',
      'Mata sejajar tegak lurus dengan dasar cekungan (meniskus bawah)',
      'Mata sejajar dengan tepi atas lengkungan cairan',
      'Melihat dari bawah tabung gelas ukur'
    ],
    answer: 1,
    explanation: 'Untuk larutan bening atau encer, pembacaan yang benar adalah posisi mata sejajar tegak lurus dengan titik terbawah cekungan (meniskus bawah) untuk menghindari kesalahan paralaks.'
  },
  {
    id: 4,
    topic: 'Simbol Bahaya GHS',
    question: 'Botol reagen asam sulfat pekat (H2SO4 98%) memiliki simbol bergambar cairan yang merusak tangan dan lempengan logam. Simbol tersebut menandakan bahaya...',
    options: [
      'Mudah Terbakar (Flammable)',
      'Korosif (Corrosive)',
      'Mudah Meledak (Explosive)',
      'Pengoksidasi (Oxidizing)'
    ],
    answer: 1,
    explanation: 'Simbol tersebut adalah simbol Korosif (Corrosive) GHS yang menunjukkan bahwa zat dapat menyebabkan luka bakar kimia parah pada jaringan kulit serta merusak benda logam.'
  },
  {
    id: 5,
    topic: 'SOP Pengenceran Asam',
    question: 'Aturan emas yang benar saat mengencerkan asam sulfat pekat dengan air adalah aturan "AA", yaitu...',
    options: [
      'Menuangkan Air ke dalam Asam secara cepat',
      'Menuangkan Asam ke dalam Air perlahan melalui dinding wadah',
      'Mencampurkan keduanya sekaligus dalam satu wadah tertutup',
      'Memanaskan air terlebih dahulu sebelum dituangkan ke asam'
    ],
    answer: 1,
    explanation: 'Selalu tuangkan Asam ke dalam Air (AA) secara perlahan! Pengenceran asam adalah reaksi sangat eksotermis (melepas panas tinggi). Jika air dituangkan ke asam, air seketika mendidih dan menyebabkan letupan percikan asam.'
  },
  {
    id: 6,
    topic: 'Praktikum Titrasi',
    question: 'Pada titrasi asam klorida (HCl) dengan natrium hidroksida (NaOH) menggunakan indikator Fenolftalein (PP), titik akhir titrasi ditandai oleh...',
    options: [
      'Larutan berubah dari bening menjadi merah muda samar permanen',
      'Larutan berubah dari kuning menjadi merah pekat',
      'Terbentuknya endapan putih di dasar Erlenmeyer',
      'Larutan berubah menjadi biru tua'
    ],
    answer: 0,
    explanation: 'Indikator Fenolftalein (PP) tidak berwarna pada suasana asam/netral (pH < 8.2) dan berubah menjadi merah muda (pink) pada trayek pH 8.2 - 10.0 saat seluruh asam dinetralkan oleh basa.'
  },
  {
    id: 7,
    topic: 'Pembakar Bunsen',
    question: 'Untuk mendapatkan nyala api biru yang sangat panas dan tidak menghasilkan jelaga hitam pada pembakar Bunsen, hal yang harus dilakukan adalah...',
    options: [
      'Menutup rapat lubang udara (collar vent)',
      'Membuka lubang udara (collar vent) agar oksigen bercampur sempurna',
      'Mengecilkan aliran gas hingga hampir padam',
      'Menggoyang cerobong bunsen'
    ],
    answer: 1,
    explanation: 'Membuka cincin udara (collar) memungkinkan oksigen udara bercampur optimal dengan gas alam, menghasilkan pembakaran sempurna (nyala api biru non-luminous) tanpa menghasilkan karbon jelaga.'
  },
  {
    id: 8,
    topic: 'Teknik Membaui Zat (Wafting)',
    question: 'Cara aman yang benar untuk mengetahui aroma atau bau dari suatu uap gas kimia adalah...',
    options: [
      'Menghirup langsung mulut tabung reaksi sedalam-dalamnya',
      'Mengibaskan telapak tangan perlahan di atas mulut wadah ke arah hidung (wafting)',
      'Meminum sedikit larutan untuk memastikan rasanya',
      'Mendekatkan hidung 1 cm dari permukaan wadah'
    ],
    answer: 1,
    explanation: 'Teknik wafting (mengibaskan tangan perlahan) membawa sedikit sampel uap ke arah indera penciuman tanpa risiko iritasi paru-paru atau keracunan gas pekat.'
  },
  {
    id: 9,
    topic: 'Pengelolaan Limbah Lab',
    question: 'Setelah selesai melakukan praktikum titrasi dan uji kimia dengan larutan logam berat, sisa cairan limbah harus...',
    options: [
      'Dibuang langsung ke saluran wastafel dengan air mengalir',
      'Dibuang ke botol/jerigen penampung limbah B3 khusus yang telah berlabel',
      'Disiramkan ke tanaman di luar laboratorium',
      'Dibiarkan menguap di atas meja'
    ],
    answer: 1,
    explanation: 'Limbah kimia B3 (Bahan Berbahaya dan Beracun) wajib ditampung dalam jerigen limbah terpisah (organik/anorganik berlabel) dan tidak boleh dibuang ke wastafel agar tidak mencemari air tanah dan ekosistem.'
  },
  {
    id: 10,
    topic: 'Tanggap Darurat Lab',
    question: 'Jika kulit praktikan tanpa sengaja terkena tumpahan larutan asam klorida (HCl pekat), tindakan pertolongan pertama (first aid) yang paling tepat adalah...',
    options: [
      'Mengoleskan pasta gigi atau mentega pada kulit yang terbakar',
      'Membilas segera dengan air mengalir bersih selama minimal 15 menit',
      'Menutup luka dengan plester kedap udara tanpa dicuci',
      'Menyiramkan larutan basa pekat untuk menetralkan asam'
    ],
    answer: 1,
    explanation: 'Tindakan darurat pertama pada luka bakar kimia adalah membilas area terdampak dengan air mengalir (safety shower / eyewash) terus menerus minimal 15-20 menit untuk mengencerkan dan menghilangkan zat korosif.'
  }
];

// Document Ready Initialization
window.addEventListener('DOMContentLoaded', () => {
  loadStudentSession();
  loadTeacherSession();
  initWebAudio();
  renderGHSSymbols();
  updateAPDProgressUI();
  updateCertificateUI();
  loadPBLData();
  loadGASCodePreview();
});

/* ==========================================================================
   1. STUDENT LOGIN & SESSION STORAGE
   ========================================================================== */

function loadStudentSession() {
  const saved = localStorage.getItem('chemlab_student_profile');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(AppState.student, data);
      AppState.student.isLoggedIn = true;

      // Close login screen overlay
      const loginOverlay = document.getElementById('login-screen');
      if (loginOverlay) loginOverlay.classList.remove('active');

      updateNavbarStudentUI();
      updateCertificateUI();
    } catch (e) {
      console.warn('Error reading stored session:', e);
    }
  } else {
    // Show login screen
    const loginOverlay = document.getElementById('login-screen');
    if (loginOverlay) loginOverlay.classList.add('active');
  }
}

function handleLogin() {
  const nameEl = document.getElementById('student-name');
  const classEl = document.getElementById('student-class');

  const nameInput = nameEl ? nameEl.value.trim() : '';
  const classInput = classEl ? classEl.value : '';

  if (!nameInput || !classInput) {
    alert('Mohon masukkan Nama Lengkap dan pilih Kelas terlebih dahulu!');
    return;
  }

  AppState.student.name = nameInput;
  AppState.student.className = classInput;

  // Nilai default untuk NISN, Sekolah, & Avatar agar profil dan sertifikat tetap lengkap & rapi
  if (!AppState.student.nisn) {
    AppState.student.nisn = '2026' + Math.floor(1000 + Math.random() * 9000);
  }
  if (!AppState.student.school) {
    AppState.student.school = 'SMA Negeri (Laboratorium Virtual Kimia)';
  }
  if (!AppState.student.avatar) {
    AppState.student.avatar = 'avatar1';
  }
  AppState.student.isLoggedIn = true;

  // Persist to localStorage
  saveStudentSession();

  // Animate Entrance
  const loginOverlay = document.getElementById('login-screen');
  if (loginOverlay) {
    loginOverlay.classList.remove('active');
  }

  updateNavbarStudentUI();
  updateCertificateUI();
  playWebAudioTone('victory');
  showAppNotification(`Selamat datang di ChemLab 3D, ${AppState.student.name}!`);
}

function selectAvatar(avatarKey) {
  AppState.student.avatar = avatarKey;
  document.querySelectorAll('#avatar-selector .avatar-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  const selectedElem = document.querySelector(`#avatar-selector [data-avatar="${avatarKey}"]`);
  if (selectedElem) selectedElem.classList.add('selected');
  playWebAudioTone('click');
}

function getAvatarEmoji(avatarKey) {
  switch (avatarKey) {
    case 'avatar1': return '👩‍🔬';
    case 'avatar2': return '👨‍🔬';
    case 'avatar3': return '🧑‍🔬';
    case 'avatar4': return '👩‍🎓';
    default: return '👩‍🔬';
  }
}

function updateNavbarStudentUI() {
  const s = AppState.student;
  const nameDisp = document.getElementById('user-display-name');
  const classDisp = document.getElementById('user-display-class');
  const avatarDisp = document.getElementById('user-display-avatar');

  if (nameDisp) nameDisp.textContent = s.name.split(' ')[0] || s.name;
  if (classDisp) classDisp.textContent = s.className;
  if (avatarDisp) avatarDisp.textContent = getAvatarEmoji(s.avatar);

  updateLKPDStudentInfo();
}

function saveStudentSession() {
  localStorage.setItem('chemlab_student_profile', JSON.stringify(AppState.student));
}

function logoutStudent() {
  if (confirm('Apakah Anda ingin keluar dan mengganti profil siswa?')) {
    localStorage.removeItem('chemlab_student_profile');
    location.reload();
  }
}

function showUserProfileModal() {
  const s = AppState.student;
  document.getElementById('prof-modal-name').textContent = s.name;
  document.getElementById('prof-modal-nisn').textContent = s.nisn;
  document.getElementById('prof-modal-class').textContent = s.className;
  document.getElementById('prof-modal-school').textContent = s.school;
  document.getElementById('prof-modal-score').textContent = s.quizScore !== null ? `${s.quizScore} / 100` : 'Belum Mengerjakan';
  document.getElementById('profile-modal-avatar').textContent = getAvatarEmoji(s.avatar);

  const modal = document.getElementById('profile-modal');
  if (modal) modal.classList.add('active');
}

function closeUserProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.classList.remove('active');
}

/* ==========================================================================
   2. CARTOON APD DRESS-UP LAB AIRLOCK ENTRANCE CHECK
   ========================================================================== */

function toggleSafetyGear(gearKey) {
  const g = AppState.apdGear;
  g[gearKey] = !g[gearKey];

  // Update Cartoon Avatar Rig Elements
  const rigCoat = document.getElementById('rig-coat');
  const rigGoggles = document.getElementById('rig-goggles');
  const rigMask = document.getElementById('rig-mask');
  const rigGloveL = document.getElementById('rig-glove-left');
  const rigGloveR = document.getElementById('rig-glove-right');
  const rigShoeL = document.getElementById('rig-shoe-left');
  const rigShoeR = document.getElementById('rig-shoe-right');

  // Update Left/Right Gear Card States
  const gearCard = document.getElementById(`gear-${gearKey}`);
  if (gearCard) {
    if (g[gearKey]) {
      gearCard.classList.add('equipped');
    } else {
      gearCard.classList.remove('equipped');
    }
  }

  // Update Rig Parts
  if (gearKey === 'coat' && rigCoat) rigCoat.classList.toggle('equipped', g.coat);
  if (gearKey === 'goggles' && rigGoggles) rigGoggles.classList.toggle('equipped', g.goggles);
  if (gearKey === 'mask' && rigMask) rigMask.classList.toggle('equipped', g.mask);
  if (gearKey === 'gloves') {
    if (rigGloveL) rigGloveL.classList.toggle('equipped', g.gloves);
    if (rigGloveR) rigGloveR.classList.toggle('equipped', g.gloves);
  }
  if (gearKey === 'shoes') {
    if (rigShoeL) rigShoeL.classList.toggle('equipped', g.shoes);
    if (rigShoeR) rigShoeR.classList.toggle('equipped', g.shoes);
  }

  playWebAudioTone(g[gearKey] ? 'equip' : 'unequip');
  updateAPDProgressUI();
}

function equipAllGear() {
  const keys = ['coat', 'goggles', 'mask', 'gloves', 'shoes'];
  keys.forEach(k => {
    AppState.apdGear[k] = false;
    toggleSafetyGear(k);
  });
  playWebAudioTone('victory');
  showAppNotification('Semua APD lengkap dipakai! Kartun siap memasuki laboratorium.');
}

function resetAllGear() {
  const keys = ['coat', 'goggles', 'mask', 'gloves', 'shoes'];
  keys.forEach(k => {
    if (AppState.apdGear[k]) {
      toggleSafetyGear(k);
    }
  });
  showAppNotification('Semua perlengkapan APD dilepas.');
}

function updateAPDProgressUI() {
  const g = AppState.apdGear;
  let equippedCount = 0;
  if (g.coat) equippedCount++;
  if (g.goggles) equippedCount++;
  if (g.mask) equippedCount++;
  if (g.gloves) equippedCount++;
  if (g.shoes) equippedCount++;

  const pct = (equippedCount / 5) * 100;

  const pctText = document.getElementById('apd-percentage-text');
  const statusText = document.getElementById('apd-status-text');
  const circle = document.getElementById('apd-progress-circle');
  const enterBtn = document.getElementById('btn-enter-lab');
  const lockIcon = document.getElementById('enter-lab-lock-icon');
  const caption = document.getElementById('cartoon-caption');

  if (pctText) pctText.textContent = `${pct}%`;
  if (circle) {
    circle.style.background = `conic-gradient(var(--emerald) ${pct * 3.6}deg, rgba(255, 255, 255, 0.08) ${pct * 3.6}deg)`;
  }

  if (pct === 100) {
    if (statusText) statusText.textContent = 'APD 100% Lengkap! Izin Masuk Lab Diberikan.';
    if (enterBtn) {
      enterBtn.disabled = false;
      enterBtn.innerHTML = `<i class="fa-solid fa-door-open"></i> Masuk Laboratorium Kimia`;
    }
    if (caption) {
      caption.innerHTML = `<i class="fa-solid fa-circle-check color-emerald"></i> Praktikan Siap Masuk! Pintu Gerbang Terbuka!`;
    }
    // Trigger Scanner laser line
    const scanner = document.getElementById('door-scanner');
    if (scanner) scanner.classList.add('active');
  } else {
    if (statusText) statusText.textContent = `Lengkapi ${5 - equippedCount} perlengkapan APD lagi untuk membuka pintu lab.`;
    if (enterBtn) {
      enterBtn.disabled = true;
      enterBtn.innerHTML = `<i class="fa-solid fa-lock" id="enter-lab-lock-icon"></i> Pintu Lab Terkunci (${pct}%)`;
    }
    if (caption) {
      caption.innerHTML = `<i class="fa-solid fa-info-circle"></i> Klik APD untuk memakaikannya ke avatar praktikan!`;
    }
    const scanner = document.getElementById('door-scanner');
    if (scanner) scanner.classList.remove('active');
  }
}

function tryEnterLaboratory() {
  if (AppState.apdGear.coat && AppState.apdGear.goggles && AppState.apdGear.mask && AppState.apdGear.gloves && AppState.apdGear.shoes) {
    // Open Airlock Sliding Doors Animation
    const doors = document.getElementById('airlock-doors');
    if (doors) {
      doors.classList.add('open');
      playWebAudioTone('airlock');
    }

    setTimeout(() => {
      switchTab('materi');
      showAppNotification('Selamat datang di Laboratorium Kimia 3D! Jelajahi alat-alat dengan 3D/AR/VR.');
    }, 800);
  } else {
    showAppNotification('Pintu terkunci! Pastikan seluruh 5 APD telah terpasang.');
    playWebAudioTone('beep');
  }
}

/* ==========================================================================
   3. WEB AUDIO API SYNTHESIZER (PROCEDURAL ZERO-DEPENDENCY SFX)
   ========================================================================== */

function initWebAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    AppState.audio.ctx = new AudioContext();
  } catch (e) {
    console.warn('Web Audio API not supported on this browser.');
  }
}

function playWebAudioTone(type) {
  if (!AppState.audio.enabled) return;
  if (!AppState.audio.ctx) initWebAudio();
  const ctx = AppState.audio.ctx;
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'equip':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
      break;

    case 'unequip':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'drip':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case 'victory':
      // Arpeggio Fanfare
      playChord([523.25, 659.25, 783.99, 1046.50]); // C5, E5, G5, C6
      break;

    case 'beep':
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'airlock':
      // Low cinematic sci-fi woosh
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;

    case 'ignite':
      osc.type = 'noise' in osc ? 'noise' : 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'bubble':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      break;

    case 'hum':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    default:
      break;
  }
}

function playChord(freqs) {
  if (!AppState.audio.ctx) return;
  const ctx = AppState.audio.ctx;
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const startT = ctx.currentTime + i * 0.08;
    o.frequency.setValueAtTime(f, startT);
    g.gain.setValueAtTime(0.18, startT);
    g.gain.exponentialRampToValueAtTime(0.01, startT + 0.35);
    o.start(startT);
    o.stop(startT + 0.35);
  });
}

function toggleAudio() {
  AppState.audio.enabled = !AppState.audio.enabled;
  const icon = document.getElementById('sound-icon');
  if (icon) {
    if (AppState.audio.enabled) {
      icon.className = 'fa-solid fa-volume-high';
      showAppNotification('Efek suara diaktifkan.');
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      showAppNotification('Efek suara dimatikan.');
    }
  }
}

function showAppNotification(msg) {
  const toast = document.getElementById('sound-toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fa-solid fa-flask color-cyan"></i> <span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   4. NAVIGATION & GHS HAZARD SYMBOLS
   ========================================================================== */

function switchTab(tabId) {
  AppState.currentTab = tabId;

  // Update Nav buttons
  document.querySelectorAll('.navbar .nav-item').forEach(item => item.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update Tab Views
  document.querySelectorAll('.tab-page').forEach(tab => tab.classList.remove('active'));
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');

  // Trigger resize on 3D canvas if navigating to materi
  if (tabId === 'materi' && typeof onWindowResize3D === 'function') {
    setTimeout(onWindowResize3D, 80);
  }

  // Update Certificate if navigating to sertifikat
  if (tabId === 'sertifikat') {
    updateCertificateUI();
  }

  // Update Teacher Dashboard if navigating to guru
  if (tabId === 'guru') {
    initTeacherDashboard();
  }

  playWebAudioTone('click');
}

function switchMateriSubTab(subKey) {
  AppState.materiSubTab = subKey;
  document.querySelectorAll('.sub-nav-buttons .sub-nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-sub-${subKey}`).classList.add('active');

  document.querySelectorAll('.materi-sub-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`materi-sub-${subKey}`).classList.add('active');

  if (subKey === 'alat' && typeof onWindowResize3D === 'function') {
    setTimeout(onWindowResize3D, 80);
  }
  playWebAudioTone('click');
}

function renderGHSSymbols() {
  const container = document.getElementById('ghs-symbols-container');
  if (!container) return;
  container.innerHTML = '';

  GHSData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'ghs-card';
    card.onclick = () => {
      card.classList.toggle('flipped');
      playWebAudioTone('click');
    };

    card.innerHTML = `
      <div class="ghs-card-inner">
        <div class="ghs-front">
          <div class="ghs-symbol-diamond">
            <i class="fa-solid ${item.icon}"></i>
          </div>
          <h4>${item.name}</h4>
          <span>Klik kartu untuk melihat SOP & Contoh Zat</span>
        </div>
        <div class="ghs-back">
          <div>
            <h5><i class="fa-solid fa-triangle-exclamation"></i> ${item.name}</h5>
            <p>${item.meaning}</p>
            <strong>Contoh Bahan Kimia:</strong>
            <p>${item.examples}</p>
          </div>
          <div>
            <strong>SOP Penanganan:</strong>
            <p>${item.sop}</p>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ==========================================================================
   5. VIDEO BERBASIS PROBLEM BASED LEARNING (PBL)
   ========================================================================== */

function jumpPBLPhase(phaseNum) {
  AppState.pblCurrentPhase = phaseNum;
  for (let i = 1; i <= 5; i++) {
    const node = document.getElementById(`pbl-node-${i}`);
    if (node) {
      if (i <= phaseNum) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    }
  }
  playWebAudioTone('click');
}

function loadPBLVideo(youtubeId = 'VoTqIij5HHs', title = 'Pengenalan & Penggunaan Alat Laboratorium Kimia', startTime = 9) {
  const iframe = document.getElementById('pbl-youtube-iframe');
  const titleDisp = document.getElementById('video-current-title');
  if (iframe) {
    const startParam = startTime ? `&start=${startTime}` : '';
    iframe.src = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0${startParam}`;
  }
  if (titleDisp) {
    titleDisp.textContent = title;
  }
  jumpPBLPhase(3); // Advance to Phase 3 (Video Exploration)
  showAppNotification(`Video PBL dimuat: ${title}`);
}

function loadPBLData() {
  updateLKPDStudentInfo();

  // Restore saved LKPD answers
  const saved = localStorage.getItem('chemlab_lkpd_data');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const q1El = document.getElementById('pbl-q1');
      const q2El = document.getElementById('pbl-q2');
      const q3El = document.getElementById('pbl-q3');
      if (q1El && data.q1) q1El.value = data.q1;
      if (q2El && data.q2) q2El.value = data.q2;
      if (q3El && data.q3) q3El.value = data.q3;

      const status = document.getElementById('lkpd-save-status');
      if (status && data.savedAt) {
        const timeStr = new Date(data.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        status.innerHTML = `
          <div class="lkpd-saved-alert">
            <i class="fa-solid fa-circle-check"></i>
            <span>Jawaban LKPD Anda tersimpan pada pukul ${timeStr}.</span>
          </div>
        `;
      }
    } catch (e) {
      console.warn('Error reading LKPD data:', e);
    }
  }
  updateLKPDProgress();
}

function updateLKPDStudentInfo() {
  const s = AppState.student;
  const nameEl = document.getElementById('lkpd-student-name');
  const classEl = document.getElementById('lkpd-student-class');
  const schoolEl = document.getElementById('lkpd-student-school');
  const dateEl = document.getElementById('lkpd-date');

  if (nameEl) nameEl.textContent = s.name || 'Siswa Kimia';
  if (classEl) classEl.textContent = s.className || 'Kelas X';
  if (schoolEl) schoolEl.textContent = s.school || 'SMAN 1 Abung Tinggi';
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

function updateLKPDProgress() {
  const q1 = document.getElementById('pbl-q1') ? document.getElementById('pbl-q1').value.trim() : '';
  const q2 = document.getElementById('pbl-q2') ? document.getElementById('pbl-q2').value.trim() : '';
  const q3 = document.getElementById('pbl-q3') ? document.getElementById('pbl-q3').value.trim() : '';

  let count = 0;
  if (q1.length > 5) count++;
  if (q2.length > 5) count++;
  if (q3.length > 5) count++;

  const pct = Math.round((count / 3) * 100);
  const progressBar = document.getElementById('lkpd-progress-fill');
  const progressText = document.getElementById('lkpd-progress-text');
  const progressBadge = document.getElementById('lkpd-status-pill');

  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${pct}% Terisi (${count}/3 Fase Selesai)`;
  if (progressBadge) {
    if (count === 3) {
      progressBadge.className = 'lkpd-status-pill completed';
      progressBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> 3/3 Fase Siap Divalidasi';
    } else if (count > 0) {
      progressBadge.className = 'lkpd-status-pill in-progress';
      progressBadge.innerHTML = `<i class="fa-solid fa-pen"></i> ${count}/3 Fase Terisi`;
    } else {
      progressBadge.className = 'lkpd-status-pill pending';
      progressBadge.innerHTML = '<i class="fa-solid fa-clock"></i> Belum Diisi';
    }
  }
}

function insertLKPDHint(fieldId, text) {
  const textarea = document.getElementById(fieldId);
  if (!textarea) return;
  const currentVal = textarea.value.trim();
  if (!currentVal) {
    textarea.value = text;
  } else if (!currentVal.includes(text)) {
    textarea.value = currentVal + '\n• ' + text;
  }
  textarea.focus();
  updateLKPDProgress();
  playWebAudioTone('click');
  showAppNotification('Ide konsep berhasil ditambahkan ke lembar kerja.');
}

function toggleLKPDFocusMode() {
  const layout = document.querySelector('.pbl-content-layout');
  const btn = document.getElementById('lkpd-expand-btn');
  if (layout) {
    layout.classList.toggle('lkpd-focus-mode');
    const isFocus = layout.classList.contains('lkpd-focus-mode');
    if (btn) {
      btn.innerHTML = isFocus 
        ? '<i class="fa-solid fa-compress"></i> <span>Tampilkan Video</span>' 
        : '<i class="fa-solid fa-expand"></i> <span>Fokus LKPD</span>';
    }
    showAppNotification(isFocus ? 'Mode Fokus LKPD Diaktifkan' : 'Tampilan Normal Diaktifkan');
  }
}

function savePBLAnswers() {
  const q1 = document.getElementById('pbl-q1') ? document.getElementById('pbl-q1').value.trim() : '';
  const q2 = document.getElementById('pbl-q2') ? document.getElementById('pbl-q2').value.trim() : '';
  const q3 = document.getElementById('pbl-q3') ? document.getElementById('pbl-q3').value.trim() : '';

  if (!q1 || !q2 || !q3) {
    alert('Mohon lengkapi seluruh analisis (Fase 1, Fase 2, dan Fase 3) sebelum menyimpan LKPD!');
    return;
  }

  const lkpdData = { q1, q2, q3, savedAt: new Date().toISOString() };
  localStorage.setItem('chemlab_lkpd_data', JSON.stringify(lkpdData));

  if (typeof recordStudentLKPDToTeacher === 'function') {
    recordStudentLKPDToTeacher(AppState.student, lkpdData);
  }

  jumpPBLPhase(4);
  updateLKPDProgress();

  const status = document.getElementById('lkpd-save-status');
  if (status) {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    status.innerHTML = `
      <div class="lkpd-saved-alert">
        <i class="fa-solid fa-circle-check"></i>
        <span><strong>Berhasil Disimpan!</strong> Analisis investigasi LKPD Anda telah tervalidasi pada pukul ${timeStr}.</span>
      </div>
    `;
  }

  // Trigger celebration confetti
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  }

  playWebAudioTone('victory');
  showAppNotification('LKPD Berbasis Masalah berhasil divalidasi dan disimpan!');
}

function resetLKPDForm() {
  if (confirm('Apakah Anda yakin ingin mengosongkan kembali seluruh isian Lembar LKPD ini?')) {
    const q1 = document.getElementById('pbl-q1');
    const q2 = document.getElementById('pbl-q2');
    const q3 = document.getElementById('pbl-q3');
    if (q1) q1.value = '';
    if (q2) q2.value = '';
    if (q3) q3.value = '';
    localStorage.removeItem('chemlab_lkpd_data');
    updateLKPDProgress();
    const status = document.getElementById('lkpd-save-status');
    if (status) status.innerHTML = '';
    showAppNotification('Lembar isian LKPD telah direset.');
  }
}

function printLKPDReport() {
  window.print();
}

function downloadLKPDReport() {
  const s = AppState.student;
  const q1 = document.getElementById('pbl-q1') ? document.getElementById('pbl-q1').value : '';
  const q2 = document.getElementById('pbl-q2') ? document.getElementById('pbl-q2').value : '';
  const q3 = document.getElementById('pbl-q3') ? document.getElementById('pbl-q3').value : '';

  const content = `================================================================================
LEMBAR KERJA PESERTA DIDIK (LKPD) DIGITAL - PROBLEM BASED LEARNING (PBL)
MEDIA LABORATORIUM VIRTUAL KIMIA 3D (CHEMLAB 3D)
================================================================================
IDENTITAS PRAKTIKAN:
- Nama Praktikan : ${s.name}
- NIS / NISN     : ${s.nisn || '-'}
- Kelas / Fase   : ${s.className}
- Nama Sekolah   : ${s.school}
- Tanggal Simpan : ${new Date().toLocaleString('id-ID')}
--------------------------------------------------------------------------------
SKENARIO KASUS INVESTIGASI LABORATORIUM:
Kasus Insiden Letupan & Tumpahan Larutan pada Pengenceran Asam Sulfat Pekat (H2SO4 98%)
Praktikan tidak memakai sarung tangan nitril maupun goggles, mengukur volume 10 mL 
asam menggunakan gelas beker besar dan bukan pipet ukur presisi, serta menuangkan 
air langsung ke dalam asam pekat sehingga memicu pelepasan panas eksotermik dahsyat.
--------------------------------------------------------------------------------
HASIL ANALISIS INVESTIGASI SISWA:

[FASE 1: Identifikasi Pelanggaran K3 & Kesalahan Prosedural]
${q1 || '(Belum diisi)'}

[FASE 2: Pemilihan Alat Laboratorium Presisi & Prosedur Penanganan]
${q2 || '(Belum diisi)'}

[FASE 3: Standar Operasional Prosedur (SOP) & Tanggap Darurat P3K]
${q3 || '(Belum diisi)'}
================================================================================
Tervalidasi secara digital oleh Sistem Laboratorium Virtual ChemLab 3D.
================================================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LKPD_PBL_Kimia_${(s.name || 'Siswa').replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showAppNotification('Berkas laporan LKPD berhasil diunduh.');
}

/* ==========================================================================
   6. KUIS EVALUASI INTERAKTIF DENGAN TIMER & CONFETTI
   ========================================================================== */

function startQuiz() {
  const q = AppState.quiz;
  q.questions = [...QuizQuestionBank];
  q.currentIndex = 0;
  q.answers = {};
  q.score = 0;
  q.isCompleted = false;
  q.timeRemaining = 600;

  // Toggle DOM Cards
  document.getElementById('quiz-lobby-card').style.display = 'none';
  document.getElementById('quiz-result-card').style.display = 'none';
  document.getElementById('quiz-active-card').style.display = 'block';

  // Start Timer
  clearInterval(q.timerInterval);
  q.timerInterval = setInterval(quizTimerTick, 1000);

  loadQuizQuestion(0);
  playWebAudioTone('click');
}

function quizTimerTick() {
  const q = AppState.quiz;
  q.timeRemaining--;

  const mins = Math.floor(q.timeRemaining / 60);
  const secs = q.timeRemaining % 60;
  const disp = document.getElementById('quiz-time-left');
  if (disp) {
    disp.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (q.timeRemaining <= 0) {
    clearInterval(q.timerInterval);
    finishQuiz();
  }
}

function loadQuizQuestion(index) {
  const q = AppState.quiz;
  q.currentIndex = index;
  const item = q.questions[index];

  // Update Counter and Progress Bar
  document.getElementById('quiz-question-counter').textContent = `Soal ${index + 1} / ${q.questions.length}`;
  document.getElementById('quiz-question-topic').textContent = item.topic;
  const progressPct = ((index + 1) / q.questions.length) * 100;
  document.getElementById('quiz-progress-fill').style.width = `${progressPct}%`;

  // Question Text
  document.getElementById('quiz-question-text').textContent = item.question;

  // Options
  const container = document.getElementById('quiz-options-container');
  container.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];
  const hasAnswered = q.answers[index] !== undefined;

  item.options.forEach((optText, optIdx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.disabled = hasAnswered;

    if (hasAnswered) {
      if (optIdx === item.answer) {
        btn.classList.add('correct');
      } else if (optIdx === q.answers[index]) {
        btn.classList.add('wrong');
      }
    }

    btn.innerHTML = `
      <span class="opt-label">${labels[optIdx]}</span>
      <span>${optText}</span>
    `;

    btn.onclick = () => selectQuizAnswer(index, optIdx);
    container.appendChild(btn);
  });

  // Explanation Box
  const expBox = document.getElementById('quiz-explanation-box');
  const expStatus = document.getElementById('exp-status-header');
  const expText = document.getElementById('exp-text');

  if (hasAnswered) {
    expBox.style.display = 'block';
    const isCorrect = q.answers[index] === item.answer;
    if (isCorrect) {
      expStatus.innerHTML = `<i class="fa-solid fa-circle-check color-emerald"></i> <strong>Jawaban Anda Benar!</strong>`;
      expBox.style.borderLeftColor = 'var(--emerald)';
    } else {
      expStatus.innerHTML = `<i class="fa-solid fa-circle-xmark color-red"></i> <strong>Jawaban Anda Kurang Tepat!</strong>`;
      expBox.style.borderLeftColor = 'var(--red)';
    }
    expText.textContent = item.explanation;
  } else {
    expBox.style.display = 'none';
  }

  // Footer Buttons
  const prevBtn = document.getElementById('btn-quiz-prev');
  const nextBtn = document.getElementById('btn-quiz-next');
  const finishBtn = document.getElementById('btn-quiz-finish');

  prevBtn.disabled = index === 0;

  if (index === q.questions.length - 1) {
    nextBtn.style.display = 'none';
    finishBtn.style.display = 'inline-flex';
  } else {
    nextBtn.style.display = 'inline-flex';
    finishBtn.style.display = 'none';
  }
}

function selectQuizAnswer(questionIdx, selectedIdx) {
  const q = AppState.quiz;
  q.answers[questionIdx] = selectedIdx;

  const item = q.questions[questionIdx];
  const isCorrect = selectedIdx === item.answer;

  if (isCorrect) {
    playWebAudioTone('victory');
  } else {
    playWebAudioTone('beep');
  }

  loadQuizQuestion(questionIdx);
}

function nextQuizQuestion() {
  const q = AppState.quiz;
  if (q.currentIndex < q.questions.length - 1) {
    loadQuizQuestion(q.currentIndex + 1);
    playWebAudioTone('click');
  }
}

function prevQuizQuestion() {
  const q = AppState.quiz;
  if (q.currentIndex > 0) {
    loadQuizQuestion(q.currentIndex - 1);
    playWebAudioTone('click');
  }
}

/**
 * Menghitung predikat evaluasi kuis sesuai standar kelulusan laboratorium:
 * - Nilai < 75 : Belum Lulus (Remedial)
 * - Nilai 75 - 90 (dan < 100) : Memuaskan
 * - Nilai 100 : Sangat Memuaskan
 */
function getQuizPredicate(score) {
  const num = typeof score === 'number' ? score : parseInt(score, 10);
  if (isNaN(num)) {
    return {
      key: 'satisfactory',
      predicate: 'Memuaskan',
      predicateUpper: 'MEMUASKAN',
      statusText: 'LULUS',
      isPassed: true,
      cssClass: 'predicate-satisfactory',
      badgeClass: 'predicate-satisfactory',
      iconHtml: '<i class="fa-solid fa-medal"></i>',
      badgeText: 'Predikat: Memuaskan',
      sealText: 'VERIFIED',
      titleText: 'SERTIFIKAT KELULUSAN',
      statementText: 'Telah menyelesaikan dengan predikat <strong id="cert-predicate-highlight" class="cert-pred-highlight predicate-satisfactory">MEMUASKAN</strong> seluruh rangkaian kompetensi pembelajaran laboratorium virtual kimia meliputi: <em>Pengenalan Alat-Alat Kimia 3D, Protokol Keselamatan Kerja & Simbol GHS, Simulasi Praktikum Titrasi Asam-Basa, Problem-Based Learning (PBL)</em>, serta dinyatakan <strong id="cert-result-status" style="color:#059669;">LULUS</strong> dalam Kuis Evaluasi Kimia dengan nilai:'
    };
  }

  if (num < 75) {
    return {
      key: 'failed',
      predicate: 'Belum Lulus',
      predicateUpper: 'BELUM LULUS',
      statusText: 'BELUM LULUS (REMEDIAL)',
      isPassed: false,
      cssClass: 'predicate-failed',
      badgeClass: 'predicate-failed',
      iconHtml: '<i class="fa-solid fa-circle-xmark"></i>',
      badgeText: 'Predikat: Belum Lulus',
      sealText: 'REMEDIAL',
      titleText: 'SURAT KETERANGAN EVALUASI KUIS',
      statementText: 'Telah mengikuti kuis evaluasi laboratorium virtual kimia dengan capaian <strong id="cert-predicate-highlight" class="cert-pred-highlight predicate-failed">BELUM LULUS</strong>, serta dinyatakan <strong id="cert-result-status" style="color:#dc2626;">BELUM MEMENUHI KKM</strong> dalam Kuis Evaluasi Kimia (batas kelulusan minimal 75). Siswa disarankan mempelajari kembali modul 3D & K3 dan mengikuti remedial kuis dengan perolehan nilai:'
    };
  } else if (num < 100) {
    return {
      key: 'satisfactory',
      predicate: 'Memuaskan',
      predicateUpper: 'MEMUASKAN',
      statusText: 'LULUS',
      isPassed: true,
      cssClass: 'predicate-satisfactory',
      badgeClass: 'predicate-satisfactory',
      iconHtml: '<i class="fa-solid fa-medal"></i>',
      badgeText: 'Predikat: Memuaskan',
      sealText: 'VERIFIED',
      titleText: 'SERTIFIKAT KELULUSAN',
      statementText: 'Telah menyelesaikan dengan predikat <strong id="cert-predicate-highlight" class="cert-pred-highlight predicate-satisfactory">MEMUASKAN</strong> seluruh rangkaian kompetensi pembelajaran laboratorium virtual kimia meliputi: <em>Pengenalan Alat-Alat Kimia 3D, Protokol Keselamatan Kerja & Simbol GHS, Simulasi Praktikum Titrasi Asam-Basa, Problem-Based Learning (PBL)</em>, serta dinyatakan <strong id="cert-result-status" style="color:#059669;">LULUS</strong> dalam Kuis Evaluasi Kimia dengan nilai:'
    };
  } else {
    // num >= 100
    return {
      key: 'excellent',
      predicate: 'Sangat Memuaskan',
      predicateUpper: 'SANGAT MEMUASKAN',
      statusText: 'LULUS DENGAN PUJIAN (SEMPURNA)',
      isPassed: true,
      cssClass: 'predicate-excellent',
      badgeClass: 'predicate-excellent',
      iconHtml: '<i class="fa-solid fa-crown"></i>',
      badgeText: 'Predikat: Sangat Memuaskan (Nilai 100)',
      sealText: 'EXCELLENT 100',
      titleText: 'SERTIFIKAT KELULUSAN TERBAIK',
      statementText: 'Telah menyelesaikan dengan predikat <strong id="cert-predicate-highlight" class="cert-pred-highlight predicate-excellent">SANGAT MEMUASKAN</strong> seluruh rangkaian kompetensi pembelajaran laboratorium virtual kimia meliputi: <em>Pengenalan Alat-Alat Kimia 3D, Protokol Keselamatan Kerja & Simbol GHS, Simulasi Praktikum Titrasi Asam-Basa, Problem-Based Learning (PBL)</em>, serta dinyatakan <strong id="cert-result-status" style="color:#d97706;">LULUS SEMPURNA DENGAN PUJIAN</strong> dalam Kuis Evaluasi Kimia dengan nilai istimewa:'
    };
  }
}

function finishQuiz() {
  const q = AppState.quiz;
  clearInterval(q.timerInterval);
  q.isCompleted = true;

  // Calculate Score
  let correctCount = 0;
  q.questions.forEach((item, idx) => {
    if (q.answers[idx] === item.answer) {
      correctCount++;
    }
  });

  const finalScore = Math.round((correctCount / q.questions.length) * 100);
  q.score = finalScore;

  // Save to Student Profile
  AppState.student.quizScore = finalScore;
  AppState.student.quizPassed = finalScore >= 75;
  saveStudentSession();

  const predInfo = getQuizPredicate(finalScore);

  // Record to Teacher Submissions & Auto-sync to Google Apps Script
  if (typeof recordStudentQuizToTeacher === 'function') {
    recordStudentQuizToTeacher(AppState.student, finalScore, predInfo);
  }

  // Show Result Card
  document.getElementById('quiz-active-card').style.display = 'none';
  document.getElementById('quiz-result-card').style.display = 'block';

  document.getElementById('result-final-score').textContent = finalScore;
  document.getElementById('res-correct-count').textContent = `${correctCount} Benar`;
  document.getElementById('res-wrong-count').textContent = `${q.questions.length - correctCount} Salah`;

  const timeUsed = 600 - q.timeRemaining;
  const m = Math.floor(timeUsed / 60);
  const s = timeUsed % 60;
  document.getElementById('res-time-spent').textContent = `${m}m ${s}s`;

  const title = document.getElementById('result-status-title');
  const sub = document.getElementById('result-status-subtitle');
  const trophy = document.getElementById('result-trophy-icon');
  const predPill = document.getElementById('result-predicate-pill');
  const claimBtn = document.getElementById('btn-claim-cert');

  if (predPill) {
    predPill.className = `badge-predicate-pill ${predInfo.cssClass}`;
    predPill.innerHTML = `${predInfo.iconHtml} <span>${predInfo.badgeText}</span>`;
  }

  if (finalScore >= 100) {
    title.textContent = 'Luar Biasa! Nilai Sempurna 100!';
    sub.textContent = 'Selamat! Anda meraih nilai sempurna 100 dengan Predikat Sangat Memuaskan. Sertifikat Kehormatan Kelulusan resmi Anda telah aktif dengan predikat tertinggi!';
    trophy.textContent = '👑';
    if (claimBtn) {
      claimBtn.className = 'btn btn-emerald btn-glow';
      claimBtn.innerHTML = '<i class="fa-solid fa-crown"></i> Klaim Sertifikat Sangat Memuaskan';
    }
    triggerConfetti();
    playWebAudioTone('victory');
  } else if (finalScore >= 75) {
    title.textContent = 'Selamat! Anda Dinyatakan LULUS Praktikum!';
    sub.textContent = `Nilai Anda (${finalScore}) memenuhi Standar Kompetensi KKM (>= 75) dengan Predikat Memuaskan. Sertifikat Kelulusan Resmi Anda kini telah aktif!`;
    trophy.textContent = '🏆';
    if (claimBtn) {
      claimBtn.className = 'btn btn-emerald btn-glow';
      claimBtn.innerHTML = '<i class="fa-solid fa-award"></i> Klaim Sertifikat Kelulusan';
    }
    triggerConfetti();
    playWebAudioTone('victory');
  } else {
    title.textContent = 'Belum Memenuhi KKM (Nilai < 75)';
    sub.textContent = `Nilai kuis Anda (${finalScore}) berpredikat Belum Lulus (batas minimal KKM 75). Silakan pelajari kembali materi modul 3D & K3, lalu ulangi kuis untuk mendapatkan sertifikat kelulusan!`;
    trophy.textContent = '📚';
    if (claimBtn) {
      claimBtn.className = 'btn btn-outline';
      claimBtn.innerHTML = '<i class="fa-solid fa-file-circle-exclamation"></i> Pratinjau Sertifikat / Remedial';
    }
    playWebAudioTone('beep');
  }

  updateCertificateUI();
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);
  }
}

/* ==========================================================================
   7. STUDENT REFLECTION JOURNAL (3-2-1 MODEL)
   ========================================================================== */

function setRating(val) {
  AppState.reflection.rating = val;
  document.getElementById('reflection-rating-val').value = val;

  const stars = document.querySelectorAll('#star-rating-group .star-item');
  stars.forEach((star, idx) => {
    if (idx < val) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
  playWebAudioTone('click');
}

function saveStudentReflection() {
  const form = document.getElementById('reflection-form');
  const selectedMood = form.querySelector('input[name="mood"]:checked')?.value || 'Sangat Antusias';
  const rating = parseInt(document.getElementById('reflection-rating-val').value) || 5;
  const q1 = document.getElementById('ref-prompt-1').value.trim();
  const q2 = document.getElementById('ref-prompt-2').value.trim();
  const q3 = document.getElementById('ref-prompt-3').value.trim();

  if (!q1 || !q2 || !q3) {
    alert('Mohon lengkapi seluruh pertanyaan refleksi 3-2-1!');
    return;
  }

  AppState.reflection = {
    mood: selectedMood,
    rating,
    q1,
    q2,
    q3,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem('chemlab_student_reflection', JSON.stringify(AppState.reflection));

  if (typeof recordStudentReflectionToTeacher === 'function') {
    recordStudentReflectionToTeacher(AppState.student, AppState.reflection);
  }

  // Render Saved Preview
  renderSavedJournal();
  playWebAudioTone('victory');
  showAppNotification('Jurnal refleksi siswa berhasil disimpan.');
}

function renderSavedJournal() {
  const container = document.getElementById('saved-journal-content');
  const r = AppState.reflection;
  if (!container || !r.q1) return;

  container.innerHTML = `
    <div class="saved-journal-box">
      <div class="journal-meta-row" style="display:flex; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.5rem;">
        <span><strong>Perasaan:</strong> ${r.mood}</span>
        <span class="color-gold">Rating: ${'★'.repeat(r.rating)}</span>
      </div>
      <div style="margin-bottom:1rem;">
        <h5 style="color:#38bdf8; font-size:0.85rem; margin-bottom:0.2rem;">3 Hal Baru yang Dipelajari:</h5>
        <p style="font-size:0.82rem; color:#cbd5e1; white-space:pre-line;">${r.q1}</p>
      </div>
      <div style="margin-bottom:1rem;">
        <h5 style="color:#f59e0b; font-size:0.85rem; margin-bottom:0.2rem;">2 Hal Paling Menantang:</h5>
        <p style="font-size:0.82rem; color:#cbd5e1; white-space:pre-line;">${r.q2}</p>
      </div>
      <div style="margin-bottom:1rem;">
        <h5 style="color:#10b981; font-size:0.85rem; margin-bottom:0.2rem;">1 Komitmen Aksi Nyata di Lab Sekolah:</h5>
        <p style="font-size:0.82rem; color:#cbd5e1; white-space:pre-line;">${r.q3}</p>
      </div>
      <div style="font-size:0.7rem; color:#64748b; text-align:right;">
        Tersimpan pada: ${new Date(r.savedAt).toLocaleString('id-ID')}
      </div>
    </div>
  `;
}

function printReflectionJournal() {
  window.print();
}

/* ==========================================================================
   8. OFFICIAL CERTIFICATE GENERATOR WITH DYNAMIC QR CODE & PRINT
   ========================================================================== */

function updateCertificateUI() {
  const s = AppState.student;

  const nameDisp = document.getElementById('cert-student-name-disp');
  const nisnDisp = document.getElementById('cert-student-nisn-disp');
  const classDisp = document.getElementById('cert-student-class-disp');
  const schoolDisp = document.getElementById('cert-student-school-disp');
  const scoreDisp = document.getElementById('cert-grade-score');
  const predDisp = document.getElementById('cert-grade-predicate');
  const predHighlight = document.getElementById('cert-predicate-highlight');
  const resultStatus = document.getElementById('cert-result-status');
  const statementEl = document.getElementById('cert-statement-text');
  const mainTitleEl = document.getElementById('cert-main-title-text');
  const sealTextEl = document.getElementById('cert-seal-text');
  const dateDisp = document.getElementById('cert-date-disp');
  const certNumber = document.getElementById('cert-doc-number');
  const statusBadge = document.getElementById('cert-status-badge');
  const statusDetail = document.getElementById('cert-status-detail');
  const statusIcon = document.getElementById('cert-status-icon');

  if (nameDisp) nameDisp.textContent = (s.name || 'AISYAH PUTRI').toUpperCase();
  if (nisnDisp) nisnDisp.textContent = s.nisn || '20241005';
  if (classDisp) classDisp.textContent = s.className || 'X.1';
  if (schoolDisp) schoolDisp.textContent = s.school || 'SMAN 1 Abung Tinggi';

  const today = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  if (dateDisp) dateDisp.textContent = today.toLocaleDateString('id-ID', options);

  // Doc number seeded from NISN
  if (certNumber) {
    const seed = s.nisn ? s.nisn.slice(-4) : '0892';
    certNumber.textContent = `CHEM-LAB/VIRTUAL/2026/${seed}`;
  }

  // Evaluasi apakah kuis sudah pernah diselesaikan
  const hasTakenQuiz = s.quizScore !== null && s.quizScore !== undefined;
  const currentScore = hasTakenQuiz ? s.quizScore : 85; // Skor pratinjau jika belum kuis
  const predInfo = getQuizPredicate(currentScore);

  // Update Tampilan Nilai & Predikat di Sertifikat
  if (scoreDisp) scoreDisp.textContent = `${currentScore} / 100`;

  if (predDisp) {
    predDisp.textContent = `(Predikat: ${predInfo.predicate})`;
    predDisp.className = `grade-predicate ${predInfo.cssClass}`;
  }

  if (predHighlight) {
    predHighlight.textContent = predInfo.predicateUpper;
    predHighlight.className = `cert-pred-highlight ${predInfo.cssClass}`;
  }

  if (resultStatus) {
    resultStatus.textContent = predInfo.statusText;
  }

  if (mainTitleEl) {
    mainTitleEl.textContent = predInfo.titleText;
  }

  if (sealTextEl) {
    sealTextEl.textContent = predInfo.sealText;
  }

  if (statementEl) {
    statementEl.innerHTML = predInfo.statementText;
  }

  // Banner Status di atas Sertifikat
  if (statusBadge && statusDetail) {
    if (!hasTakenQuiz) {
      statusBadge.textContent = 'Status: Pratinjau Sertifikat (Selesaikan Kuis Terlebih Dahulu)';
      statusBadge.className = 'color-amber';
      statusDetail.textContent = 'Selesaikan kuis evaluasi untuk menetapkan nilai riil, predikat (Belum Lulus, Memuaskan, atau Sangat Memuaskan), dan memvalidasi sertifikat resmi ini.';
      if (statusIcon) statusIcon.className = 'fa-solid fa-clock color-amber';
    } else if (currentScore >= 100) {
      statusBadge.textContent = 'Status: LULUS DENGAN PUJIAN - NILAI SEMPURNA 100 (SANGAT MEMUASKAN)';
      statusBadge.className = 'color-amber';
      statusDetail.textContent = 'Selamat! Anda memperoleh nilai sempurna 100/100 dengan Predikat Sangat Memuaskan. Sertifikat Kehormatan resmi Anda telah tervalidasi.';
      if (statusIcon) statusIcon.className = 'fa-solid fa-crown color-amber';
    } else if (currentScore >= 75) {
      statusBadge.textContent = 'Status: Berhak Menerima Sertifikat Resmi (LULUS - MEMUASKAN)';
      statusBadge.className = 'color-emerald';
      statusDetail.textContent = `Telah lulus kuis evaluasi dengan skor ${currentScore}/100 dan meraih Predikat Memuaskan (Standar KKM >= 75).`;
      if (statusIcon) statusIcon.className = 'fa-solid fa-shield-check color-emerald';
    } else {
      statusBadge.textContent = 'Status: Belum Lulus KKM (Perlu Remedial Kuis)';
      statusBadge.className = 'color-red';
      statusDetail.textContent = `Skor kuis Anda (${currentScore}/100) di bawah batas KKM 75 dengan Predikat Belum Lulus. Silakan ulangi kuis untuk mendapatkan sertifikat kelulusan.`;
      if (statusIcon) statusIcon.className = 'fa-solid fa-circle-exclamation color-red';
    }
  }

  // Generate Dynamic QR Code dengan Predikat & Nilai
  generateCertificateQRCode(currentScore, predInfo, hasTakenQuiz);
}

function generateCertificateQRCode(score, predInfo, hasTakenQuiz) {
  const qrContainer = document.getElementById('cert-qr-code');
  if (!qrContainer) return;
  qrContainer.innerHTML = '';

  const s = AppState.student;
  const currentScore = score !== undefined ? score : (s.quizScore !== null ? s.quizScore : 85);
  const info = predInfo || getQuizPredicate(currentScore);
  const isOfficial = hasTakenQuiz !== undefined ? hasTakenQuiz : (s.quizScore !== null);

  const verificationStatus = !isOfficial 
    ? 'PRATINJAU - BELUM SELESAI KUIS' 
    : (info.isPassed ? 'TERVALIDASI RESMI & LULUS' : 'REMEDIAL - BELUM LULUS KKM');

  const qrData = `VERIFIKASI RESMI LABORATORIUM VIRTUAL KIMIA\nNama: ${s.name || 'Aisyah Putri'}\nNISN: ${s.nisn || '20241005'}\nKelas: ${s.className || 'X.1'}\nSekolah: ${s.school || 'SMAN 1 Abung Tinggi'}\nNilai Kuis: ${currentScore}/100\nPredikat: ${info.predicate}\nStatus Kelulusan: ${verificationStatus}\nTanggal Verifikasi: ${new Date().toLocaleDateString('id-ID')}\nKode Dokumen: CHEM-LAB/VIRTUAL/2026/${s.nisn ? s.nisn.slice(-4) : '0892'}`;

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(qrContainer, {
        text: qrData,
        width: 68,
        height: 68,
        colorDark: '#0f2b48',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      console.warn('QR Code generation error:', e);
      qrContainer.innerHTML = '<i class="fa-solid fa-qrcode" style="font-size:48px; color:#0f2b48;"></i>';
    }
  } else {
    qrContainer.innerHTML = '<i class="fa-solid fa-qrcode" style="font-size:48px; color:#0f2b48;"></i>';
  }
}

function printCertificate() {
  playWebAudioTone('victory');
  window.print();
}

function downloadCertificatePNG() {
  showAppNotification('Gunakan menu Cetak > Simpan sebagai PDF untuk resolusi tertinggi A4 Landscape.');
  setTimeout(() => {
    window.print();
  }, 400);
}

/* ==========================================================================
   9. PORTAL & DASHBOARD GURU PENGAMPU (IBU FATMA ALAWIYAH) - APPS SCRIPT
   ========================================================================== */

const DEFAULT_SAMPLE_STUDENTS = [
  { id: 'sub_1', timestamp: '10/10/2026, 08:15:20', name: 'Aisyah Putri', nisn: '20241005', className: 'X.1', school: 'SMAN 1 Abung Tinggi', quizScore: 90, predicate: 'Memuaskan', status: 'LULUS' },
  { id: 'sub_2', timestamp: '10/10/2026, 08:22:11', name: 'Muhammad Fathir', nisn: '20241012', className: 'X.1', school: 'SMAN 1 Abung Tinggi', quizScore: 100, predicate: 'Sangat Memuaskan', status: 'LULUS DENGAN PUJIAN' },
  { id: 'sub_3', timestamp: '10/10/2026, 08:30:45', name: 'Zahra Nurul Aini', nisn: '20241018', className: 'X.1', school: 'SMAN 1 Abung Tinggi', quizScore: 80, predicate: 'Memuaskan', status: 'LULUS' },
  { id: 'sub_4', timestamp: '10/10/2026, 08:42:04', name: 'Rizky Pratama', nisn: '20241021', className: 'X.1', school: 'SMAN 1 Abung Tinggi', quizScore: 60, predicate: 'Belum Lulus', status: 'BELUM LULUS (REMEDIAL)' },
  { id: 'sub_5', timestamp: '10/10/2026, 09:05:30', name: 'Nabila Syifa', nisn: '20241029', className: 'X.2', school: 'SMAN 1 Abung Tinggi', quizScore: 100, predicate: 'Sangat Memuaskan', status: 'LULUS DENGAN PUJIAN' },
  { id: 'sub_6', timestamp: '10/10/2026, 09:12:18', name: 'Dafa Saputra', nisn: '20241033', className: 'X.2', school: 'SMAN 1 Abung Tinggi', quizScore: 70, predicate: 'Belum Lulus', status: 'BELUM LULUS (REMEDIAL)' },
  { id: 'sub_7', timestamp: '10/10/2026, 09:25:52', name: 'Tiara Andini', nisn: '20241040', className: 'X.2', school: 'SMAN 1 Abung Tinggi', quizScore: 90, predicate: 'Memuaskan', status: 'LULUS' },
  { id: 'sub_8', timestamp: '10/10/2026, 09:40:14', name: 'Dimas Arya', nisn: '20241045', className: 'X.2', school: 'SMAN 1 Abung Tinggi', quizScore: 80, predicate: 'Memuaskan', status: 'LULUS' },
  { id: 'sub_9', timestamp: '10/10/2026, 10:02:40', name: 'Putri Maharani', nisn: '20241052', className: 'X.3', school: 'SMAN 1 Abung Tinggi', quizScore: 100, predicate: 'Sangat Memuaskan', status: 'LULUS DENGAN PUJIAN' },
  { id: 'sub_10', timestamp: '10/10/2026, 10:18:22', name: 'Rendy Julian', nisn: '20241058', className: 'X.3', school: 'SMAN 1 Abung Tinggi', quizScore: 80, predicate: 'Memuaskan', status: 'LULUS' },
  { id: 'sub_11', timestamp: '10/10/2026, 10:35:10', name: 'Cantika Dewi', nisn: '20241064', className: 'X.1', school: 'SMAN 1 Abung Tinggi', quizScore: 90, predicate: 'Memuaskan', status: 'LULUS' },
  { id: 'sub_12', timestamp: '10/10/2026, 11:00:05', name: 'Fikri Ramadhan', nisn: '20241071', className: 'X.2', school: 'SMAN 1 Abung Tinggi', quizScore: 50, predicate: 'Belum Lulus', status: 'BELUM LULUS (REMEDIAL)' }
];

const DEFAULT_SAMPLE_LKPD = [
  {
    name: 'Aisyah Putri',
    className: 'X.1',
    timestamp: '10/10/2026, 08:18:00',
    q1: 'Kadar asam asetat pada label cuka kemasan di warung (tertulis 25%) perlu dibuktikan kebenarannya karena seringkali terdapat perbedaan konsentrasi yang memengaruhi rasa dan keasaman masakan.',
    q2: 'Jika sampel asam cuka diencerkan dan dititrasi dengan larutan standar NaOH 0,1 M menggunakan indikator fenolftalein, maka kadar asam asetat sebenarnya dapat ditentukan melalui stoikiometri titik ekuivalen.',
    q3: 'Volume rata-rata NaOH terpakai adalah 24,5 mL. Berdasarkan perhitungan stoikiometri M1 x V1 = M2 x V2, kadar asam asetat terhitung adalah 24,2%, membuktikan bahwa cuka memenuhi standar mutu perdagangan.'
  },
  {
    name: 'Muhammad Fathir',
    className: 'X.1',
    timestamp: '10/10/2026, 08:25:30',
    q1: 'Banyak produk cuka dapur lokal tidak mencantumkan kadar asam asetat secara akurat, sehingga diperlukan uji laboratorium kuantitatif untuk perlindungan konsumen.',
    q2: 'Kadar asam asetat dapat dihitung dengan titrasi asidimetri-alkalimetri dengan perubahan warna indikator PP dari tak berwarna menjadi merah muda seulas.',
    q3: 'Didapatkan titik akhir titrasi pada volume NaOH 25,1 mL. Hasil analisis menunjukkan konsentrasi asam cuka mendekati 24,8% dengan galat presisi di bawah 1%.'
  }
];

const DEFAULT_SAMPLE_REFLEKSI = [
  {
    name: 'Aisyah Putri',
    className: 'X.1',
    timestamp: '10/10/2026, 08:20:15',
    mood: 'Sangat Bersemangat & Terinspirasi',
    rating: 5,
    q1: '1. Membaca meniskus cekung sejajar mata.\n2. Fungsi kran buret & titik akhir titrasi.\n3. Simbol bahaya GHS di botol reagen.',
    q2: '1. Mengatur tetesan kran buret agar tidak kelebihan volume.\n2. Membedakan zat korosif & pengoksidasi.',
    q3: 'Selalu memakai jas lab berkancing rapi dan tidak makan/minum di lab.'
  },
  {
    name: 'Muhammad Fathir',
    className: 'X.1',
    timestamp: '10/10/2026, 08:28:40',
    mood: 'Senang & Paham',
    rating: 5,
    q1: '1. Prosedur standar pembuangan limbah B3.\n2. Simulasi 3D alat buret & labu erlenmeyer.\n3. Perhitungan stoikiometri titrasi.',
    q2: '1. Menjaga warna merah muda stabil minimal 30 detik saat titrasi.\n2. Pertolongan pertama luka asam.',
    q3: 'Menyimpan kembali alat kaca setelah dibilas bersih dengan akuades.'
  }
];

/**
 * Memuat sesi login guru dari sessionStorage
 */
function loadTeacherSession() {
  const isAuth = sessionStorage.getItem('chemlab_teacher_auth');
  if (isAuth === 'true') {
    AppState.teacher.isLoggedIn = true;
  }
  const savedUrl = localStorage.getItem('chemlab_gas_url');
  AppState.teacher.gasUrl = savedUrl || DEFAULT_GAS_URL;
}

/**
 * Membuka Modal Login Guru
 */
function openTeacherAuthModal() {
  const modal = document.getElementById('teacher-login-modal');
  if (modal) {
    modal.classList.add('active');
  }
  const err = document.getElementById('teacher-login-error');
  if (err) err.style.display = 'none';
  playWebAudioTone('click');
}

/**
 * Menutup Modal Login Guru
 */
function closeTeacherAuthModal() {
  const modal = document.getElementById('teacher-login-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Toggle tampil/sembunyikan password
 */
function toggleTeacherPasswordVisibility() {
  const pwInput = document.getElementById('teacher-password-input');
  const eye = document.getElementById('teacher-pw-eye');
  if (pwInput && eye) {
    if (pwInput.type === 'password') {
      pwInput.type = 'text';
      eye.className = 'fa-solid fa-eye-slash';
    } else {
      pwInput.type = 'password';
      eye.className = 'fa-solid fa-eye';
    }
  }
}

/**
 * Handle Verifikasi Login Guru
 * Kredensial Resmi: User: Fatma_alawiyah | Pass: Fatmasikop
 */
function handleTeacherLogin() {
  const userEl = document.getElementById('teacher-username-input');
  const passEl = document.getElementById('teacher-password-input');
  const errBox = document.getElementById('teacher-login-error');
  const errMsg = document.getElementById('teacher-error-msg');

  const username = userEl ? userEl.value.trim() : '';
  const password = passEl ? passEl.value : '';

  // Validasi kredensial pengguna guru
  if (username === 'Fatma_alawiyah' && password === 'Fatmasikop') {
    AppState.teacher.isLoggedIn = true;
    sessionStorage.setItem('chemlab_teacher_auth', 'true');

    // Tutup modal guru dan tutup overlay login siswa jika aktif
    closeTeacherAuthModal();
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.remove('active');

    // Pindah ke tab guru
    switchTab('guru');
    initTeacherDashboard();

    playWebAudioTone('victory');
    showAppNotification('Selamat Datang, Ibu Fatma Alawiyah, S.Pd.,Gr.! Portal Guru berhasil diakses.');
  } else {
    if (errBox && errMsg) {
      errBox.style.display = 'flex';
      errMsg.textContent = 'Username atau Password Guru salah! Pastikan User: Fatma_alawiyah & Password: Fatmasikop';
    }
    playWebAudioTone('beep');
  }
}

/**
 * Navigasi ke portal guru
 */
function handleTeacherNavClick() {
  if (AppState.teacher.isLoggedIn) {
    switchTab('guru');
  } else {
    openTeacherAuthModal();
  }
}

/**
 * Logout Akun Guru
 */
function logoutTeacher() {
  AppState.teacher.isLoggedIn = false;
  sessionStorage.removeItem('chemlab_teacher_auth');
  switchTab('beranda');
  showAppNotification('Sesi Guru telah berhasil keluar.');
  playWebAudioTone('click');
}

/**
 * Inisialisasi dan Render Seluruh Data Dashboard Guru
 */
function initTeacherDashboard() {
  // 1. Muat Submissions Kuis
  const savedSubs = localStorage.getItem('chemlab_teacher_submissions');
  if (savedSubs) {
    try {
      AppState.teacher.submissions = JSON.parse(savedSubs);
    } catch (e) {
      AppState.teacher.submissions = [...DEFAULT_SAMPLE_STUDENTS];
    }
  } else {
    AppState.teacher.submissions = [...DEFAULT_SAMPLE_STUDENTS];
    localStorage.setItem('chemlab_teacher_submissions', JSON.stringify(AppState.teacher.submissions));
  }

  // 2. Muat LKPD
  const savedLKPD = localStorage.getItem('chemlab_teacher_lkpd_list');
  if (savedLKPD) {
    try {
      AppState.teacher.lkpdList = JSON.parse(savedLKPD);
    } catch (e) {
      AppState.teacher.lkpdList = [...DEFAULT_SAMPLE_LKPD];
    }
  } else {
    AppState.teacher.lkpdList = [...DEFAULT_SAMPLE_LKPD];
    localStorage.setItem('chemlab_teacher_lkpd_list', JSON.stringify(AppState.teacher.lkpdList));
  }

  // 3. Muat Refleksi
  const savedRef = localStorage.getItem('chemlab_teacher_reflections_list');
  if (savedRef) {
    try {
      AppState.teacher.reflectionsList = JSON.parse(savedRef);
    } catch (e) {
      AppState.teacher.reflectionsList = [...DEFAULT_SAMPLE_REFLEKSI];
    }
  } else {
    AppState.teacher.reflectionsList = [...DEFAULT_SAMPLE_REFLEKSI];
    localStorage.setItem('chemlab_teacher_reflections_list', JSON.stringify(AppState.teacher.reflectionsList));
  }

  // 4. Muat URL Apps Script
  const gasInput = document.getElementById('gas-endpoint-url');
  const savedGas = localStorage.getItem('chemlab_gas_url') || getGASUrl();
  if (gasInput && savedGas) {
    gasInput.value = savedGas;
    AppState.teacher.gasUrl = savedGas;
  }

  // Update Tampilan
  updateTeacherKPIs();
  renderTeacherSubmissionsTable();
  renderTeacherLKPDGrid();
  renderTeacherReflectionsGrid();
  updateGASStatusBadge();
}

/**
 * Update Angka Kartu KPI Ringkasan Statistik Guru
 */
function updateTeacherKPIs() {
  const subs = AppState.teacher.submissions || [];
  const total = subs.length;

  let sumScore = 0;
  let passedCount = 0;
  let perfectCount = 0;
  let failedCount = 0;

  subs.forEach(s => {
    const score = Number(s.quizScore) || 0;
    sumScore += score;
    if (score >= 75) passedCount++;
    if (score >= 100) perfectCount++;
    if (score < 75) failedCount++;
  });

  const avg = total > 0 ? (sumScore / total).toFixed(1) : '0.0';
  const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  const totalEl = document.getElementById('kpi-total-students');
  const avgEl = document.getElementById('kpi-avg-score');
  const passRateEl = document.getElementById('kpi-pass-rate');
  const perfectEl = document.getElementById('kpi-perfect-count');
  const failedEl = document.getElementById('kpi-failed-count');
  const lkpdCountEl = document.getElementById('kpi-lkpd-count');

  if (totalEl) totalEl.textContent = total;
  if (avgEl) avgEl.textContent = avg;
  if (passRateEl) passRateEl.textContent = `${passRate}%`;
  if (perfectEl) perfectEl.textContent = perfectCount;
  if (failedEl) failedEl.textContent = failedCount;

  const lkpdTotal = AppState.teacher.lkpdList ? AppState.teacher.lkpdList.length : 0;
  const refTotal = AppState.teacher.reflectionsList ? AppState.teacher.reflectionsList.length : 0;
  if (lkpdCountEl) lkpdCountEl.textContent = `${lkpdTotal} / ${refTotal}`;
}

/**
 * Ganti Sub-tab di Dalam Dashboard Guru
 */
function switchTeacherSubTab(tabKey) {
  AppState.teacher.currentSubTab = tabKey;

  document.querySelectorAll('.teacher-tab-navs .t-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`t-tab-btn-${tabKey}`);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.teacher-dashboard-container .t-sub-content').forEach(c => c.classList.remove('active'));
  const targetContent = document.getElementById(`t-content-${tabKey}`);
  if (targetContent) targetContent.classList.add('active');

  playWebAudioTone('click');
}

/**
 * Render Tabel Rekap Nilai Siswa
 */
function renderTeacherSubmissionsTable(dataList) {
  const tbody = document.getElementById('teacher-table-tbody');
  const countEl = document.getElementById('table-footer-count');
  if (!tbody) return;

  const list = dataList || AppState.teacher.submissions || [];
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display:block;"></i>
          Tidak ada data siswa yang cocok dengan filter pencarian.
        </td>
      </tr>
    `;
    if (countEl) countEl.textContent = 'Menampilkan 0 data';
    return;
  }

  list.forEach((item, idx) => {
    const tr = document.createElement('tr');

    // Predicate class mapping
    let predBadgeClass = 'predicate-satisfactory';
    if (item.quizScore < 75) predBadgeClass = 'predicate-failed';
    else if (item.quizScore >= 100) predBadgeClass = 'predicate-excellent';

    // Status tag
    const isPassed = Number(item.quizScore) >= 75;
    const statusTagHtml = isPassed 
      ? '<span class="status-tag status-tag-lulus"><i class="fa-solid fa-check"></i> LULUS</span>'
      : '<span class="status-tag status-tag-remedial"><i class="fa-solid fa-rotate-right"></i> REMEDIAL</span>';

    tr.innerHTML = `
      <td style="font-weight: 700; color: #64748b;">${idx + 1}</td>
      <td style="font-size: 0.78rem; color: #64748b; white-space: nowrap;">${item.timestamp || '-'}</td>
      <td><strong>${item.name}</strong></td>
      <td style="font-family: var(--font-mono); font-size: 0.8rem;">${item.nisn}</td>
      <td><span style="background:#e0f2fe; color:#0369a1; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">${item.className}</span></td>
      <td style="text-align: center; font-weight: 900; font-size: 0.95rem; color: #0f172a;">${item.quizScore}</td>
      <td style="text-align: center;">
        <span class="badge-predicate-pill ${predBadgeClass}" style="padding: 0.25rem 0.65rem; font-size: 0.76rem;">
          ${item.predicate}
        </span>
      </td>
      <td style="text-align: center;">${statusTagHtml}</td>
      <td style="text-align: center;">
        <button class="btn btn-sm btn-outline" onclick="deleteTeacherSubmission('${item.id}')" title="Hapus data siswa ini" style="padding: 0.3rem 0.6rem; color: #dc2626;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (countEl) {
    const totalAll = AppState.teacher.submissions ? AppState.teacher.submissions.length : 0;
    countEl.textContent = `Menampilkan ${list.length} dari ${totalAll} data siswa`;
  }
}

/**
 * Filter Data Siswa Berdasarkan Pencarian, Kelas, dan Predikat
 */
function filterTeacherSubmissions() {
  const searchInput = document.getElementById('teacher-search-input');
  const classSelect = document.getElementById('teacher-filter-class');
  const predSelect = document.getElementById('teacher-filter-predicate');

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedClass = classSelect ? classSelect.value : 'ALL';
  const selectedPred = predSelect ? predSelect.value : 'ALL';

  const all = AppState.teacher.submissions || [];

  const filtered = all.filter(item => {
    // 1. Search Query
    const nameMatch = (item.name || '').toLowerCase().includes(q);
    const nisnMatch = (item.nisn || '').toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || nisnMatch;

    // 2. Class Filter
    const matchesClass = selectedClass === 'ALL' || item.className === selectedClass;

    // 3. Predicate Filter
    const matchesPred = selectedPred === 'ALL' || item.predicate === selectedPred;

    return matchesSearch && matchesClass && matchesPred;
  });

  renderTeacherSubmissionsTable(filtered);
}

/**
 * Hapus Data Submission Siswa
 */
function deleteTeacherSubmission(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini dari rekap?')) return;

  AppState.teacher.submissions = AppState.teacher.submissions.filter(item => item.id !== id);
  localStorage.setItem('chemlab_teacher_submissions', JSON.stringify(AppState.teacher.submissions));

  updateTeacherKPIs();
  filterTeacherSubmissions();
  showAppNotification('Data siswa berhasil dihapus.');
  playWebAudioTone('click');
}

/**
 * Reset Kumpulan Data Sample
 */
function resetSampleStudentData() {
  if (!confirm('Muat ulang 12 data sampel siswa kelas X.1 dan X.2? Data yang baru saja dicatat akan digantikan sampel.')) return;

  AppState.teacher.submissions = [...DEFAULT_SAMPLE_STUDENTS];
  AppState.teacher.lkpdList = [...DEFAULT_SAMPLE_LKPD];
  AppState.teacher.reflectionsList = [...DEFAULT_SAMPLE_REFLEKSI];

  localStorage.setItem('chemlab_teacher_submissions', JSON.stringify(AppState.teacher.submissions));
  localStorage.setItem('chemlab_teacher_lkpd_list', JSON.stringify(AppState.teacher.lkpdList));
  localStorage.setItem('chemlab_teacher_reflections_list', JSON.stringify(AppState.teacher.reflectionsList));

  initTeacherDashboard();
  showAppNotification('Data sampel siswa laboratorium berhasil dimuat ulang!');
  playWebAudioTone('victory');
}

/**
 * Render Kartu Pengumpulan LKPD Siswa
 */
function renderTeacherLKPDGrid() {
  const container = document.getElementById('teacher-lkpd-grid');
  if (!container) return;

  const list = AppState.teacher.lkpdList || [];
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color:#64748b; padding:1.5rem;">Belum ada data pengumpulan LKPD digital siswa.</p>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'student-sub-card';
    card.innerHTML = `
      <div class="sub-card-header">
        <div>
          <h4>${item.name}</h4>
          <span style="font-size:0.75rem; color:#0284c7; font-weight:700;">Kelas ${item.className}</span>
        </div>
        <span class="sub-card-time"><i class="fa-regular fa-clock"></i> ${item.timestamp || '-'}</span>
      </div>
      <div class="sub-q-block">
        <strong>Fase 1: Identifikasi Masalah Cuka</strong>
        <p>${item.q1}</p>
      </div>
      <div class="sub-q-block">
        <strong>Fase 2: Hipotesis & Reaksi Titrasi</strong>
        <p>${item.q2}</p>
      </div>
      <div class="sub-q-block">
        <strong>Fase 3: Data Titrasi & Kesimpulan Akhir</strong>
        <p>${item.q3}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Render Kartu Rekap Jurnal Refleksi Siswa
 */
function renderTeacherReflectionsGrid() {
  const container = document.getElementById('teacher-reflections-grid');
  if (!container) return;

  const list = AppState.teacher.reflectionsList || [];
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color:#64748b; padding:1.5rem;">Belum ada data refleksi 3-2-1 yang tersimpan.</p>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'student-sub-card';
    card.innerHTML = `
      <div class="sub-card-header">
        <div>
          <h4>${item.name}</h4>
          <span style="font-size:0.75rem; color:#7c3aed; font-weight:700;">Kelas ${item.className}</span>
        </div>
        <span class="sub-card-time"><i class="fa-regular fa-clock"></i> ${item.timestamp || '-'}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:0.5rem 0.75rem; border-radius:6px; border:1px solid #e2e8f0; font-size:0.8rem;">
        <span><strong>Mood:</strong> ${item.mood}</span>
        <span class="color-gold">Rating: ${'★'.repeat(item.rating || 5)}</span>
      </div>
      <div class="sub-q-block">
        <strong>3 Hal Baru Dipelajari:</strong>
        <p>${item.q1}</p>
      </div>
      <div class="sub-q-block">
        <strong>2 Hal Paling Menantang:</strong>
        <p>${item.q2}</p>
      </div>
      <div class="sub-q-block">
        <strong>1 Komitmen Praktikum di Sekolah:</strong>
        <p>${item.q3}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Catat Hasil Kuis Siswa yang Baru Selesai ke Daftar Guru & Auto-Sync
 */
function recordStudentQuizToTeacher(student, score, predInfo) {
  if (!student || !student.name) return;

  const timeStr = new Date().toLocaleString('id-ID');
  const newRecord = {
    id: 'sub_' + Date.now(),
    timestamp: timeStr,
    name: student.name,
    nisn: student.nisn || '20241099',
    className: student.className || 'X.1',
    school: student.school || 'SMAN 1 Abung Tinggi',
    quizScore: score,
    predicate: predInfo.predicate,
    status: predInfo.statusText
  };

  // Muat data yang ada
  const saved = localStorage.getItem('chemlab_teacher_submissions');
  let subs = [];
  if (saved) {
    try { subs = JSON.parse(saved); } catch (e) { subs = [...DEFAULT_SAMPLE_STUDENTS]; }
  } else {
    subs = [...DEFAULT_SAMPLE_STUDENTS];
  }

  // Cek apakah siswa dengan NISN sama sudah ada
  const existIdx = subs.findIndex(s => s.nisn === newRecord.nisn);
  if (existIdx >= 0) {
    subs[existIdx] = newRecord; // Perbarui nilai terbaru
  } else {
    subs.unshift(newRecord); // Masukkan paling atas
  }

  AppState.teacher.submissions = subs;
  localStorage.setItem('chemlab_teacher_submissions', JSON.stringify(subs));

  // Auto-sync ke Google Apps Script jika URL sudah diset oleh Bu Fatma
  if (getGASUrl()) {
    postToGoogleAppsScript({
      action: 'saveQuiz',
      ...newRecord
    }).catch(err => {
      console.error('Auto-sync nilai kuis gagal:', err);
      showAppNotification(`Nilai tersimpan lokal, tetapi sinkronisasi Sheets gagal: ${err.message}`);
    });
  }
}

/**
 * Catat Jawaban LKPD Siswa ke Daftar Guru & Auto-Sync
 */
function recordStudentLKPDToTeacher(student, lkpdData) {
  if (!student || !lkpdData) return;

  const newEntry = {
    name: student.name,
    className: student.className || 'X.1',
    timestamp: new Date().toLocaleString('id-ID'),
    q1: lkpdData.q1,
    q2: lkpdData.q2,
    q3: lkpdData.q3
  };

  const saved = localStorage.getItem('chemlab_teacher_lkpd_list');
  let list = [];
  if (saved) {
    try { list = JSON.parse(saved); } catch (e) { list = [...DEFAULT_SAMPLE_LKPD]; }
  } else {
    list = [...DEFAULT_SAMPLE_LKPD];
  }

  const existIdx = list.findIndex(item => item.name === newEntry.name && item.className === newEntry.className);
  if (existIdx >= 0) {
    list[existIdx] = newEntry;
  } else {
    list.unshift(newEntry);
  }

  AppState.teacher.lkpdList = list;
  localStorage.setItem('chemlab_teacher_lkpd_list', JSON.stringify(list));

  // Auto-sync ke Google Apps Script
  if (getGASUrl()) {
    postToGoogleAppsScript({
      action: 'saveLKPD',
      ...newEntry
    }).catch(err => {
      console.error('Auto-sync LKPD gagal:', err);
      showAppNotification(`LKPD tersimpan lokal, tetapi sinkronisasi Sheets gagal: ${err.message}`);
    });
  }
}

/**
 * Catat Refleksi Siswa ke Daftar Guru & Auto-Sync
 */
function recordStudentReflectionToTeacher(student, refData) {
  if (!student || !refData) return;

  const newEntry = {
    name: student.name,
    className: student.className || 'X.1',
    timestamp: new Date().toLocaleString('id-ID'),
    mood: refData.mood,
    rating: refData.rating,
    q1: refData.q1,
    q2: refData.q2,
    q3: refData.q3
  };

  const saved = localStorage.getItem('chemlab_teacher_reflections_list');
  let list = [];
  if (saved) {
    try { list = JSON.parse(saved); } catch (e) { list = [...DEFAULT_SAMPLE_REFLEKSI]; }
  } else {
    list = [...DEFAULT_SAMPLE_REFLEKSI];
  }

  const existIdx = list.findIndex(item => item.name === newEntry.name && item.className === newEntry.className);
  if (existIdx >= 0) {
    list[existIdx] = newEntry;
  } else {
    list.unshift(newEntry);
  }

  AppState.teacher.reflectionsList = list;
  localStorage.setItem('chemlab_teacher_reflections_list', JSON.stringify(list));

  // Auto-sync ke Google Apps Script
  if (getGASUrl()) {
    postToGoogleAppsScript({
      action: 'saveReflection',
      ...newEntry
    }).catch(err => {
      console.error('Auto-sync refleksi gagal:', err);
      showAppNotification(`Refleksi tersimpan lokal, tetapi sinkronisasi Sheets gagal: ${err.message}`);
    });
  }
}

/**
 * Simpan Konfigurasi URL Google Apps Script
 */
function saveGASUrl() {
  const input = document.getElementById('gas-endpoint-url');
  const url = input ? input.value.trim() : '';

  if (!isValidGASUrl(url)) {
    alert('URL tidak valid. Gunakan URL Web App resmi Google Apps Script yang berakhiran /exec.');
    return;
  }

  AppState.teacher.gasUrl = url;
  localStorage.setItem('chemlab_gas_url', url);

  updateGASStatusBadge();
  playWebAudioTone('victory');
  showAppNotification('URL Google Apps Script berhasil disimpan!');
}

/**
 * Update Indikator Status Koneksi Google Apps Script
 */
function updateGASStatusBadge() {
  const url = getGASUrl();
  const pill = document.getElementById('teacher-gas-status-pill');
  const title = document.getElementById('gas-status-title');
  const desc = document.getElementById('gas-status-desc');
  const icon = document.getElementById('gas-status-icon');

  if (url) {
    if (pill) {
      pill.innerHTML = '<i class="fa-solid fa-link"></i> Endpoint Tersimpan';
      pill.style.background = '#dcfce7';
      pill.style.color = '#166534';
    }
    if (title) title.textContent = 'Status: Endpoint tersimpan, belum diuji';
    if (desc) desc.textContent = 'Klik Tes Koneksi untuk memverifikasi Web App dan Spreadsheet.';
    if (icon) icon.className = 'fa-solid fa-link color-amber';
  } else {
    if (pill) {
      pill.innerHTML = '<i class="fa-solid fa-plug"></i> Apps Script Siap';
      pill.style.background = '#fef3c7';
      pill.style.color = '#92400e';
    }
    if (title) title.textContent = 'Status: Siap Dihubungkan';
    if (desc) desc.textContent = 'Masukkan URL Web App dari Google Spreadsheet Anda di bawah ini, lalu klik Simpan URL.';
    if (icon) icon.className = 'fa-solid fa-circle-info color-amber';
  }
}

/**
 * Tes Koneksi ke Google Apps Script
 */
async function testGASConnection() {
  const inputUrl = document.getElementById('gas-endpoint-url')?.value.trim();
  const url = inputUrl || getGASUrl();
  if (!isValidGASUrl(url)) {
    alert('Silakan masukkan dan simpan URL Web App Google Apps Script terlebih dahulu!');
    return;
  }

  showAppNotification('Menguji koneksi ke Google Apps Script Web App...');
  try {
    const response = await fetch(`${url}?action=health&t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Respons backend tidak valid');

    AppState.teacher.gasUrl = url;
    localStorage.setItem('chemlab_gas_url', url);
    const title = document.getElementById('gas-status-title');
    const desc = document.getElementById('gas-status-desc');
    const pill = document.getElementById('teacher-gas-status-pill');
    if (title) title.textContent = 'Status: Terhubung dan terverifikasi';
    if (desc) desc.textContent = `Spreadsheet aktif: ${result.spreadsheetName || 'Google Spreadsheet'}`;
    if (pill) pill.innerHTML = '<i class="fa-solid fa-circle-check"></i> Sheets Terverifikasi';
    playWebAudioTone('victory');
    showAppNotification('Koneksi Web App Google Apps Script berhasil terhubung!');
  } catch (err) {
    console.error('GAS connection test failed:', err);
    showAppNotification(`Koneksi gagal: ${err.message}. Periksa deployment dan akses Anyone.`);
  }
}

/**
 * Sinkronisasikan Seluruh Data Siswa ke Google Spreadsheet
 */
async function syncAllDataToGAS() {
  const url = getGASUrl();
  if (!isValidGASUrl(url)) {
    alert('Mohon atur URL Web App Google Apps Script terlebih dahulu pada Sub-Tab Integrasi Apps Script!');
    switchTeacherSubTab('gas');
    return;
  }

  showAppNotification('Sedang menyinkronkan seluruh data ke Google Spreadsheet...');

  const payload = {
    action: 'syncAll',
    submissions: AppState.teacher.submissions || [],
    lkpdList: AppState.teacher.lkpdList || [],
    reflectionsList: AppState.teacher.reflectionsList || []
  };

  try {
    const result = await postToGoogleAppsScript(payload);
    playWebAudioTone('victory');
    showAppNotification(`Berhasil: ${result.processed || 0} data disinkronkan ke Google Sheets.`);
  } catch (err) {
    showAppNotification(`Sinkronisasi gagal: ${err.message}`);
  }
}

/**
 * Helper Fungsi Pengiriman Data via POST JSON ke Google Apps Script
 */
async function postToGoogleAppsScript(payload, onSuccess) {
  const url = getGASUrl();
  if (!isValidGASUrl(url)) throw new Error('URL Apps Script belum valid');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // text/plain adalah simple request sehingga tidak memicu preflight OPTIONS.
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || 'Backend menolak data');
  if (typeof onSuccess === 'function') onSuccess(result);
  return result;
}

/**
 * Salin Kode Backend Google Apps Script (Code.gs)
 */
async function loadGASCodePreview() {
  const codeEl = document.getElementById('gas-code-content');
  if (!codeEl) return;
  try {
    const response = await fetch('google_apps_script_Code.gs', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    codeEl.textContent = await response.text();
  } catch (err) {
    console.warn('Preview Code.gs tidak dapat dimuat:', err);
  }
}

async function copyGASCode() {
  const codeEl = document.getElementById('gas-code-content');
  const btn = document.getElementById('btn-copy-gas');
  if (!codeEl) return;

  await loadGASCodePreview();

  const textToCopy = codeEl.innerText || codeEl.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (btn) {
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin! ✓';
        setTimeout(() => { btn.innerHTML = origText; }, 2500);
      }
      playWebAudioTone('victory');
      showAppNotification('Kode backend Apps Script berhasil disalin ke clipboard!');
    }).catch(() => {
      fallbackCopyText(textToCopy);
    });
  } else {
    fallbackCopyText(textToCopy);
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showAppNotification('Kode backend Apps Script berhasil disalin!');
}

/**
 * Ekspor Rekap Nilai Siswa ke Format CSV (Excel Compatible)
 */
function exportTeacherDataCSV() {
  const list = AppState.teacher.submissions || [];
  if (list.length === 0) {
    alert('Belum ada data siswa untuk diekspor!');
    return;
  }

  // Header CSV
  let csvContent = '\uFEFF'; // UTF-8 BOM untuk Microsoft Excel
  csvContent += 'No,Waktu Pengerjaan,Nama Siswa,NISN,Kelas,Sekolah,Nilai Kuis,Predikat,Status Kelulusan\n';

  list.forEach((item, idx) => {
    const row = [
      idx + 1,
      `"${item.timestamp || ''}"`,
      `"${item.name || ''}"`,
      `"${item.nisn || ''}"`,
      `"${item.className || ''}"`,
      `"${item.school || ''}"`,
      item.quizScore,
      `"${item.predicate || ''}"`,
      `"${item.status || ''}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Nilai_Kimia_Fatma_Alawiyah_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  playWebAudioTone('victory');
  showAppNotification('File CSV Rekap Nilai berhasil diunduh.');
}

/**
 * Cetak Rekapitulasi Nilai Dashboard Guru
 */
function printTeacherDashboard() {
  playWebAudioTone('click');
  window.print();
}

