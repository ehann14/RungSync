import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, DoorOpen, UserCheck,
  GraduationCap, School, BookOpen, ArrowLeftRight, FileDown, FileUp,
  LogOut, CalendarDays, Clock, Moon, Sun, Menu
} from 'lucide-react';
import api from '../services/api';
import { clearUserCache } from './ProtectedRoute';

/* ============ Helper role yang AMAN ============ */
const normalizeRole = (r) => {
  const role = String(r || '').toLowerCase().trim();
  if (role === 'teacher' || role === 'guru') return 'guru';
  if (role === 'student' || role === 'siswa') return 'siswa';
  if (role === 'admin') return 'admin';
  return null;
};

const MENUS = {
  admin: [
    { group: 'Menu', items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    ] },
    { group: 'Akademik', items: [
      { label: 'Manajemen Jadwal', to: '/admin/schedules', icon: <Calendar size={18} /> },
      { label: 'Ruangan', to: '/admin/rooms', icon: <DoorOpen size={18} /> },
      { label: 'Guru', to: '/admin/teachers', icon: <UserCheck size={18} /> },
      { label: 'Siswa', to: '/admin/students', icon: <GraduationCap size={18} /> },
      { label: 'Kelas', to: '/admin/classes', icon: <School size={18} /> },
      { label: 'Mata Pelajaran', to: '/admin/subjects', icon: <BookOpen size={18} /> },
    ] },
    { group: 'Lainnya', items: [
      { label: 'Perpindahan', to: '/admin/room-transfers', icon: <ArrowLeftRight size={18} /> },
      { label: 'Import Jadwal', to: '/admin/import-schedules', icon: <FileUp size={18} /> },
      { label: 'Ekspor Jadwal', to: '/admin/export', icon: <FileDown size={18} /> },
    ] },
  ],
  guru: [
    { group: 'Menu', items: [
      { label: 'Dashboard', to: '/teacher/dashboard', icon: <LayoutDashboard size={18} /> },
    ] },
    { group: 'Mengajar', items: [
      { label: 'Jadwal Saya', to: '/teacher/schedule', icon: <Calendar size={18} /> },
      { label: 'Perpindahan Ruangan', to: '/teacher/room-transfers', icon: <ArrowLeftRight size={18} /> },
    ] },
  ],
  siswa: [
    { group: 'Menu', items: [
      { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    ] },
    { group: 'Belajar', items: [
      { label: 'Jadwal Saya', to: '/student/schedule', icon: <Calendar size={18} /> },
    ] },
  ],
};

const profilePath = (role) =>
  role === 'guru' ? '/teacher/profile' : role === 'siswa' ? '/student/profile' : '/admin/profile';

const roleLabel = (role) =>
  role === 'guru' ? 'Guru' : role === 'siswa' ? 'Siswa' : 'Admin';

