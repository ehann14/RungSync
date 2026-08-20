import { Zap } from 'lucide-react';

const css = `
.pl-wrap{min-height:62vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
.pl-spin{position:relative;width:84px;height:84px;display:flex;align-items:center;justify-content:center;}
.pl-spin::before{content:'';position:absolute;inset:0;border-radius:50%;
border:4px solid rgba(37,99,235,.15);border-top-color:#2563eb;border-right-color:#06b6d4;
animation:plRot .9s linear infinite;}
.pl-spin::after{content:'';position:absolute;inset:10px;border-radius:50%;
border:3px solid rgba(6,182,212,.12);border-bottom-color:#06b6d4;
animation:plRot 1.4s linear infinite reverse;}
.pl-emo{width:36px;height:36px;color:#2563eb;animation:plPulse 1.2s ease-in-out infinite;}
.pl-text{font-size:13px;font-weight:700;color:#64748b;letter-spacing:.03em;}
.pl-dots{display:flex;gap:6px;}
.pl-dots i{width:7px;height:7px;border-radius:50%;background:linear-gradient(90deg,#2563eb,#06b6d4);
animation:plBounce 1s infinite;}
.pl-dots i:nth-child(2){animation-delay:.15s;}
.pl-dots i:nth-child(3){animation-delay:.3s;}
@keyframes plRot{to{transform:rotate(360deg)}}
@keyframes plPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@keyframes plBounce{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(-7px);opacity:1}}
`;

export default function PageLoader({ text = 'Memuat data…' }) {
  return (
    <div className="pl-wrap">
      <style>{css}</style>
      <div className="pl-spin">
        <Zap className="pl-emo" />
      </div>
      <div className="pl-text">{text}</div>
      <div className="pl-dots"><i /><i /><i /></div>
    </div>
  );
}