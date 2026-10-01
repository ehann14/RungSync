import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import api from '../services/api';
import { useAppTheme } from './Modal';

const css = `
.imp{--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;--th-bg:#f1f5f9;--th-text:#1d4ed8;--line:#e2e8f0;--input-border:#cbd5e1;color:var(--text);}
.imp.imp-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#94a3b8;--th-bg:#132340;--th-text:#8ab4f8;--line:#16263f;--input-border:#24344f;}
.imp-upload{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.imp-upload input[type=file]{font-size:13px;color:var(--text);max-width:100%;}
.imp-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.2s;}
.imp-btn-primary{background:#2563eb;color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.imp-btn-primary:hover:not(:disabled){filter:brightness(1.1);}
.imp-btn:disabled{opacity:.5;cursor:not-allowed;}
.imp-btn-ghost{background:transparent;color:var(--text);box-shadow:inset 0 0 0 1px var(--input-border);}
.imp-hint{font-size:12px;color:var(--muted);margin:8px 0 14px;}
.imp-alert{border-radius:8px;padding:10px 12px;font-size:13px;margin:12px 0;}
.imp-alert-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.5);color:#dc2626;}
.imp-dark .imp-alert-err{color:#fca5a5;}
.imp-alert-ok{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.5);color:#15803d;}
.imp-dark .imp-alert-ok{color:#86efac;}
.imp-stats{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;}
.imp-stat{flex:1;min-width:110px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 14px;}
.imp-stat b{display:block;font-size:22px;color:var(--strong);}
.imp-stat span{font-size:12px;color:var(--muted);}
.imp-stat.ok b{color:#16a34a;} .imp-stat.bad b{color:#dc2626;}
.imp-h{font-size:14px;font-weight:700;color:var(--strong);margin:16px 0 8px;}
.imp-wrap{max-height:300px;overflow:auto;border:1px solid var(--border);border-radius:10px;background:var(--card);}
.imp-table{width:100%;border-collapse:collapse;font-size:12.5px;}
.imp-table th{position:sticky;top:0;background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:9px 12px;white-space:nowrap;}
.imp-table td{padding:9px 12px;border-top:1px solid var(--line);color:var(--text);}
.imp-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;}
.imp-badge.baru{background:rgba(34,197,94,.15);color:#16a34a;}
.imp-badge.update{background:rgba(245,158,11,.18);color:#d97706;}
.imp-mode{display:flex;flex-direction:column;gap:6px;margin:14px 0 4px;font-size:13px;}
.imp-mode label{display:flex;gap:8px;align-items:flex-start;cursor:pointer;}
.imp-actions{display:flex;gap:10px;margin-top:14px;align-items:center;flex-wrap:wrap;}
`;

const MAKS_BYTE = 2 * 1024 * 1024;

/**
 * Alur: pilih file -> Cek Data (dry-run) -> pratinjau -> Simpan.
 * base: 'schedules/import' atau 'teachers/import' | params: field tambahan di FormData
 * kolomValid: [{ label, render(row) }] untuk tabel baris valid
 */
