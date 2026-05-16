import { timetableRows } from '../data/timetable';

export function TimetableView() {
  return (
    <section className="timetable-view" aria-label="現行時間割">
      <header className="timetable-header">
        <p className="section-kicker">Timetable</p>
        <h1>時間割</h1>
        <p>2020年度以降の時間です。100分授業と休み時間を時刻で確認できます。</p>
      </header>

      <div className="timetable-list">
        {timetableRows.map(row => (
          <article
            className={`timetable-row${row.type === '休み時間' ? ' is-break' : ''}`}
            key={row.id}
          >
            <div>
              <span className="timetable-kind">{row.type}</span>
              <h2>{row.label}</h2>
            </div>
            <p className="timetable-time">{row.time}</p>
            <span className="timetable-duration">{row.duration}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
