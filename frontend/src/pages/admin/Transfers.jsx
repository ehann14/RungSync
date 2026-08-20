import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

function useAppTheme() {
  const detect = () => {
    const nodes = [document.documentElement, document.body];
    for (const el of nodes) {
      const attr = (el.getAttribute('data-theme') || '').toLowerCase();
      if (attr.includes('light')) return 'light';
      if (attr.includes('dark')) return 'dark';
      const cls = typeof el.className === 'string' ? el.className : '';
      if (/(^|\s)(light|light-mode|theme-light)(\s|$)/.test(cls)) return 'light';
      if (/(^|\s)(dark|dark-mode|theme-dark)(\s|$)/.test(cls)) return 'dark';
    }
    const stored = (localStorage.getItem('theme') || '').toLowerCase();
    if (stored.includes('light')) return 'light';
    if (stored.includes('dark')) return 'dark';
    return 'light';
  };
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const update = () => setTheme(detect());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'], subtree: true });
    window.addEventListener('storage', update);
    return () => { mo.disconnect(); window.removeEventListener('storage', update); };
  }, []);
  return theme;
}

const css = `
.atr{padding:8px 4px;
--card:#0d1930;--card-border:#1c2b45;--text:#e2e8f0;--text-strong:#f1f5f9;--muted:#64748b;
--th-bg:#132340;--th-text:#8ab4f8;--row-line:#16263f;--row-hover:rgba(37,99,235,.06);}
.atr.atr-light{--card:#ffffff;--card-border:#e2e8f0;--text:#334155;--text-strong:#0f172a;--muted:#64748b;
--th-bg:#f1f5f9;--th-text:#1d4ed8;--row-line:#e2e8f0;--row-hover:rgba(37,99,235,.05);}
.atr h2{font-size:22px;font-weight:800;color:var(--text-strong);margin:0 0 18px;display:flex;align-items:center;gap:8px;}
.atr-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;overflow:hidden;
box-shadow:0 1px 3px rgba(15,23,42,.08);}
.atr-table-wrap{overflow-x:auto;}
.atr-table{width:100%;border-collapse:collapse;}
.atr-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.atr-table td{padding:12px 16px;border-top:1px solid var(--row-line);color:var(--text);font-size:13.5px;}
.atr-table tr:hover td{background:var(--row-hover);}
.atr-empty{text-align:center;color:var(--muted);padding:24px 0 !important;}
.atr-badge{display:inline-block;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.atr-badge.pending{background:rgba(234,179,8,.15);color:#a16207;}
.atr-badge.approved{background:rgba(34,197,94,.15);color:#15803d;}
.atr-badge.rejected{background:rgba(239,68,68,.15);color:#b91c1c;}
.atr-light .atr-badge.pending{color:#a16207;} .atr-light .atr-badge.approved{color:#15803d;} .atr-light .atr-badge.rejected{color:#b91c1c;}
`;

const STATUS_LABEL = {
  pending: 'Menunggu',
  menunggu: 'Menunggu',
  approved: 'Disetujui',
  disetujui: 'Disetujui',
  rejected: 'Ditolak',
  ditolak: 'Ditolak',
};
const STATUS_CLS = {
  pending: 'pending', menunggu: 'pending',
  approved: 'approved', disetujui: 'approved',
  rejected: 'rejected', ditolak: 'rejected',
};

export default function AdminTransfers() {
  const theme = useAppTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/room-transfers');
      setRows(res.data?.data || res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader text="Memuat riwayat perpindahan…" />;

  return (
    <div className={`atr ${theme === 'light' ? 'atr-light' : ''}`}>
      <style>{css}</style>

      <h2>
        Monitoring Perpindahan Ruangan <ArrowLeftRight size={20} />
      </h2>

      <div className="atr-card">
        <div className="atr-table-wrap">
          <table className="atr-table">
            <thead>
              <tr>
                <th>Tanggal Berlaku</th><th>Guru</th><th>Kelas</th><th>Mapel</th>
                <th>Dari</th><th>Ke</th><th>Alasan</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td className="atr-empty" colSpan="8">Belum ada permintaan perpindahan ruangan.</td></tr>
              ) : (
                rows.map((t) => {
                  const st = String(t.status || '').toLowerCase();
                  return (
                    <tr key={t.id}>
                      <td><b>{fmtDate(t.date || t.transfer_date || t.effective_date)}</b></td>
                      <td>{t.teacher?.user?.name || t.schedule?.teacher?.user?.name || '-'}</td>
                      <td>{t.schedule?.class?.name || t.class?.name || '-'}</td>
                      <td>{t.schedule?.subject?.name || '-'}</td>
                      <td>{t.from_room?.name || t.schedule?.room?.name || '-'}</td>
                      <td><b>{t.to_room?.name || t.room?.name || '-'}</b></td>
                      <td>{t.reason || '-'}</td>
                      <td>
                        <span className={`atr-badge ${STATUS_CLS[st] || 'pending'}`}>
                          {STATUS_LABEL[st] || t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}