export default function ImportPanel({ base, params = {}, kolomValid, onSelesai }) {
  const theme = useAppTheme();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [hasil, setHasil] = useState(null);
  const [mode, setMode] = useState('');
  const [mengecek, setMengecek] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');

  const pesan = (err, cadangan) => {
    const e = err.response?.data?.errors;
    return e ? Object.values(e).flat().join(' ') : (err.response?.data?.message || cadangan);
  };

  const buatForm = () => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(params).forEach(([k, v]) => fd.append(k, v));
    return fd;
  };

  const pilihFile = (e) => {
    const f = e.target.files?.[0] || null;
    setHasil(null); setMode(''); setError(''); setSukses('');
    if (f && !f.name.toLowerCase().endsWith('.xlsx')) { setError('File harus berformat .xlsx.'); setFile(null); return; }
    if (f && f.size > MAKS_BYTE) { setError('Ukuran file maksimal 2 MB.'); setFile(null); return; }
    setFile(f);
  };

  const cekData = async () => {
    setMengecek(true); setError(''); setSukses(''); setHasil(null); setMode('');
    try {
      const res = await api.post(`/admin/${base}/preview`, buatForm(), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setHasil(res.data);
    } catch (err) {
      setError(pesan(err, 'Gagal memeriksa file.'));
    } finally { setMengecek(false); }
  };

  const simpan = async () => {
    const modeKirim = mode || 'all_valid';
    const ket = modeKirim === 'valid_only'
      ? `Simpan ${hasil.jumlah_valid} baris valid dan lewati ${hasil.jumlah_error} baris error?`
      : `Simpan ${hasil.jumlah_valid} baris?`;
    if (!window.confirm(ket)) return;

    setMenyimpan(true); setError('');
    try {
      const fd = buatForm();
      fd.append('mode', modeKirim);
      const res = await api.post(`/admin/${base}/commit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSukses(res.data.message);
      setHasil(null); setFile(null); setMode('');
      if (inputRef.current) inputRef.current.value = '';
      onSelesai && onSelesai(res.data);
    } catch (err) {
      setError(pesan(err, 'Gagal menyimpan data.'));
    } finally { setMenyimpan(false); }
  };

  const adaError = hasil && hasil.jumlah_error > 0;
  const simpanNonaktif = menyimpan || !hasil || hasil.jumlah_valid === 0
    || (adaError && mode !== 'valid_only');

  const barisError = hasil ? hasil.error.flatMap((e) => e.pesan.map((p) => ({ baris: e.baris, ...p }))) : [];

  return (
    <div className={`imp ${theme === 'dark' ? 'imp-dark' : ''}`}>
      <style>{css}</style>

      <div className="imp-upload">
        <input ref={inputRef} type="file" accept=".xlsx" onChange={pilihFile} />
        <button className="imp-btn imp-btn-primary" onClick={cekData} disabled={!file || mengecek}>
          <Upload size={14} /> {mengecek ? 'Memeriksa…' : 'Cek Data'}
        </button>
      </div>
      <p className="imp-hint">Hanya .xlsx, maksimal 2 MB. Belum ada data yang disimpan sebelum Anda menekan Simpan.</p>

      {error && <div className="imp-alert imp-alert-err">{error}</div>}
      {sukses && <div className="imp-alert imp-alert-ok">{sukses}</div>}

      {hasil && (
        <>
          <div className="imp-stats">
            <div className="imp-stat"><b>{hasil.total}</b><span>Total baris</span></div>
            <div className="imp-stat ok"><b>{hasil.jumlah_valid}</b><span>Baris valid</span></div>
            <div className="imp-stat bad"><b>{hasil.jumlah_error}</b><span>Baris error</span></div>
          </div>

          {hasil.jumlah_valid > 0 && (
            <>
              <div className="imp-h">Pratinjau baris valid</div>
              <div className="imp-wrap">
                <table className="imp-table">
                  <thead>
                    <tr><th>Baris</th>{kolomValid.map((k) => <th key={k.label}>{k.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {hasil.valid.map((v) => (
                      <tr key={v.baris}>
                        <td>{v.baris}</td>
                        {kolomValid.map((k) => <td key={k.label}>{k.render(v)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {adaError && (
            <>
              <div className="imp-h">Baris error ({barisError.length} masalah)</div>
              <div className="imp-wrap">
                <table className="imp-table">
                  <thead><tr><th>Baris</th><th>Kolom</th><th>Pesan</th></tr></thead>
                  <tbody>
                    {barisError.map((b, i) => (
                      <tr key={i}><td>{b.baris}</td><td>{b.kolom}</td><td>{b.pesan}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="imp-mode">
                <label>
                  <input type="radio" name="imp-mode" checked={mode === 'valid_only'} onChange={() => setMode('valid_only')} />
                  <span>Simpan hanya baris valid (baris error dilewati)</span>
                </label>
                <label>
                  <input type="radio" name="imp-mode" checked={mode === 'all_valid'} onChange={() => setMode('all_valid')} />
                  <span>Semua baris harus valid (perbaiki file lalu cek ulang)</span>
                </label>
              </div>
            </>
          )}

          <div className="imp-actions">
            <button className="imp-btn imp-btn-primary" onClick={simpan} disabled={simpanNonaktif}>
              {menyimpan ? 'Menyimpan…' : 'Simpan'}
            </button>
            {adaError && !mode && <span className="imp-hint" style={{ margin: 0 }}>Pilih salah satu opsi di atas untuk mengaktifkan Simpan.</span>}
            {adaError && mode === 'all_valid' && <span className="imp-hint" style={{ margin: 0 }}>Masih ada baris error. Perbaiki file lalu upload ulang.</span>}
          </div>
        </>
      )}
    </div>
  );
}