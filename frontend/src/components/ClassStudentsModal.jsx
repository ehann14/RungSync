import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';

// Warna memakai variabel --mdl-* dari Modal, jadi otomatis mengikuti mode terang/gelap.
const css = `
.cs-total{font-size:13px;color:var(--mdl-muted);margin:0 0 12px;}
.cs-search{position:relative;margin-bottom:12px;}
.cs-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mdl-muted);}
.cs-search input{width:100%;box-sizing:border-box;padding:9px 12px 9px 32px;border-radius:8px;border:1px solid var(--mdl-border);background:transparent;color:var(--mdl-text);font-size:13px;outline:none;}
.cs-search input:focus{border-color:#2563eb;}
.cs-wrap{max-height:46vh;overflow:auto;border:1px solid var(--mdl-border);border-radius:10px;}
.cs-table{width:100%;border-collapse:collapse;font-size:13px;color:var(--mdl-text);}
.cs-table th{position:sticky;top:0;background:var(--mdl-card);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;padding:10px 12px;border-bottom:1px solid var(--mdl-border);}
.cs-table td{padding:10px 12px;border-top:1px solid var(--mdl-border);}
.cs-empty{text-align:center;color:var(--mdl-muted);padding:26px 0;font-size:13px;}
.cs-error{color:#ef4444;font-size:13px;}
`;

export default function ClassStudentsModal({ kelas, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!kelas) return undefined;
    let batal = false;
    setLoading(true); setError(''); setData(null); setQ('');
    api.get(`/admin/classes/${kelas.id}/students`)
      .then((res) => { if (!batal) setData(res.data); })
      .catch((err) => { if (!batal) setError(err.response?.data?.message || 'Gagal memuat data murid.'); })
      .finally(() => { if (!batal) setLoading(false); });
    return () => { batal = true; };
  }, [kelas]);

  const tampil = useMemo(() => {
    const daftar = data?.students || [];
    const kata = q.toLowerCase().trim();
    if (!kata) return daftar;
    return daftar.filter((s) =>
      (s.name || '').toLowerCase().includes(kata) || String(s.nis || '').toLowerCase().includes(kata));
  }, [data, q]);

  return (
    <Modal open={!!kelas} title={`Murid Kelas ${kelas?.name ?? ''}`} onClose={onClose} width={680}>
      <style>{css}</style>

      {loading && <div className="cs-empty">Memuat…</div>}
      {error && <div className="cs-error">{error}</div>}

      {data && (
        <>
          <p className="cs-total">Total murid: <strong>{data.total}</strong></p>

          {data.total === 0 ? (
            <div className="cs-empty">Belum ada murid di kelas ini</div>
          ) : (
            <>
              <div className="cs-search">
                <Search size={15} />
                <input
                  placeholder="Cari nama atau NIS…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="cs-wrap">
                <table className="cs-table">
                  <thead>
                    <tr><th>No</th><th>NIS</th><th>Nama</th><th>Email</th></tr>
                  </thead>
                  <tbody>
                    {tampil.length === 0 ? (
                      <tr><td colSpan={4} className="cs-empty">Tidak ada murid yang cocok.</td></tr>
                    ) : tampil.map((s, i) => (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td>{s.nis || '-'}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
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