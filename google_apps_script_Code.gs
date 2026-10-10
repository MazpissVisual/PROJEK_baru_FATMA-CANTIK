/**
 * =====================================================================
 * BACKEND GOOGLE APPS SCRIPT - CHEMLAB 3D VIRTUAL
 * GURU PENGAMPU: IBU FATMA ALAWIYAH, S.Pd.,Gr.
 * =====================================================================
 * 
 * PANDUAN PEMASANGAN:
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu: Ekstensi > Apps Script.
 * 3. Hapus semua kode yang ada di editor, lalu tempel (paste) seluruh kode di bawah ini.
 * 4. Klik ikon Disket (Simpan) di toolbar atas.
 * 5. Klik tombol: Deploy (Terapkan) > New deployment (Deployment baru).
 * 6. Pilih jenis: Web app (Aplikasi web).
 *    - Description: ChemLab 3D Fatma Alawiyah
 *    - Execute as (Jalankan sebagai): Me (Email Google Anda)
 *    - Who has access (Siapa yang memiliki akses): Anyone (Siapa saja)  <-- PENTING!
 * 7. Klik "Deploy", lalu klik "Authorize access" (Izinkan Akses akun Google Anda).
 * 8. Salin "Web app URL" (URL yang berakhiran /exec).
 * 9. Buka Dashboard Guru di aplikasi ChemLab 3D > Tab "Integrasi Apps Script & Sheets",
 *    lalu tempel URL tersebut dan klik "Simpan URL".
 * =====================================================================
 */

