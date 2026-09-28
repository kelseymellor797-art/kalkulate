import Link from "next/link";
import { CalculatorWorkspace } from "@/components/calculator-workspace";
export default function Home() {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to calculator
      </a>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Kalkulate home">
          <span className="brand-icon" aria-hidden="true">
            K<span>↗</span>
          </span>
          KALKULATE<span className="brand-period">.</span>
        </Link>
        <span className="header-label">
          A LITTLE CLARITY. A LOT OF POSSIBILITY.
        </span>
        <span className="edition">STANDARD / V.01</span>
      </header>
      <main id="main">
        <div className="intro">
          <div className="eyebrow">
            <span className="status-dot" /> LESS FRICTION. MORE FOCUS.
          </div>
          <h1>
            Make it <span>add up.</span>
          </h1>
          <p>Everyday calculations. A clearer headspace.</p>
        </div>
        <CalculatorWorkspace />
      </main>
      <footer>
        <span>© {new Date().getFullYear()} KALKULATE</span>
        <span>Thoughtfully simple. Precisely yours.</span>
        <span className="footer-end">
          ONE THING. DONE WELL. <span aria-hidden="true">↗</span>
        </span>
      </footer>
    </div>
  );
}
