// charts.jsx — chart and visualization helpers

// Seeded random
const mulberry32 = (a) => () => {
  a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = a; t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
// Fisher–Yates shuffle driven by a seeded rng (returns a copy)
const seededShuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const gauss = (rng) => {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// generate a noisy time series with optional underlying signal
const genSeries = ({ seed=1, n=40, signal='none', noise=8, bias=50 } = {}) => {
  const rng = mulberry32(seed);
  const points = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let sig = bias;
    if (signal === 'up')    sig = bias + (t - .5) * 30;
    if (signal === 'down')  sig = bias - (t - .5) * 30;
    if (signal === 'step')  sig = bias + (t > .55 ? 16 : -4);
    if (signal === 'cycle') sig = bias + Math.sin(t * Math.PI * 2.2) * 14;
    if (signal === 'none')  sig = bias;
    const y = sig + gauss(rng) * noise;
    points.push({ x: i, y, sig });
  }
  return points;
};

// Time series sparkline chart
const TimeSeriesChart = ({ data, w=520, h=220, showSignal=false, color='var(--ink-2)', signalColor='var(--signal)', highlight=null, mark=null }) => {
  const pad = { l: 36, r: 16, t: 16, b: 26 };
  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);
  const minY = Math.min(...ys, ...(showSignal ? data.map(d=>d.sig) : []));
  const maxY = Math.max(...ys, ...(showSignal ? data.map(d=>d.sig) : []));
  const padY = (maxY - minY) * 0.18 || 5;
  const yMin = minY - padY, yMax = maxY + padY;
  const sx = (x) => pad.l + (x / (data.length - 1)) * (w - pad.l - pad.r);
  const sy = (y) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

  const path = data.map((d, i) => `${i ? 'L' : 'M'} ${sx(d.x)} ${sy(d.y)}`).join(' ');
  const sigPath = data.map((d, i) => `${i ? 'L' : 'M'} ${sx(d.x)} ${sy(d.sig)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display:'block', maxHeight:h }}>
      {/* gridlines */}
      {[0,.25,.5,.75,1].map((t,i) => (
        <line key={i} x1={pad.l} x2={w-pad.r} y1={pad.t + t*(h-pad.t-pad.b)} y2={pad.t + t*(h-pad.t-pad.b)}
          stroke="var(--line)" strokeWidth="1" strokeDasharray={i===0||i===4?'':'2 4'} />
      ))}
      {/* mean line if no signal context */}
      {showSignal && (
        <path d={sigPath} fill="none" stroke={signalColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter:'drop-shadow(0 1px 0 rgba(0,0,0,.04))'}}/>
      )}
      {/* main data line */}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={showSignal ? .45 : .9}/>
      {/* dots */}
      {data.map((d,i) => (
        <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={2.5} fill={color} opacity={showSignal ? .55 : .9}/>
      ))}
      {/* axis ticks */}
      <text x={pad.l} y={h-6} fontSize="10" fill="var(--ink-4)" className="mono">t=0</text>
      <text x={w-pad.r} y={h-6} fontSize="10" fill="var(--ink-4)" textAnchor="end" className="mono">t={data.length-1}</text>
    </svg>
  );
};

// Calibration plot — buckets of (predicted prob, observed frequency).
// xMin lets the x-axis start at 0.5 for 2AFC quizzes (confidence can't go below
// a coin flip), so the data fills the plot instead of cramming into one half.
const CalibrationPlot = ({ buckets, w=380, h=380, xMin=0 }) => {
  const pad = 44;
  const sx = (p) => pad + ((p - xMin) / (1 - xMin)) * (w - pad*2);
  const sy = (p) => h - pad - p * (h - pad*2);
  const xTicks = xMin === 0 ? [0,.25,.5,.75,1] : [.5,.6,.7,.8,.9,1];
  const yTicks = [0,.25,.5,.75,1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display:'block', maxHeight:h }}>
      {/* axes grid + tick labels */}
      {xTicks.map((t,i)=>(
        <g key={'x'+i}>
          <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(1)} stroke="var(--line)" strokeDasharray="2 4"/>
          <text x={sx(t)} y={sy(0)+16} fontSize="10" fill="var(--ink-4)" textAnchor="middle" className="mono">{Math.round(t*100)}%</text>
        </g>
      ))}
      {yTicks.map((t,i)=>(
        <g key={'y'+i}>
          <line x1={sx(xMin)} x2={sx(1)} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeDasharray="2 4"/>
          <text x={sx(xMin)-8} y={sy(t)+3} fontSize="10" fill="var(--ink-4)" textAnchor="end" className="mono">{Math.round(t*100)}%</text>
        </g>
      ))}
      {/* perfect-calibration diagonal (accuracy = stated confidence) */}
      <line x1={sx(xMin)} y1={sy(xMin)} x2={sx(1)} y2={sy(1)} stroke="var(--ink-4)" strokeWidth="1.5" strokeDasharray="4 5"/>
      <text x={sx(xMin + (1-xMin)*.42)} y={sy(xMin + (1-xMin)*.42) - 8} fontSize="9.5" fill="var(--ink-4)" className="mono"
        transform={`rotate(-45 ${sx(xMin + (1-xMin)*.42)} ${sy(xMin + (1-xMin)*.42)})`}>perfect calibration</text>
      {/* axes */}
      <line x1={sx(xMin)} y1={sy(0)} x2={sx(1)} y2={sy(0)} stroke="var(--ink)" strokeWidth="1.5"/>
      <line x1={sx(xMin)} y1={sy(0)} x2={sx(xMin)} y2={sy(1)} stroke="var(--ink)" strokeWidth="1.5"/>
      {/* connecting line for user buckets — kept subtle: with few answers per
          bucket the segment swings are mostly sampling noise */}
      {(() => {
        const pts = buckets.filter(b=>b.n>0).map(b => [sx(b.p), sy(b.freq)]);
        if (pts.length < 2) return null;
        return <polyline points={pts.map(p=>p.join(',')).join(' ')} fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeDasharray="1 4" strokeLinecap="round" opacity=".55"/>;
      })()}
      {/* dots (area scales with bucket size) */}
      {buckets.map((b, i) => b.n > 0 && (
        <g key={i}>
          <circle cx={sx(b.p)} cy={sy(b.freq)} r={6 + Math.min(b.n, 8) * 1.5} fill="var(--signal)" opacity=".18"/>
          <circle cx={sx(b.p)} cy={sy(b.freq)} r={5.5} fill="var(--signal)" stroke="#fff" strokeWidth="2"/>
          <text x={sx(b.p)} y={sy(b.freq)-12} fontSize="10" fill="var(--ink-2)" textAnchor="middle" className="mono">{b.n}×</text>
        </g>
      ))}
      {/* labels */}
      <text x={sx(xMin + (1-xMin)/2)} y={h-8} textAnchor="middle" fontSize="12" fill="var(--ink-3)">your stated confidence →</text>
      <text x={12} y={sy(.5)} textAnchor="middle" fontSize="12" fill="var(--ink-3)" transform={`rotate(-90 12 ${sy(.5)})`}>how often you were right →</text>
      {/* corner annotations */}
      <text x={sx(xMin + (1-xMin)*.04)} y={sy(.93)} fontSize="10" fill="var(--ink-4)" className="mono">under-confident ↑</text>
      <text x={sx(.97)} y={sy(.10)} fontSize="10" fill="var(--ink-4)" className="mono" textAnchor="end">↓ over-confident</text>
    </svg>
  );
};

// Dot field for base rate visualization (10 x 10 = 100 squares; configurable)
const DotField = ({ rows=20, cols=20, classify, dotSize=14, gap=2, animate=false }) => {
  const total = rows * cols;
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, ${dotSize}px)`, gap, padding:6 }}>
      {Array.from({length: total}).map((_, i) => {
        const c = classify(i);
        const colors = {
          well:  'var(--line-2)',
          sick:  'var(--noise)',
          tp:    'var(--noise)',
          fp:    'var(--gold)',
          fn:    'var(--line-2)',
          tn:    'var(--bg-soft)',
          neg:   'var(--bg-soft)',
          hit:   'var(--leaf)',
          miss:  'var(--bg-soft)',
          custom: c?.color || 'var(--line-2)',
        };
        const cls = typeof c === 'string' ? c : (c?.type || 'neg');
        const color = c?.color || colors[cls];
        return (
          <div key={i} style={{
            width:dotSize, height:dotSize, borderRadius:'50%',
            background: color,
            border: cls==='tn' || cls==='neg' || cls==='miss' ? '1px solid var(--line-2)' : 'none',
            transition: animate ? `all .35s ease ${i*4}ms` : 'none',
          }}/>
        );
      })}
    </div>
  );
};

