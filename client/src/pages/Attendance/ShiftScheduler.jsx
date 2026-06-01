import { CalendarDays } from 'lucide-react';

export default function ShiftScheduler() {
  return (
    <div>
      <div className="page-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CalendarDays
            size={28}
            color="var(--primary)"
          />

          <h1 className="page-title">
            Shift Scheduler
          </h1>
        </div>
      </div>

      <div className="card card-body empty-state">
        <div
          className="empty-icon"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarDays
            size={52}
            color="var(--primary)"
          />
        </div>

        <h3>Shift Scheduling</h3>

        <p>
          Shift scheduling module —
          configure team rosters and
          working patterns here.
        </p>
      </div>
    </div>
  );
}