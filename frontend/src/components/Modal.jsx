import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* ---------- Deteksi tema aplikasi (light/dark) ---------- */
export function useAppTheme() {
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

  const [theme, setTheme] = useState(detect);
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
.mdl-overlay{position:fixed;inset:0;z-index:1000;padding:16px;
display:flex;align-items:center;justify-content:center;
background:rgba(15,23,42,.5);backdrop-filter:blur(2px);
--mdl-card:#ffffff;--mdl-border:#e2e8f0;--mdl-text:#0f172a;--mdl-muted:#64748b;}
.mdl-overlay.mdl-dark{background:rgba(2,6,23,.72);
--mdl-card:#0d1930;--mdl-border:#1c2b45;--mdl-text:#f1f5f9;--mdl-muted:#94a3b8;}
.mdl-box{width:460px;max-width:100%;max-height:88vh;overflow:auto;
background:var(--mdl-card);border:1px solid var(--mdl-border);
border-radius:14px;padding:20px 22px;box-shadow:0 20px 60px rgba(2,6,23,.35);}
.mdl-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.mdl-head h3{margin:0;font-size:17px;font-weight:700;color:var(--mdl-text);}
.mdl-close{background:transparent;border:none;color:var(--mdl-muted);font-size:16px;cursor:pointer;padding:4px;}
.mdl-close:hover{color:var(--mdl-text);}
`;

export default function Modal({ open, title, onClose, children }) {
  const theme = useAppTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // createPortal => modal selalu dirender di <body>,
  // tidak terpengaruh scroll/transform/animasi container halaman.
  return createPortal(
    <div className={`mdl-overlay ${theme === 'dark' ? 'mdl-dark' : ''}`} onMouseDown={onClose}>
      <style>{css}</style>
      <div className="mdl-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mdl-head">
          <h3>{title}</h3>
          <button className="mdl-close" onClick={onClose} type="button">✕</button>
        </div>
        <div className="mdl-body">{children}</div>
      </div>
    </div>,
    document.body
  );
} 