// Brier history chart (line over rounds)
const BrierHistory = ({ rounds, w=480, h=160 }) => {
  if (rounds.length === 0) return null;
  const pad = { l:32, r:14, t:14, b:24 };
  const maxRounds = Math.max(rounds.length, 8);
  const sx = (i) => pad.l + (i / (maxRounds - 1)) * (w - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - Math.min(v / 1.0, 1)) * (h - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display:'block', maxHeight:h }}>
      {/* zones: green / amber / red */}
      <rect x={pad.l} y={sy(0.25)} width={w-pad.l-pad.r} height={sy(0)-sy(0.25)} fill="var(--leaf-soft)" opacity=".5"/>
      <rect x={pad.l} y={sy(0.5)}  width={w-pad.l-pad.r} height={sy(0.25)-sy(0.5)} fill="var(--gold-soft)" opacity=".5"/>
      <rect x={pad.l} y={sy(1)}    width={w-pad.l-pad.r} height={sy(0.5)-sy(1)} fill="var(--noise-soft)" opacity=".4"/>
      {/* gridlines */}
      {[0,.25,.5,.75,1].map((t,i)=>(
        <line key={i} x1={pad.l} x2={w-pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeDasharray={i===0?'':'2 4'}/>
      ))}
      {/* bars per round */}
      {rounds.map((r,i) => (
        <g key={i}>
          <line x1={sx(i)} x2={sx(i)} y1={sy(0)} y2={sy(r.score)} stroke="var(--ink-3)" strokeWidth="1" opacity=".4"/>
          <circle cx={sx(i)} cy={sy(r.score)} r={5} fill={r.score < 0.15 ? 'var(--leaf)' : r.score < 0.3 ? 'var(--gold)' : 'var(--noise)'} stroke="#fff" strokeWidth="2"/>
        </g>
      ))}
      <text x={pad.l-6} y={sy(0)+3} fontSize="10" fill="var(--ink-4)" textAnchor="end" className="mono">0</text>
      <text x={pad.l-6} y={sy(.5)+3} fontSize="10" fill="var(--ink-4)" textAnchor="end" className="mono">.5</text>
      <text x={pad.l-6} y={sy(1)+3} fontSize="10" fill="var(--ink-4)" textAnchor="end" className="mono">1</text>
    </svg>
  );
};

