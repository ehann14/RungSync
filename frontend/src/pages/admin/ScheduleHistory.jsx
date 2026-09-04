import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';
import { ArrowLeft } from 'lucide-react';

const fmtTime = (t) => (t ? t.slice(0, 5).replace(':', '.') : '');

const css = `
.rsx-page{padding:8px 4px;
--card:#0d1930;--card-border:#1c2b45;--text:#e2e8f0;--text-strong:#f1f5f9;
--muted:#64748b;--label:#94a3b8;--th-bg:#132340;--th-text:#8ab4f8;
--row-line:#16263f;--row-hover:rgba(37,99,235,.06);
--input-bg:#12203a;--input-border:#24344f;}
.rsx-page.rsx-light{--card:#ffffff;--card-border:#e2e8f0;--text:#334155;--text-strong:#0f172a;
--muted:#64748b;--label:#475569;--th-bg:#f1f5f9;--th-text:#1d4ed8;
--row-line:#e2e8f0;--row-hover:rgba(37,99,235,.05);
--input-bg:#ffffff;--input-border:#cbd5e1;}
.rsx-page-header{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
.rsx-page-header h2{font-size:22px;font-weight:800;color:var(--text-strong);margin:0;}
.rsx-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s; display:flex; align-items:center; gap:8px;}
.rsx-btn-secondary{background:var(--input-bg);color:var(--text);border:1px solid var(--input-border);}
.rsx-btn-secondary:hover{background:var(--card-border);}
.rsx-select{background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;min-width:250px;}
.rsx-table-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;overflow:hidden;}
.rsx-table-wrap{overflow-x:auto;}
.rsx-table{width:100%;border-collapse:collapse;}
.rsx-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.rsx-table td{padding:13px 16px;border-top:1px solid var(--row-line);color:var(--text);font-size:13.5px;}
.rsx-table tr:hover td{background:var(--row-hover);}
.rsx-empty{text-align:center;color:var(--muted);padding:40px 0 !important;}
`;

export default function ScheduleHistory() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/academic-periods')
      .then(res => setPeriods(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPeriod) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    api.get(`/admin/schedules/history?academic_period_id=${selectedPeriod}`)
      .then(res => setSchedules(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  return (
    <div className={`rsx-page ${document.documentElement.getAttribute('data-theme') === 'light' ? 'rsx-light' : ''}`}>
      <style>{css}</style>

      <div className="rsx-page-header">
        <button className="rsx-btn rsx-btn-secondary" onClick={() => navigate('/admin/schedules')}>
          <ArrowLeft size={16} /> Kembali ke Jadwal
        </button>
        <h2>Histori Jadwal</h2>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <select 
          className="rsx-select" 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="">-- Pilih Periode Tahun Ajaran --</option>
          {periods.map(p => (
            <option key={p.id} value={p.id}>{p.name} {p.is_active && '(Aktif)'}</option>
          ))}
        </select>
      </div>

      <div className="rsx-table-card">
        <div className="rsx-table-wrap">
          <table className="rsx-table">
            <thead>
              <tr>
                <th>Hari</th><th>Jam</th><th>Kelas</th><th>Mata Pelajaran</th><th>Guru</th><th>Ruangan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="rsx-empty" colSpan="6"><PageLoader text="Memuat histori..." /></td></tr>
              ) : schedules.length === 0 ? (
                <tr><td className="rsx-empty" colSpan="6">
                  {selectedPeriod ? 'Tidak ada jadwal pada periode ini.' : 'Silakan pilih periode untuk melihat jadwal.'}
                </td></tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.day}</td>
                    <td>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</td>
                    <td>{s.class?.name}</td>
                    <td>{s.subject?.name}</td>
                    <td>{s.teacher?.user?.name}</td>
                    <td>{s.room?.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}