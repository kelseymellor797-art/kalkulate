import type { GraphEntry } from "./graphing-workspace";

export function FunctionTape({ entries, onToggle, onRemove, onClear }: { entries: GraphEntry[]; onToggle: (id: string) => void; onRemove: (id: string) => void; onClear: () => void }) {
  return (
    <section className="function-tape" aria-labelledby="function-tape-title">
      <div className="history-top"><div><span className="eyebrow">GRAPH CALCULATOR</span><h2 id="function-tape-title">Functions <span className="count">{entries.length.toString().padStart(2, "0")}</span></h2></div><button className="text-button" disabled={!entries.length} onClick={onClear}>Clear functions</button></div>
      {!entries.length ? <div className="empty-history"><div className="history-glyph" aria-hidden="true">∿</div><h3>No curves yet.</h3><p>Add a function above<br />to start plotting.</p><span className="empty-rule" /></div> : <ul className="function-list">{entries.map((entry) => <li key={entry.id} className={!entry.visible ? "function-hidden" : ""}><span className="curve-dot" style={{ background: entry.color }} aria-hidden="true" /><span className="function-label">{entry.normalized}</span><button className="icon-button" aria-label={`${entry.visible ? "Hide" : "Show"} ${entry.normalized}`} onClick={() => onToggle(entry.id)}>{entry.visible ? "◉" : "○"}</button><button className="icon-button remove" aria-label={`Remove ${entry.normalized}`} onClick={() => onRemove(entry.id)}>×</button></li>)}</ul>}
    </section>
  );
}

