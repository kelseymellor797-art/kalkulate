import type { CalculationRecord } from "@/types/calculation";
export function HistoryPanel({
  records,
  onClear,
  error,
}: {
  records: CalculationRecord[];
  onClear: () => void;
  error: string | null;
}) {
  return (
    <aside className="history" aria-labelledby="history-title">
      <div className="history-top">
        <div>
          <span className="eyebrow">YOUR WORK, IN VIEW</span>
          <h2 id="history-title">
            History{" "}
            <span className="count">
              {records.length.toString().padStart(2, "0")}
            </span>
          </h2>
        </div>
        <button
          className="text-button"
          disabled={!records.length}
          onClick={onClear}
        >
          Clear history
        </button>
      </div>
      <p className="history-caption">
        Your last 10 calculations, all in one place.
      </p>
      {error && (
        <p role="alert" className="history-error">
          {error}
        </p>
      )}
      {records.length ? (
        <ol className="history-list">
          {records.map((record, index) => (
            <li key={record.id}>
              <div className="record-meta">
                <span>{index === 0 ? "LATEST" : "CALCULATION"}</span>
                <time dateTime={record.created_at}>
                  {new Date(record.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="record-expression">{record.expression} =</p>
              <p className="record-result">{record.result}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-history">
          <div className="history-glyph" aria-hidden="true">
            ↶
          </div>
          <h3>A clean slate.</h3>
          <p>
            Make your first calculation.
            <br />
            We’ll keep the working here.
          </p>
          <span className="empty-rule" />
        </div>
      )}
      <div className="history-note">
        <span className="status-dot" />
        Session history<span>Clears on refresh</span>
      </div>
    </aside>
  );
}
