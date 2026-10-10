/**
 * Konfigurasi bersama ChemLab.
 *
 * Isi gasUrl dengan URL Web App Google Apps Script yang berakhiran /exec
 * agar seluruh perangkat siswa memakai Spreadsheet yang sama.
 * URL yang disimpan melalui Dashboard Guru tetap menjadi override lokal.
 */
window.CHEMLAB_CONFIG = Object.freeze({
  gasUrl: 'https://script.google.com/macros/s/AKfycbxQsj9_KcgBSVQqDbEw9paWhkjbK6xKasdW_CkOQkT_URBv60zoMTDWIEVfNojfsbyk/exec'
});
