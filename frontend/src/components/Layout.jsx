import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Calendar, DoorOpen, UserCheck,
  GraduationCap, School, BookOpen, ArrowLeftRight,
  Zap, LogOut, CalendarDays, Clock, Moon, Sun, Menu
} from 'lucide-react';
import api from '../services/api';

/* ============ Menu per role ============ */
const MENUS = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Profil Saya', to: '/admin/profile', icon: <User size={18} /> },
    { label: 'Manajemen Jadwal', to: '/admin/schedules', icon: <Calendar size={18} /> },
    { label: 'Ruangan', to: '/admin/rooms', icon: <DoorOpen size={18} /> },
    { label: 'Guru', to: '/admin/teachers', icon: <UserCheck size={18} /> },
    { label: 'Siswa', to: '/admin/students', icon: <GraduationCap size={18} /> },
    { label: 'Kelas', to: '/admin/classes', icon: <School size={18} /> },
    { label: 'Mata Pelajaran', to: '/admin/subjects', icon: <BookOpen size={18} /> },
    { label: 'Perpindahan', to: '/admin/room-transfers', icon: <ArrowLeftRight size={18} /> },
  ],
  guru: [
    { label: 'Dashboard', to: '/teacher/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Profil Saya', to: '/teacher/profile', icon: <User size={18} /> },
    { label: 'Jadwal Saya', to: '/teacher/schedule', icon: <Calendar size={18} /> },
    { label: 'Perpindahan Ruangan', to: '/teacher/room-transfers', icon: <ArrowLeftRight size={18} /> },
  ],
  siswa: [
    { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Profil Saya', to: '/student/profile', icon: <User size={18} /> },
    { label: 'Jadwal Saya', to: '/student/schedule', icon: <Calendar size={18} /> },
  ],
};

const normalizeRole = (r) => {
  if (r === 'teacher' || r === 'guru') return 'guru';
  if (r === 'student' || r === 'siswa') return 'siswa';
  return 'admin';
};

const profilePath = (role) =>
  role === 'guru' ? '/teacher/profile' : role === 'siswa' ? '/student/profile' : '/admin/profile';

