import type { CalculationRecord } from "@/types/calculation";
import type { HistoryStatus } from "@/repositories/history";
export function HistoryPanel({
  records,
  onClear,
  error,
  loading,
  status,
}: {
  records: CalculationRecord[];
  onClear?: () => void;
  loading: boolean;
  status: HistoryStatus;
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
        {onClear && (
          <button
            className="text-button"
            disabled={loading || !records.length}
            onClick={onClear}
          >
            Clear history
          </button>
        )}
      </div>
      <p className="history-caption">
        {status === "local"
          ? "Your last 10 calculations, all in one place."
          : "Shared public history · latest 10 calculations."}
      </p>
      {error && (
        <p role="status" className="history-error">
          {error}
        </p>
      )}
      {loading ? (
        <div className="empty-history" role="status">
          <p>Loading history…</p>
        </div>
      ) : records.length ? (
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
      {status === "offline" && (
        <p className="history-caption">
          New calculations stay on this page. Reload to reconnect; local entries
          are not synced.
        </p>
      )}
      <div className="history-note" role="status">
        <span className="status-dot" />
        <span>
          {status === "shared"
            ? "Shared history"
            : status === "offline"
              ? "History offline"
              : "Session history"}
        </span>
        <span>
          {loading
            ? "Connecting…"
            : status === "shared"
              ? "Public · saved to Supabase"
              : status === "offline"
                ? "Using local history"
                : "Clears on refresh"}
        </span>
      </div>
    </aside>
  );
}
