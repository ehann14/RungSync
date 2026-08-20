import { CircleDot, BookOpen, User, Clock } from 'lucide-react';
import { fmtTime } from '../utils';

export default function RoomGrid({ rooms }) {
  return (
    <div className="room-grid">
      {rooms.map((r) => (
        <div key={r.id} className={`room-card ${r.status}`}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {r.status === 'digunakan' ? (
              <CircleDot size={16} color="#ef4444" fill="#ef4444" />
            ) : (
              <CircleDot size={16} color="#22c55e" fill="#22c55e" />
            )}
            {r.name}
          </h3>
          
          {r.status === 'digunakan' && r.active_schedule ? (
            <>
              <span className="badge used">Digunakan</span>
              
              <p className="room-class" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginTop: '8px' }}>
                {r.active_schedule.class?.name}
              </p>
              
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <BookOpen size={16} /> 
                <span>{r.active_schedule.subject?.name}</span>
              </p>
              
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <User size={16} /> 
                <span>{r.active_schedule.teacher?.user?.name}</span>
              </p>
              
              <p className="room-time" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <Clock size={16} /> 
                <span>{fmtTime(r.active_schedule.start_time)}–{fmtTime(r.active_schedule.end_time)}</span>
              </p>
            </>
          ) : (
            <span className="badge free">Kosong</span>
          )}
        </div>
      ))}
    </div>
  );
}