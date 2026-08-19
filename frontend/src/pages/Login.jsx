import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/* ============ Helper role (dipakai juga di file lain bila perlu) ============ */
export const normalizeRole = (r) => {
  if (r === 'teacher' || r === 'guru') return 'guru';
  if (r === 'student' || r === 'siswa') return 'siswa';
  return 'admin';
};

export const homeByRole = (r) => {
  const n = normalizeRole(r);
  if (n === 'guru') return '/teacher/dashboard';
  if (n === 'siswa') return '/student/dashboard';
  return '/admin/dashboard';
};

const css = `
.lgn-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;
background:linear-gradient(135deg,#0a1225 0%,#0d1930 60%,#12264a 100%);padding:16px;}
.lgn-card{width:400px;max-width:100%;background:#0d1930;border:1px solid #1c2b45;
border-radius:18px;padding:30px 28px;box-shadow:0 24px 70px rgba(2,6,23,.55);}
.lgn-logo{display:flex;align-items:center;gap:8px;color:#38bdf8;font-size:24px;font-weight:800;
justify-content:center;margin-bottom:6px;}
.lgn-sub{text-align:center;color:#64748b;font-size:12.5px;margin-bottom:22px;}
.lgn-group{margin-bottom:14px;}
.lgn-group label{display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;}
.lgn-input{width:100%;background:#12203a;border:1px solid #24344f;color:#e2e8f0;
border-radius:10px;padding:11px 14px;font-size:13.5px;outline:none;}
.lgn-input:focus{border-color:#2563eb;}
.lgn-eye{float:right;margin-top:-37px;margin-right:10px;background:none;border:none;
cursor:pointer;font-size:14px;color:#64748b;}
.lgn-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);color:#fca5a5;
border-radius:10px;padding:10px 12px;font-size:12.5px;margin-bottom:12px;}
.lgn-btn{width:100%;border:none;border-radius:10px;padding:12px;cursor:pointer;
background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;font-size:14px;font-weight:700;
box-shadow:0 6px 18px rgba(37,99,235,.4);}
.lgn-btn:hover{filter:brightness(1.1);}
.lgn-btn:disabled{opacity:.6;cursor:wait;}
`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/login', { email, password });
      const data = res.data?.data || res.data;

      // simpan token (sesuaikan dengan key yang dipakai services/api)
      const token = data?.token || data?.access_token;
      if (token) localStorage.setItem('token', token);

      // ambil user dari respons login, atau fallback ke /me
      let user = data?.user;
      if (!user) {
        const me = await api.get('/me');
        user = me.data?.data || me.data?.user || me.data;
      }

      // redirect sesuai role (teacher/guru & student/siswa sama-sama didukung)
      navigate(homeByRole(user?.role), { replace: true });
    } catch (err) {
      // ===== bedakan "server mati" vs "kredensial salah" =====
      if (!err.response) {
        setError(
          'Tidak dapat terhubung ke server. Pastikan backend Laravel sedang berjalan ' +
          '(jalankan "php artisan serve" di folder backend), lalu coba lagi.'
        );
      } else {
        setError(err.response.data?.message || 'Email atau password salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lgn-wrap">
      <style>{css}</style>
      <div className="lgn-card">
        <div className="lgn-logo">⚡ RungSync</div>
        <div className="lgn-sub">Sistem Manajemen Jadwal — SMKN 11 Bandung</div>

        <form onSubmit={handleSubmit}>
          <div className="lgn-group">
            <label>Email</label>
            <input
              className="lgn-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@rungsync.sch.id"
            />
          </div>

          <div className="lgn-group">
            <label>Password</label>
            <input
              className="lgn-input"
              type={show ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button className="lgn-eye" type="button" onClick={() => setShow(!show)} title="Tampilkan password">
              {show ? '🙈' : '👁️'}
            </button>
          </div>

          {error && <div className="lgn-error">{error}</div>}

          <button className="lgn-btn" type="submit" disabled={loading}>
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}