const css = `
.lay{display:flex;min-height:100vh;font-family:'Plus Jakarta Sans',system-ui,sans-serif;
--content-bg:#f2f3fa;--header-bg:#ffffff;--header-text:#0f172a;--header-line:#eef0f8;
--side-bg:#ffffff;--side-line:#eef0f8;--side-text:#8a8fa3;--side-strong:#1e1b3a;--side-hover:#f4f4fb;
--side-group:#b7b9c9;--primary:#2563eb;--primary2:#2563eb;--card:#ffffff;}
.lay.dark{--content-bg:#0b0f1e;--header-bg:#12162a;--header-text:#e7e9f5;--header-line:#22273f;
--side-bg:#12162a;--side-line:#22273f;--side-text:#8790b8;--side-strong:#f1f2fb;--side-hover:#1b2036;
--side-group:#4a5178;--card:#161a30;}

.lay-sidebar{width:250px;position:fixed;top:0;left:0;bottom:0;z-index:70;
background:var(--side-bg);border-right:1px solid var(--side-line);
display:flex;flex-direction:column;padding:20px 16px;transition:background .2s,border-color .2s;}

.lay-logo{display:flex;align-items:center;justify-content:center;gap:8px;padding:4px 10px 22px;}
.lay-logo img{max-width:118px;height:auto;object-fit:contain;user-select:none;}

.lay-nav{flex:1;display:flex;flex-direction:column;gap:18px;overflow-y:auto;}
.lay-group-label{font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
color:var(--side-group);padding:0 12px;margin-bottom:2px;}
.lay-group{display:flex;flex-direction:column;gap:3px;}
.lay-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;
color:var(--side-text);text-decoration:none;font-size:13.5px;font-weight:600;transition:.15s;}
.lay-link:hover{background:var(--side-hover);color:var(--side-strong);}
.lay-link.active{background:var(--primary);color:#fff;
box-shadow:0 8px 18px rgba(37,99,235,.32);}

.lay-logout{margin-top:14px;border:none;border-radius:12px;padding:12px;cursor:pointer;
background:var(--side-hover);color:#e11d48;font-weight:700;font-size:13px;
display:flex;align-items:center;justify-content:center;gap:8px;transition:.15s;}
.lay-logout:hover{background:rgba(225,29,72,.12);}

.lay-main{flex:1;margin-left:250px;display:flex;flex-direction:column;min-width:0;}

.lay-header{position:sticky;top:0;z-index:50;display:flex;justify-content:space-between;align-items:center;gap:10px;
padding:16px 26px;background:var(--header-bg);color:var(--header-text);
border-bottom:1px solid var(--header-line);transition:background .2s,border-color .2s;}

.lay-header-left{display:flex;flex-direction:column;gap:2px;min-width:0;}
.lay-title{font-size:18px;font-weight:800;margin:0;}
.lay-date{font-size:12px;color:#8a8fa3;display:flex;align-items:center;gap:6px;}
.lay-header-right{display:flex;align-items:center;gap:12px;}
.lay-burger{display:none;border:none;background:transparent;color:var(--header-text);
cursor:pointer;padding:4px 10px;border-radius:8px;line-height:1;}

.lay-clock{background:var(--side-hover);color:var(--header-text);border-radius:12px;
padding:8px 14px;font-size:12.5px;font-weight:700;white-space:nowrap;display:flex;align-items:center;gap:6px;}
.lay-icbtn{border:none;border-radius:12px;width:38px;height:38px;cursor:pointer;
background:var(--side-hover);color:var(--header-text);display:flex;align-items:center;justify-content:center;transition:.15s;}
.lay-icbtn:hover{background:rgba(37,99,235,.14);color:var(--primary);}

.lay-user{display:flex;align-items:center;gap:10px;padding-left:10px;border-left:1px solid var(--header-line);}
.lay-user-txt{display:flex;flex-direction:column;line-height:1.25;}
.lay-name{font-size:13px;font-weight:800;color:var(--header-text);white-space:nowrap;}
.lay-role{font-size:11px;color:#8a8fa3;font-weight:600;}
.lay-avatar{width:38px;height:38px;border-radius:50%;color:#fff;font-weight:800;flex:none;
background:var(--primary);display:flex;align-items:center;justify-content:center;
text-decoration:none;cursor:pointer;transition:transform .18s;font-size:14px;}
.lay-avatar:hover{transform:scale(1.06);}

.lay-content{flex:1;padding:24px 26px;background:var(--content-bg);transition:background .2s;}
.lay-loading{flex:1;display:flex;align-items:center;justify-content:center;color:#8a8fa3;font-size:14px;}
.lay-scrim{position:fixed;inset:0;background:rgba(15,17,33,.5);z-index:60;}

@media (max-width:900px){
  .lay-sidebar{width:270px;transform:translateX(-105%);transition:transform .25s ease;
  box-shadow:0 0 40px rgba(2,6,23,.35);}
  .lay.menu-open .lay-sidebar{transform:translateX(0);}
  .lay-main{margin-left:0;}
  .lay-burger{display:block;}
  .lay-header{padding:12px 16px;}
  .lay-title{font-size:16px;}
  .lay-date{display:none;}
  .lay-user-txt{display:none;}
  .lay-clock{padding:6px 10px;font-size:11px;}
  .lay-content{padding:16px;}
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
      .then((res) => {
        const userData = res.data?.data || res.data?.user || res.data;
        setUser(userData);

        // Jika role tidak valid, paksa logout
        const role = normalizeRole(userData?.role);
        if (!role) {
          handleLogout();
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch { /* abaikan */ }
    clearUserCache();
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  if (!user) return <div className="lay-loading">Memuat…</div>;

  const role = normalizeRole(user.role);
  const groups = MENUS[role] || [];

  const dateLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const currentLabel =
    groups.flatMap((g) => g.items).find((m) => location.pathname.startsWith(m.to))?.label || 'Dashboard';

  return (
    <div className={`lay ${theme === 'dark' ? 'dark' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <style>{css}</style>

      {menuOpen && <div className="lay-scrim" onClick={() => setMenuOpen(false)} />}

      <aside className="lay-sidebar">
        <div className="lay-logo">
          <img src="/logo.png" alt="RungSync Logo" />
        </div>

        <nav className="lay-nav">
          {groups.map((g) => (
            <div className="lay-group" key={g.group}>
              <div className="lay-group-label">{g.group}</div>
              {g.items.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => 'lay-link' + (isActive ? ' active' : '')}
                >
                  {m.icon} <span>{m.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button className="lay-logout" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <div className="lay-main">
        <header className="lay-header">
          <div className="lay-header-left">
            <button className="lay-burger" onClick={() => setMenuOpen(true)} title="Buka menu">
              <Menu size={20} />
            </button>
            <h1 className="lay-title">{currentLabel}</h1>
            <span className="lay-date">
              <CalendarDays size={13} /> {dateLabel}
            </span>
          </div>
          <div className="lay-header-right">
            <span className="lay-clock">
              <Clock size={14} /> {timeLabel}
            </span>
            <button
              className="lay-icbtn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Ganti tema"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <div className="lay-user">
              <div className="lay-user-txt">
                <span className="lay-name">{user.name}</span>
                <span className="lay-role">{roleLabel(role)}</span>
              </div>
              <NavLink to={profilePath(role)} className="lay-avatar" title="Lihat profil">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </NavLink>
            </div>
          </div>
        </header>

        <main className="lay-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}