import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';

// Warna memakai variabel --mdl-* dari Modal, jadi otomatis mengikuti mode terang/gelap.
const css = `
.st-total{font-size:13px;color:var(--mdl-muted);margin:0 0 12px;}
.st-search{position:relative;margin-bottom:12px;}
.st-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mdl-muted);}
.st-search input{width:100%;box-sizing:border-box;padding:9px 12px 9px 32px;border-radius:8px;border:1px solid var(--mdl-border);background:transparent;color:var(--mdl-text);font-size:13px;outline:none;}
.st-search input:focus{border-color:#2563eb;}
.st-wrap{max-height:46vh;overflow:auto;border:1px solid var(--mdl-border);border-radius:10px;}
.st-table{width:100%;border-collapse:collapse;font-size:13px;color:var(--mdl-text);}
.st-table th{position:sticky;top:0;background:var(--mdl-card);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;padding:10px 12px;border-bottom:1px solid var(--mdl-border);}
.st-table td{padding:10px 12px;border-top:1px solid var(--mdl-border);}
.st-badge{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:10.5px;font-weight:700;background:rgba(37,99,235,.15);color:#2563eb;}
.st-empty{text-align:center;color:var(--mdl-muted);padding:26px 0;font-size:13px;}
.st-error{color:#ef4444;font-size:13px;}
`;

export default function SubjectTeachersModal({ mapel, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!mapel) return undefined;
    let batal = false;
    setLoading(true); setError(''); setData(null); setQ('');
    api.get(`/admin/subjects/${mapel.id}/teachers`)
      .then((res) => { if (!batal) setData(res.data); })
      .catch((err) => { if (!batal) setError(err.response?.data?.message || 'Gagal memuat data guru.'); })
      .finally(() => { if (!batal) setLoading(false); });
    return () => { batal = true; };
  }, [mapel]);

  const tampil = useMemo(() => {
    const daftar = data?.teachers || [];
    const kata = q.toLowerCase().trim();
    if (!kata) return daftar;
    return daftar.filter((t) =>
      (t.name || '').toLowerCase().includes(kata)
      || String(t.nip || '').toLowerCase().includes(kata)
      || (t.email || '').toLowerCase().includes(kata));
  }, [data, q]);

  return (
    <Modal open={!!mapel} title={`Guru Pengajar ${mapel?.name ?? ''}`} onClose={onClose} width={680}>
      <style>{css}</style>

      {loading && <div className="st-empty">Memuat…</div>}
      {error && <div className="st-error">{error}</div>}

      {data && (
        <>
          <p className="st-total">Total guru: <strong>{data.total}</strong></p>

          {data.total === 0 ? (
            <div className="st-empty">Belum ada guru yang mengajar mata pelajaran ini</div>
          ) : (
            <>
              <div className="st-search">
                <Search size={15} />
                <input
                  placeholder="Cari nama, NIP, atau email…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="st-wrap">
                <table className="st-table">
                  <thead>
                    <tr><th>No</th><th>NIP</th><th>Nama</th><th>Email</th></tr>
                  </thead>
                  <tbody>
                    {tampil.length === 0 ? (
                      <tr><td colSpan={4} className="st-empty">Tidak ada guru yang cocok.</td></tr>
                    ) : tampil.map((t, i) => (
                      <tr key={t.id}>
                        <td>{i + 1}</td>
                        <td>{t.nip || '-'}</td>
                        <td>
                          {t.name}
                          {t.utama && <span className="st-badge">Mapel utama</span>}
                        </td>
                        <td>{t.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}