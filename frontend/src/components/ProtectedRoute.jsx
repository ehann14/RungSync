import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

/* teacher/guru & student/siswa dianggap sama */
export const normalizeRole = (r) => {
  const v = (r || '').toString().toLowerCase();
  if (v === 'teacher' || v === 'guru') return 'guru';
  if (v === 'student' || v === 'siswa') return 'siswa';
  if (v === 'admin') return 'admin';
  return null;
};

export const HOME_BY_ROLE = {
  admin: '/admin/dashboard',
  guru: '/teacher/dashboard',
  siswa: '/student/dashboard',
};

/* cache user agar nested ProtectedRoute tidak fetch /me berulang */
const userCache = { value: null, loading: null };

function useSharedUser() {
  const [user, setUser] = useState(userCache.value);
  const [loading, setLoading] = useState(!userCache.value);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (userCache.value) {
      setUser(userCache.value);
      setLoading(false);
      return;
    }

    if (userCache.loading) {
      userCache.loading.then((u) => {
        if (mounted.current) { setUser(u); setLoading(false); }
      });
      return () => { mounted.current = false; };
    }

    const promise = api.get('/me')
      .then((res) => {
        userCache.value = res.data?.data || res.data?.user || res.data || null;
        return userCache.value;
      })
      .catch(() => { userCache.value = null; return null; })
      .finally(() => { userCache.loading = null; });

    userCache.loading = promise;
    promise.then((u) => {
      if (mounted.current) { setUser(u); setLoading(false); }
    });

    return () => { mounted.current = false; };
  }, []);

  return { user, loading };
}

export const clearUserCache = () => {
  userCache.value = null;
  userCache.loading = null;
};

/*
  Pemakaian di App.jsx:
    <ProtectedRoute><Layout /></ProtectedRoute>                  → cukup login
    <ProtectedRoute roles={['teacher','guru']}>...</ProtectedRoute>  → khusus role
*/
export default function ProtectedRoute({ role, roles, allowed, children }) {
  const list = roles || allowed || (role ? [role] : null);
  const { user, loading } = useSharedUser();

  if (loading) {
    return <div style={{ padding: 24, color: '#64748b', fontSize: 14 }}>Memuat…</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  const norm = normalizeRole(user.role);
  if (!norm) return <Navigate to="/login" replace />;

  if (list) {
    const arr = Array.isArray(list) ? list : [list];
    const allowedNorm = arr.map(normalizeRole).filter(Boolean);
    const ok = allowedNorm.includes(norm);
    if (!ok) {
      // akses ditolak → lempar ke beranda rolenya sendiri (anti-loop, anti-nyasar)
      return <Navigate to={HOME_BY_ROLE[norm] || '/login'} replace />;
    }
  }

  return children ? children : <Outlet />;
}