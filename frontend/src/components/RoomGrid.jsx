import { fmtTime } from '../utils';

export default function RoomGrid({ rooms }) {
  return (
    <div className="room-grid">
      {rooms.map((r) => (
        <div key={r.id} className={`room-card ${r.status}`}>
          <h3>{r.status === 'digunakan' ? '🔴' : '🟢'} {r.name}</h3>
          {r.status === 'digunakan' && r.active_schedule ? (
            <>
              <span className="badge used">Digunakan</span>
              <p className="room-class">{r.active_schedule.class?.name}</p>
              <p>📚 {r.active_schedule.subject?.name}</p>
              <p>🧑‍ {r.active_schedule.teacher?.user?.name}</p>
              <p className="room-time">🕐 {fmtTime(r.active_schedule.start_time)}–{fmtTime(r.active_schedule.end_time)}</p>
            </>
          ) : (
            <span className="badge free">Kosong</span>
          )}
        </div>
      ))}
    </div>
  );
}