/**
 * Handle HTTP GET Request
 * Berfungsi untuk tes konektivitas (health check) dari web laboratorium
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Backend Google Apps Script ChemLab 3D (Ibu Fatma Alawiyah) Aktif & Terhubung!',
    spreadsheetName: ss ? ss.getName() : '',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Request
 * Menerima dan mencatat data Kuis, LKPD PBL, dan Jurnal Refleksi Siswa secara realtime
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Body request kosong.');
    }
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Spreadsheet aktif tidak ditemukan. Pasang script melalui Ekstensi > Apps Script dari Spreadsheet.');
    var processed = 0;

    // -------------------------------------------------------------
    // 1. SIMPAN REKAP NILAI KUIS SISWA (Satuan atau Sinkronisasi Massal)
    // -------------------------------------------------------------
    if (data.action === 'saveQuiz' || data.action === 'syncAll') {
      var sheetQuiz = getOrCreateSheet(ss, 'Rekap_Nilai_Kuis', [
        'Timestamp', 'Nama Siswa', 'NISN', 'Kelas', 'Sekolah', 'Nilai Kuis', 'Predikat', 'Status Kelulusan'
      ], '#1e3a8a');
      
      if (data.action === 'syncAll' && data.submissions && data.submissions.length > 0) {
        data.submissions.forEach(function(s) {
          upsertRow(sheetQuiz, 3, s.nisn || '-', [
            s.timestamp || new Date().toLocaleString('id-ID'),
            s.name || '-',
            s.nisn || '-',
            s.className || '-',
            s.school || 'SMAN 1 Abung Tinggi',
            s.quizScore !== undefined ? s.quizScore : 0,
            s.predicate || '-',
            s.status || '-'
          ]);
          processed++;
        });
      } else if (data.action === 'saveQuiz') {
        upsertRow(sheetQuiz, 3, data.nisn || '-', [
          data.timestamp || new Date().toLocaleString('id-ID'),
          data.name || '-',
          data.nisn || '-',
          data.className || '-',
          data.school || 'SMAN 1 Abung Tinggi',
          data.quizScore !== undefined ? data.quizScore : 0,
          data.predicate || '-',
          data.status || '-'
        ]);
        processed++;
      }
    }

    // -------------------------------------------------------------
    // 2. SIMPAN LEMBAR KERJA PESERTA DIDIK (LKPD) DIGITAL PBL
    // -------------------------------------------------------------
    if (data.action === 'saveLKPD') {
      var sheetLKPD = getOrCreateSheet(ss, 'Data_LKPD_PBL', [
        'Timestamp', 'Nama Siswa', 'Kelas', 'Fase 1: Identifikasi Masalah Cuka', 'Fase 2: Hipotesis & Reaksi', 'Fase 3: Data Titrasi & Kesimpulan'
      ], '#0369a1');

      upsertCompositeRow(sheetLKPD, data.name || '-', data.className || '-', [
        data.timestamp || new Date().toLocaleString('id-ID'),
        data.name || '-',
        data.className || '-',
        data.q1 || '-',
        data.q2 || '-',
        data.q3 || '-'
      ]);
      processed++;
    }

    // -------------------------------------------------------------
    // 3. SIMPAN JURNAL REFLEKSI METAKOGNISI SISWA (3-2-1 MODEL)
    // -------------------------------------------------------------
    if (data.action === 'saveReflection') {
      var sheetRef = getOrCreateSheet(ss, 'Refleksi_Siswa', [
        'Timestamp', 'Nama Siswa', 'Kelas', 'Perasaan Mood', 'Rating Bintang (1-5)', '3 Hal Baru Dipelajari', '2 Hal Menantang', '1 Komitmen Aksi di Lab'
      ], '#047857');

      upsertCompositeRow(sheetRef, data.name || '-', data.className || '-', [
        data.timestamp || new Date().toLocaleString('id-ID'),
        data.name || '-',
        data.className || '-',
        data.mood || 'Sangat Antusias',
        data.rating || 5,
        data.q1 || '-',
        data.q2 || '-',
        data.q3 || '-'
      ]);
      processed++;
    }

    if (data.action === 'syncAll') {
      (data.lkpdList || []).forEach(function(item) {
        var sheetLKPD = getOrCreateSheet(ss, 'Data_LKPD_PBL', [
          'Timestamp', 'Nama Siswa', 'Kelas', 'Fase 1: Identifikasi Masalah Cuka', 'Fase 2: Hipotesis & Reaksi', 'Fase 3: Data Titrasi & Kesimpulan'
        ], '#0369a1');
        upsertCompositeRow(sheetLKPD, item.name || '-', item.className || '-', [
          item.timestamp || new Date().toLocaleString('id-ID'), item.name || '-', item.className || '-',
          item.q1 || '-', item.q2 || '-', item.q3 || '-'
        ]);
        processed++;
      });

      (data.reflectionsList || []).forEach(function(item) {
        var sheetRef = getOrCreateSheet(ss, 'Refleksi_Siswa', [
          'Timestamp', 'Nama Siswa', 'Kelas', 'Perasaan Mood', 'Rating Bintang (1-5)', '3 Hal Baru Dipelajari', '2 Hal Menantang', '1 Komitmen Aksi di Lab'
        ], '#047857');
        upsertCompositeRow(sheetRef, item.name || '-', item.className || '-', [
          item.timestamp || new Date().toLocaleString('id-ID'), item.name || '-', item.className || '-',
          item.mood || '-', item.rating || 0, item.q1 || '-', item.q2 || '-', item.q3 || '-'
        ]);
        processed++;
      });
    }

    if (['saveQuiz', 'saveLKPD', 'saveReflection', 'syncAll'].indexOf(data.action) === -1) {
      throw new Error('Action tidak dikenali: ' + data.action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data berhasil dicatat ke Google Spreadsheet!',
      processed: processed
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/** Memperbarui baris dengan kunci yang sama; menambah baris jika belum ada. */
function upsertRow(sheet, keyColumn, keyValue, rowData) {
  var targetRow = 0;
  if (sheet.getLastRow() > 1) {
    var finder = sheet.getRange(2, keyColumn, sheet.getLastRow() - 1, 1)
      .createTextFinder(String(keyValue))
      .matchEntireCell(true)
      .findNext();
    if (finder) targetRow = finder.getRow();
  }
  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/** Upsert berdasarkan gabungan Nama Siswa dan Kelas. */
function upsertCompositeRow(sheet, name, className, rowData) {
  var targetRow = 0;
  if (sheet.getLastRow() > 1) {
    var values = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getDisplayValues();
    for (var i = 0; i < values.length; i++) {
      if (values[i][0] === String(name) && values[i][1] === String(className)) {
        targetRow = i + 2;
        break;
      }
    }
  }
  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Fungsi Pembantu: Membuat Sheet baru dengan header gaya profesional jika belum ada
 */
function getOrCreateSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    
    // Format Header Baris Pertama
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground(headerColor || '#1e3a8a');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    
    sheet.setFrozenRows(1);
    
    // Auto-fit kolom agar terbaca rapi
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  return sheet;
}
