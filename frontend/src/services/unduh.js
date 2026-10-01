import api from './api';

// Unduh file (blob) dari endpoint lalu picu download di browser.
// Nama file memakai namaFile karena header Content-Disposition tidak diekspos CORS.
export async function unduhFile(url, namaFile, params) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// Pada responseType 'blob', pesan error JSON terbungkus Blob. Fungsi ini membacanya.
export async function pesanErrorBlob(err, cadangan = 'Terjadi kesalahan.') {
  const data = err.response?.data;
  if (data instanceof Blob) {
    try { return JSON.parse(await data.text()).message || cadangan; } catch { return cadangan; }
  }
  return data?.message || cadangan;
}