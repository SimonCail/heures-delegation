import { useState } from 'react';
import { getYearSummary, formatHours } from '../utils/delegation';
import { exportPDF, exportExcel, exportCSV } from '../utils/export';

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function StatsView({ entries, year, userLabel, toast }) {
  const [compare, setCompare] = useState(false);

  const months = getYearSummary(entries, year);
  const used = months.map((m) => m.used);
  const cseUsed = months.map((m) => m.cseUsed);
  const carryByMonth = months.map((m) => m.carryOver);

  const totalCse = used.reduce((s, v) => s + v, 0);
  const totalCseS = cseUsed.reduce((s, v) => s + v, 0);
  const grandTotal = totalCse + totalCseS;
  const activeMonths = months.filter((m) => m.used + m.cseUsed > 0).length;
  const avg = totalCse / months.length;

  // Previous year (for comparison overlay)
  const prevMonths = getYearSummary(entries, year - 1);
  const prevUsed = prevMonths.map((m) => m.used);
  const prevCarry = prevMonths.map((m) => m.carryOver);
  const prevTotalCse = prevUsed.reduce((s, v) => s + v, 0);
  const hasPrev = prevMonths.some((m) => m.used + m.cseUsed > 0);
  const delta = totalCse - prevTotalCse;
  const showCompare = compare && hasPrev;

  const hasData = grandTotal > 0;

  const runExport = (fn) => {
    Promise.resolve()
      .then(fn)
      .catch(() => toast?.show("L'export a échoué", 'error'));
  };

  return (
    <div className="stats-view">
      <div className="stats-hero">
        <div className="stats-hero-content">
          <span className="stats-hero-label">Total {year}</span>
          <span className="stats-hero-value">{formatHours(grandTotal)}<small>h</small></span>
          <span className="stats-hero-sub">
            {activeMonths} mois actif{activeMonths > 1 ? 's' : ''}
            {avg > 0 && <> · {formatHours(avg)}h / mois en moyenne</>}
          </span>
        </div>
        {hasData && <Spark data={used} />}
      </div>

      <div className="stat-cards-row">
        <div className="mini-stat-card">
          <span className="mini-stat-dot dot-cse" />
          <span className="mini-stat-value used">{formatHours(totalCse)}h</span>
          <span className="mini-stat-label">CSE</span>
        </div>
        <div className="mini-stat-card">
          <span className="mini-stat-dot dot-cses" />
          <span className="mini-stat-value cse">{formatHours(totalCseS)}h</span>
          <span className="mini-stat-label">CSE-S</span>
        </div>
        <div className="mini-stat-card">
          <span className="mini-stat-dot dot-neutral" />
          <span className="mini-stat-value">{formatHours(avg)}h</span>
          <span className="mini-stat-label">Moy. / mois</span>
        </div>
      </div>

      {hasPrev && (
        <div className="compare-bar">
          <button
            className={`compare-toggle ${showCompare ? 'active' : ''}`}
            onClick={() => setCompare((c) => !c)}
          >
            <span className="compare-check">{showCompare ? '✓' : ''}</span>
            Comparer à {year - 1}
          </button>
          {delta !== 0 && (
            <span className={`compare-delta ${delta > 0 ? 'up' : 'down'}`}>
              {delta > 0 ? '▲' : '▼'} {formatHours(Math.abs(delta))}h CSE vs {year - 1}
            </span>
          )}
        </div>
      )}

      {!hasData ? (
        <div className="chart-card">
          <p className="empty-state">Aucune donnée à afficher pour {year}</p>
        </div>
      ) : (
        <>
          <div className="chart-card">
            <h3 className="chart-title"><span className="title-dot dot-cse" /> Utilisation CSE mois par mois</h3>
            {showCompare && <ChartCompareLegend year={year} />}
            <LineChart data={used} compare={showCompare ? prevUsed : null} />
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title"><span className="title-dot dot-grad" /> Répartition CSE / CSE-S</h3>
              <DonutChart cse={totalCse} cseS={totalCseS} />
            </div>
            <div className="chart-card">
              <h3 className="chart-title"><span className="title-dot dot-cse" /> Report cumulé par mois</h3>
              {showCompare && <ChartCompareLegend year={year} />}
              <BarChart data={carryByMonth} compare={showCompare ? prevCarry : null} />
            </div>
          </div>
        </>
      )}

      <div className="chart-card export-card">
        <h3 className="chart-title">Exporter {year}</h3>
        <div className="export-buttons">
          <button className="export-btn export-pdf" onClick={() => runExport(() => exportPDF(entries, year, userLabel))}>
            <DocIcon /> PDF
          </button>
          <button className="export-btn export-excel" onClick={() => runExport(() => exportExcel(entries, year))}>
            <SheetIcon /> Excel
          </button>
          <button className="export-btn export-csv" onClick={() => runExport(() => exportCSV(entries, year))}>
            <SheetIcon /> CSV
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Sparkline (hero) ===== */
function Spark({ data }) {
  const w = 116, h = 44;
  const max = Math.max(...data, 1);
  const n = data.length;
  const pts = data.map((v, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`).join(' ');
  return (
    <svg className="stats-hero-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(255,255,255,0.16)" stroke="none" />
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ===== Line chart (monthly usage curve) ===== */
function LineChart({ data, compare }) {
  const [hover, setHover] = useState(null);
  const W = 320, H = 176, PL = 28, PR = 12, PT = 22, PB = 26;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const max = niceMax(Math.max(...data, ...(compare || []), 1));
  const n = data.length;
  const x = (i) => PL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => PT + innerH - (v / max) * innerH;

  const points = data.map((v, i) => [x(i), y(v)]);
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${(PT + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PT + innerH).toFixed(1)} Z`;
  const comparePath = compare
    ? compare.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    : null;
  const peakIdx = data.indexOf(Math.max(...data));
  const activeIdx = hover != null ? hover : peakIdx;

  const label = `${formatHours(data[activeIdx])}h`;
  const bubbleW = Math.max(32, label.length * 6.5 + 12);
  const bx = Math.min(Math.max(points[activeIdx][0] - bubbleW / 2, 2), W - bubbleW - 2);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img">
      <defs>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent-light)' }} />
        </linearGradient>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line className="chart-grid" x1={PL} y1={PT + innerH * f} x2={W - PR} y2={PT + innerH * f} />
          <text className="chart-axis" x={PL - 5} y={PT + innerH * f + 3} textAnchor="end">{formatHours(max * (1 - f))}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#lineArea)" />
      {comparePath && (
        <path className="chart-line-prev" d={comparePath} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      )}
      <path d={linePath} fill="none" stroke="url(#lineStroke)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {hover != null && (
        <line className="chart-hover-line" x1={points[hover][0]} y1={PT} x2={points[hover][0]} y2={PT + innerH} />
      )}
      {points.map((p, i) => (
        <circle key={i} className="chart-dot" cx={p[0]} cy={p[1]} r={i === activeIdx ? 4 : 2.6} />
      ))}
      {data[activeIdx] > 0 && (
        <g style={{ pointerEvents: 'none' }}>
          <rect className="peak-bubble" x={bx} y={points[activeIdx][1] - 22} width={bubbleW} height="15" rx="7.5" />
          <text className="peak-text" x={bx + bubbleW / 2} y={points[activeIdx][1] - 11.5} textAnchor="middle">{label}</text>
        </g>
      )}
      {/* invisible hit areas for hover / tap */}
      {points.map((p, i) => (
        <circle
          key={`hit${i}`}
          cx={p[0]}
          cy={p[1]}
          r="13"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setHover((h) => (h === i ? null : i))}
        />
      ))}
      {MONTH_INITIALS.map((m, i) => (
        <text key={i} className="chart-axis" x={x(i)} y={H - 8} textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}

/* ===== Donut chart (CSE vs CSE-S) ===== */
function DonutChart({ cse, cseS }) {
  const total = cse + cseS || 1;
  const r = 48, cx = 62, cy = 62, sw = 18;
  const C = 2 * Math.PI * r;
  const cseLen = (cse / total) * C;
  const cseSLen = (cseS / total) * C;
  const pct = (v) => Math.round((v / total) * 100);

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 124 124" role="img">
        <circle className="donut-track" cx={cx} cy={cy} r={r} strokeWidth={sw} fill="none" />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle className="donut-cse" cx={cx} cy={cy} r={r} strokeWidth={sw} fill="none"
            strokeDasharray={`${cseLen} ${C - cseLen}`} strokeLinecap="round" />
          <circle className="donut-cses" cx={cx} cy={cy} r={r} strokeWidth={sw} fill="none"
            strokeDasharray={`${cseSLen} ${C - cseSLen}`} strokeDashoffset={-cseLen} strokeLinecap="round" />
        </g>
        <text className="donut-total" x={cx} y={cy - 1} textAnchor="middle">{formatHours(cse + cseS)}h</text>
        <text className="donut-sub" x={cx} y={cy + 15} textAnchor="middle">total</text>
      </svg>
      <div className="donut-legend">
        <div className="legend-item">
          <span className="legend-dot legend-cse" />
          <div className="legend-text">
            <span className="legend-label">CSE</span>
            <span className="legend-val">{formatHours(cse)}h · {pct(cse)}%</span>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-cses" />
          <div className="legend-text">
            <span className="legend-label">CSE-S</span>
            <span className="legend-val">{formatHours(cseS)}h · {pct(cseS)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Bar chart (cumulative carry-over / report per month) ===== */
function BarChart({ data, compare }) {
  const [hover, setHover] = useState(null);
  const W = 320, H = 176, PL = 30, PR = 8, PT = 14, PB = 24;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const top = niceMax(Math.max(...data, ...(compare || []), 1));
  const minV = Math.min(...data, ...(compare || []), 0);
  const bottom = minV < 0 ? -niceMax(-minV) : 0;
  const range = top - bottom || 1;
  const n = data.length;
  const slot = innerW / n;
  const bw = Math.min(slot * 0.58, 15);
  const y = (v) => PT + innerH - ((v - bottom) / range) * innerH;
  const zeroY = y(0);

  const gridVals = bottom < 0 ? [top, 0, bottom] : [top, top / 2, 0];
  const comparePath = compare
    ? compare.map((v, i) => `${i === 0 ? 'M' : 'L'}${(PL + slot * i + slot / 2).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    : null;

  let bubble = null;
  if (hover != null) {
    const cx = PL + slot * hover + slot / 2;
    const yv = y(data[hover]);
    const label = `${formatHours(data[hover])}h`;
    const bubbleW = Math.max(32, label.length * 6.5 + 12);
    const bx = Math.min(Math.max(cx - bubbleW / 2, 2), W - bubbleW - 2);
    const by = data[hover] >= 0 ? yv - 22 : yv + 7;
    bubble = (
      <g style={{ pointerEvents: 'none' }}>
        <rect className="peak-bubble" x={bx} y={by} width={bubbleW} height="15" rx="7.5" />
        <text className="peak-text" x={bx + bubbleW / 2} y={by + 11} textAnchor="middle">{label}</text>
      </g>
    );
  }

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img">
      <defs>
        <linearGradient id="barPos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--accent-light)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent)' }} />
        </linearGradient>
      </defs>
      {gridVals.map((gv, i) => (
        <g key={i}>
          <line className={`chart-grid ${gv === 0 ? 'chart-zero' : ''}`} x1={PL} y1={y(gv)} x2={W - PR} y2={y(gv)} />
          <text className="chart-axis" x={PL - 5} y={y(gv) + 3} textAnchor="end">{formatHours(gv)}</text>
        </g>
      ))}
      {data.map((v, i) => {
        const cx = PL + slot * i + slot / 2;
        const yv = y(v);
        const barH = Math.abs(yv - zeroY);
        const barY = v >= 0 ? yv : zeroY;
        return (
          <g key={i} opacity={hover == null || hover === i ? 1 : 0.4}>
            {barH > 0.5 && (
              <rect fill={v >= 0 ? 'url(#barPos)' : 'var(--danger)'} x={cx - bw / 2} y={barY} width={bw} height={barH} rx="3" />
            )}
            <text className="chart-axis" x={cx} y={H - 8} textAnchor="middle">{MONTH_INITIALS[i]}</text>
          </g>
        );
      })}
      {comparePath && (
        <path className="chart-line-prev" d={comparePath} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {bubble}
      {/* invisible hit areas for hover / tap */}
      {data.map((v, i) => (
        <rect
          key={`hit${i}`}
          x={PL + slot * i}
          y={PT}
          width={slot}
          height={innerH}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setHover((h) => (h === i ? null : i))}
        />
      ))}
    </svg>
  );
}

function ChartCompareLegend({ year }) {
  return (
    <div className="chart-compare-legend">
      <span className="ccl-item"><span className="ccl-line solid" />{year}</span>
      <span className="ccl-item"><span className="ccl-line dashed" />{year - 1}</span>
    </div>
  );
}

function niceMax(v) {
  if (v <= 5) return 5;
  if (v <= 10) return 10;
  if (v <= 20) return 20;
  if (v <= 50) return Math.ceil(v / 10) * 10;
  return Math.ceil(v / 25) * 25;
}

function DocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
