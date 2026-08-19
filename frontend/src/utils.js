export const fmtTime = (t) => (t ? t.slice(0, 5).replace(':', '.') : '');
export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const isNow = (s) => {
  const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();
  const day = names[now.getDay()];
  const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  return s.day === day && s.start_time <= t && s.end_time > t;
};

export const homePath = (role) =>
  role === 'admin' ? '/admin/dashboard' : role === 'guru' ? '/teacher/dashboard' : '/student/dashboard';