const css = `
.lay{display:flex;min-height:100vh;
--content-bg:#f1f5f9;--header-bg:#ffffff;--header-text:#0f172a;--header-line:rgba(148,163,184,.25);}
.lay.dark{--content-bg:#0b1220;--header-bg:#0d1930;--header-text:#e2e8f0;--header-line:#1c2b45;}

.lay-sidebar{width:240px;position:fixed;top:0;left:0;bottom:0;z-index:70;
background:linear-gradient(180deg,#0d1930,#0a1225);display:flex;flex-direction:column;padding:18px 14px;}
.lay-logo{color:#38bdf8;font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px;padding:6px 10px 18px;}
.lay-nav{flex:1;display:flex;flex-direction:column;gap:6px;overflow-y:auto;}
.lay-link{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:10px;
color:#cbd5e1;text-decoration:none;font-size:13.5px;font-weight:600;transition:.2s;}
.lay-link:hover{background:rgba(37,99,235,.15);color:#fff;}
.lay-link.active{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.lay-logout{margin-top:12px;border:none;border-radius:10px;padding:12px;cursor:pointer;
background:linear-gradient(90deg,#f97316,#ef4444);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;}
.lay-logout:hover{filter:brightness(1.1);}

.lay-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;}
.lay-header{display:flex;justify-content:space-between;align-items:center;gap:10px;
padding:12px 22px;background:var(--header-bg);color:var(--header-text);
border-bottom:1px solid var(--header-line);}
.lay-header-left{display:flex;align-items:center;gap:10px;min-width:0;}
.lay-header-right{display:flex;align-items:center;gap:10px;}
.lay-burger{display:none;border:none;background:transparent;color:var(--header-text);
cursor:pointer;padding:4px 10px;border-radius:8px;line-height:1;}
.lay-date{font-size:12.5px;opacity:.8;display:flex;align-items:center;gap:6px;}
.lay-clock{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;border-radius:999px;
padding:6px 14px;font-size:12px;font-weight:700;white-space:nowrap;display:flex;align-items:center;gap:6px;}
.lay-theme{border:none;border-radius:10px;padding:6px 10px;cursor:pointer;
background:transparent;box-shadow:inset 0 0 0 1px var(--header-line);color:var(--header-text);display:flex;align-items:center;}
.lay-role{background:#2563eb;color:#fff;border-radius:999px;padding:5px 12px;
font-size:10.5px;font-weight:800;letter-spacing:.06em;}
.lay-name{font-size:13px;font-weight:700;white-space:nowrap;}
.lay-avatar{width:34px;height:34px;border-radius:50%;color:#fff;font-weight:800;flex:none;
background:linear-gradient(90deg,#2563eb,#06b6d4);display:flex;align-items:center;justify-content:center;
text-decoration:none;cursor:pointer;transition:transform .18s;}
.lay-avatar:hover{transform:scale(1.08);}
.lay-content{flex:1;padding:22px;background:var(--content-bg);}
.lay-loading{flex:1;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;}
.lay-scrim{position:fixed;inset:0;background:rgba(2,6,23,.55);z-index:60;}

/* Atur ukuran dan perilaku ikon SVG agar konsisten */
.lay-link svg, .lay-logout svg, .lay-header svg, .lay-logo svg {
  width: 18px; height: 18px; flex-shrink: 0; color: currentColor;
}
.lay-logo svg { width: 22px; height: 22px; }
.lay-clock svg, .lay-date svg { width: 16px; height: 16px; }

@media (max-width:900px){
  .lay-sidebar{width:260px;transform:translateX(-105%);transition:transform .25s ease;
  box-shadow:0 0 40px rgba(2,6,23,.55);}
  .lay.menu-open .lay-sidebar{transform:translateX(0);}
  .lay-main{margin-left:0;}
  .lay-burger{display:block;}
  .lay-header{padding:10px 14px;}
  .lay-date{display:none;}
  .lay-name{display:none;}
  .lay-clock{padding:5px 10px;font-size:11px;}
  .lay-role{padding:4px 10px;font-size:9.5px;}
  .lay-avatar{width:30px;height:30px;font-size:13px;}
  .lay-content{padding:14px;}
}
@media (max-width:420px){ .lay-clock{display:none;} }
`;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light', theme === 'light');
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    api.get('/me')
      .then((res) => setUser(res.data?.data || res.data?.user || res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch { /* abaikan */ }
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <div className="lay-loading">Memuat…</div>;

  const role = normalizeRole(user.role);
  const menus = MENUS[role] || [];

  const dateLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className={`lay ${theme === 'dark' ? 'dark' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <style>{css}</style>

      {menuOpen && <div className="lay-scrim" onClick={() => setMenuOpen(false)} />}

      <aside className="lay-sidebar">
        <div className="lay-logo">
          <Zap /> RungSync
        </div>
        <nav className="lay-nav">
          {menus.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => 'lay-link' + (isActive ? ' active' : '')}
            >
              {m.icon} <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="lay-logout" onClick={handleLogout}>
          <LogOut /> Logout
        </button>
      </aside>

      <div className="lay-main">
        <header className="lay-header">
          <div className="lay-header-left">
            <button className="lay-burger" onClick={() => setMenuOpen(true)} title="Buka menu">
              <Menu size={20} />
            </button>
            <span className="lay-date">
              <CalendarDays /> {dateLabel}
            </span>
            <span className="lay-clock">
              <Clock /> {timeLabel}
            </span>
          </div>
          <div className="lay-header-right">
            <button
              className="lay-theme"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Ganti tema"
            >
              {theme === 'light' ? <Moon /> : <Sun />}
            </button>
            <span className="lay-role">{role.toUpperCase()}</span>
            <span className="lay-name">{user.name}</span>
            <NavLink to={profilePath(role)} className="lay-avatar" title="Lihat profil">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </NavLink>
          </div>
        </header>

        <main className="lay-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}