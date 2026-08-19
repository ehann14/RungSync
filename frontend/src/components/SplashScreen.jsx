import { useEffect, useState } from 'react';

const css = `
.sp{position:fixed;inset:0;z-index:2000;overflow:hidden;
background:linear-gradient(160deg,#f8fafc 0%,#e9f2fc 55%,#dbeafe 100%);
display:flex;align-items:center;justify-content:center;}
.sp::before,.sp::after{content:'';position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;}
.sp::before{width:420px;height:420px;background:#93c5fd;top:-140px;left:-120px;animation:spFloat 7s ease-in-out infinite;}
.sp::after{width:360px;height:360px;background:#bfdbfe;bottom:-120px;right:-100px;animation:spFloat 8s ease-in-out infinite reverse;}
@keyframes spFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(26px)}}

.sp-leave{animation:spOut .6s ease forwards;}
@keyframes spOut{to{opacity:0;visibility:hidden;transform:scale(1.06);}}

.sp-inner{position:relative;text-align:center;padding:24px;max-width:92vw;}

/* logo gambar (public/logo.png) */
.sp-logo{width:min(560px,86vw);height:auto;user-select:none;
animation:spLogo .9s cubic-bezier(.2,1.4,.4,1) both;}
@keyframes spLogo{
0%{opacity:0;transform:translateY(-60px) scale(.5);}
60%{opacity:1;transform:translateY(6px) scale(1.03);}
100%{opacity:1;transform:none;}}

/* cadangan teks kalau logo.png belum ada */
.sp-fallback{animation:spLogo .9s cubic-bezier(.2,1.4,.4,1) both;}
.sp-emo{font-size:52px;animation:spSpinIn 1s .1s both;}
@keyframes spSpinIn{from{opacity:0;transform:rotate(-180deg) scale(.3)}to{opacity:1;transform:none}}
.sp-fallback h1{font-size:46px;font-weight:900;color:#0f2a52;margin:6px 0 4px;letter-spacing:-.5px;}
.sp-fallback h1 span{color:#2f8fe6;}
.sp-tag{letter-spacing:.35em;font-size:11.5px;color:#33507a;font-weight:700;animation:spTrack 1.2s .5s both;}
@keyframes spTrack{from{opacity:0;letter-spacing:.1em}to{opacity:1;letter-spacing:.35em}}
.sp-slogan{margin:16px auto 0;display:inline-block;background:linear-gradient(90deg,#1668c7,#2f8fe6);
color:#fff;border-radius:999px;padding:9px 20px;font-size:13px;font-weight:600;
box-shadow:0 8px 22px rgba(22,104,199,.35);animation:spUp .8s .8s both;}

/* elemen bawah */
.sp-bar{width:230px;height:5px;background:rgba(22,104,199,.15);border-radius:99px;
margin:26px auto 0;overflow:hidden;animation:spUp .8s 1s both;}
.sp-bar i{display:block;height:100%;width:40%;border-radius:99px;
background:linear-gradient(90deg,#1668c7,#2f8fe6);animation:spLoad 1.1s ease-in-out infinite;}
@keyframes spLoad{0%{transform:translateX(-110%)}100%{transform:translateX(290%)}}
.sp-copy{margin-top:12px;font-size:11px;color:#64748b;animation:spUp .8s 1.15s both;}
@keyframes spUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
`;

export default function SplashScreen({ duration = 2300, onDone }) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), duration);
    const t2 = setTimeout(() => {
      setGone(true);
      if (onDone) onDone();
    }, duration + 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration, onDone]);

  if (gone) return null;

  return (
    <div className={`sp ${leaving ? 'sp-leave' : ''}`}>
      <style>{css}</style>
      <div className="sp-inner">
        {imgOk ? (
          <img
            src="/logo.png"
            alt="RungSync — Sistem Jadwal Ruangan Sekolah"
            className="sp-logo"
            onError={() => setImgOk(false)}
            draggable={false}
          />
        ) : (
          <div className="sp-fallback">
            <div className="sp-emo">⚡</div>
            <h1>Rung<span>Sync</span></h1>
            <div className="sp-tag">SISTEM JADWAL RUANGAN SEKOLAH</div>
            <div className="sp-slogan">📅 Jadwal Teratur, Ruangan Optimal</div>
          </div>
        )}

        <div className="sp-bar"><i /></div>
        <div className="sp-copy">SMK Negeri 11 Bandung · Tahun Pelajaran 2026/2027</div>
      </div>
    </div>
  );
}