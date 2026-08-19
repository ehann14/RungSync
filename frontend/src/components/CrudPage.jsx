import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import Modal, { useAppTheme } from './Modal';

const css = `
.crud-page{padding:8px 4px;
--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;
--muted:#64748b;--label:#475569;--th-bg:#f1f5f9;--th-text:#1d4ed8;
--line:#e2e8f0;--hover:rgba(37,99,235,.05);
--input-bg:#ffffff;--input-border:#cbd5e1;
--edit-bg:rgba(37,99,235,.08);--edit-text:#1d4ed8;--edit-border:rgba(37,99,235,.35);}
.crud-page.crud-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;
--muted:#64748b;--label:#94a3b8;--th-bg:#132340;--th-text:#8ab4f8;
--line:#16263f;--hover:rgba(37,99,235,.06);
--input-bg:#12203a;--input-border:#24344f;
--edit-bg:rgba(37,99,235,.15);--edit-text:#93c5fd;--edit-border:rgba(37,99,235,.4);}
.crud-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
.crud-header h2{font-size:22px;font-weight:800;color:var(--strong);margin:0;}
.crud-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;}
.crud-btn-primary{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.crud-btn-primary:hover{filter:brightness(1.1);}
.crud-btn-primary:disabled{opacity:.6;cursor:wait;}
.crud-btn-edit{background:var(--edit-bg);color:var(--edit-text);border:1px solid var(--edit-border);}
.crud-btn-danger{background:linear-gradient(90deg,#f97316,#ef4444);color:#fff;}
.crud-btn-sm{padding:6px 11px;font-size:12px;border-radius:6px;margin-right:6px;}
.crud-table-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.crud-table-wrap{overflow-x:auto;}
.crud-table{width:100%;border-collapse:collapse;}
.crud-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.crud-table td{padding:13px 16px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.crud-table tr:hover td{background:var(--hover);}
.crud-empty{text-align:center;color:var(--muted);padding:24px 0 !important;}
.crud-form-group{margin-bottom:12px;}
.crud-form-group label{display:block;font-size:12px;color:var(--label);margin-bottom:6px;font-weight:600;}
.crud-input,.crud-select{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;}
.crud-input:focus,.crud-select:focus{border-color:#2563eb;}
.crud-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);color:#fca5a5;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:12px;}
.crud-page:not(.crud-dark) .crud-error{background:rgba(239,68,68,.08);color:#b91c1c;}
`;

export default function CrudPage({ title, endpoint, columns, fields }) {
  const theme = useAppTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/${endpoint}`);
      setRows(res.data.data || res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    const init = {};
    fields.forEach((f) => { init[f.name] = ''; });
    setForm(init); setError(''); setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const init = {};
    fields.forEach((f) => { init[f.name] = row[f.name] ?? ''; });
    setForm(init); setError(''); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/admin/${endpoint}/${editing.id}`, form);
      else await api.post(`/admin/${endpoint}`, form);
      setModalOpen(false); load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus ${row.name || 'data'} ini?`)) return;
    try { await api.delete(`/admin/${endpoint}/${row.id}`); load(); }
    catch { alert('Gagal menghapus.'); }
  };

  return (
    <div className={`crud-page ${theme === 'dark' ? 'crud-dark' : ''}`}>
      <style>{css}</style>

      <div className="crud-header">
        <h2>{title}</h2>
        <button className="crud-btn crud-btn-primary" onClick={openCreate}>+ Tambah</button>
      </div>

      <div className="crud-table-card">
        <div className="crud-table-wrap">
          <table className="crud-table">
            <thead>
              <tr>
                {columns.map((c, i) => <th key={i}>{c.label}</th>)}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="crud-empty" colSpan={columns.length + 1}>Memuat…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="crud-empty" colSpan={columns.length + 1}>Belum ada data.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c, i) => (
                      <td key={i}>{c.render ? c.render(row) : row[c.key]}</td>
                    ))}
                    <td>
                      <button className="crud-btn crud-btn-edit crud-btn-sm" onClick={() => openEdit(row)}>Edit</button>
                      <button className="crud-btn crud-btn-danger crud-btn-sm" onClick={() => handleDelete(row)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit' : 'Tambah'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {fields.map((f) => (
            <div className="crud-form-group" key={f.name}>
              <label>{f.label}</label>
              {f.options ? (
                <select
                  className="crud-select"
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                >
                  <option value="">— pilih —</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  className="crud-input"
                  type={f.type || 'text'}
                  value={form[f.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              )}
            </div>
          ))}

          {error && <div className="crud-error">{error}</div>}

          <button className="crud-btn crud-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}