// Histogram chart (vertical bars)
const Histogram = ({ buckets, w=520, h=180, accent='var(--signal)', highlight=null, truth=null, mean=null }) => {
  const pad = { l:14, r:14, t:14, b:26 };
  const maxC = Math.max(...buckets.map(b=>b.count), 1);
  const bw = (w - pad.l - pad.r) / buckets.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display:'block', maxHeight:h }}>
      {/* bars */}
      {buckets.map((b, i) => {
        const bh = (b.count / maxC) * (h - pad.t - pad.b);
        const x = pad.l + i * bw;
        const y = h - pad.b - bh;
        const isHi = highlight !== null && b.x0 <= highlight && highlight < b.x1;
        return (
          <g key={i}>
            <rect x={x+1} y={y} width={bw-2} height={bh}
              fill={isHi ? 'var(--ink)' : accent} opacity={isHi ? 1 : .68} rx="2"/>
          </g>
        );
      })}
      {/* baseline */}
      <line x1={pad.l} x2={w-pad.r} y1={h-pad.b} y2={h-pad.b} stroke="var(--ink)" strokeWidth="1.2"/>
      {/* truth marker */}
      {truth !== null && (() => {
        const xv = pad.l + (truth - buckets[0].x0) / (buckets[buckets.length-1].x1 - buckets[0].x0) * (w-pad.l-pad.r);
        return <g>
          <line x1={xv} x2={xv} y1={pad.t} y2={h-pad.b+6} stroke="var(--noise-2)" strokeWidth="2" strokeDasharray="3 3"/>
          <text x={xv} y={pad.t+10} textAnchor="middle" fontSize="11" fill="var(--noise-2)" className="mono">truth</text>
        </g>;
      })()}
      {/* mean marker */}
      {mean !== null && (() => {
        const xv = pad.l + (mean - buckets[0].x0) / (buckets[buckets.length-1].x1 - buckets[0].x0) * (w-pad.l-pad.r);
        return <g>
          <line x1={xv} x2={xv} y1={pad.t+18} y2={h-pad.b+6} stroke="var(--signal)" strokeWidth="2"/>
          <text x={xv} y={pad.t+28} textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">mean</text>
        </g>;
      })()}
    </svg>
  );
};

// Belief bar — animates posterior changes
const BeliefBar = ({ prior, posterior, label='belief' }) => (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
      <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em'}}>{label}</span>
      <span className="mono" style={{ fontSize:24, fontWeight:600, color:'var(--ink)'}}>{Math.round(posterior * 100)}%</span>
    </div>
    <div style={{ position:'relative', height:18, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${posterior*100}%`, background:'linear-gradient(90deg, var(--signal), var(--signal-2))', transition:'width .6s cubic-bezier(.2,.9,.3,1)' }}/>
      {prior != null && (
        <div style={{ position:'absolute', left:`${prior*100}%`, top:-2, bottom:-2, width:2, background:'var(--noise-2)' }} title={`Prior: ${Math.round(prior*100)}%`}/>
      )}
    </div>
  </div>
);

Object.assign(window, { TimeSeriesChart, CalibrationPlot, DotField, BrierHistory, Histogram, BeliefBar, mulberry32, gauss, genSeries, seededShuffle });
