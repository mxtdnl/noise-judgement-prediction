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

// CalibrationBreakdown — a small-sample-friendly calibration view.
// Everything lives on ONE shared 0-100% scale: first a strip with every
// individual answer (✓/✗ placed at the confidence you gave it), then a
// "claim vs reality" dumbbell per confidence band — hollow marker = the
// confidence you claimed, filled marker = how often you were actually right,
// with the miss spelled out in words. No diagonal to decode.
const CalibrationBreakdown = ({ entries }) => {
  const bands = [[50,60],[60,70],[70,80],[80,90],[90,101]];
  const rows = bands.map(([lo, hi]) => {
    const items = entries.filter(e => e.conf >= lo && e.conf < hi);
    if (!items.length) return null;
    const claimed = items.reduce((s,e)=>s+e.conf,0) / items.length;
    const actual = items.filter(e=>e.correct).length / items.length * 100;
    return { label:`${lo}–${Math.min(hi-1,100)}%`, n:items.length, claimed, actual, gap: actual - claimed };
  }).filter(Boolean);
  const avgConf = entries.reduce((s,e)=>s+e.conf,0) / entries.length;
  const accuracy = entries.filter(e=>e.correct).length / entries.length * 100;

  const clamp = (v) => Math.max(1.5, Math.min(98.5, v));
  const ticks = [0,25,50,75,100];
  const Grid = () => ticks.map(t => (
    <div key={t} style={{ position:'absolute', left:`${t}%`, top:0, bottom:0, width:t===50?1.5:1, background:t===50?'var(--line-2)':'var(--line)' }}/>
  ));
  const Axis = () => (
    <div className="mono" style={{ position:'relative', height:15, fontSize:10, color:'var(--ink-4)', margin:'3px 0 0' }}>
      {ticks.map(t => (
        <span key={t} style={{ position:'absolute', left:`${t}%`, transform:'translateX(-50%)', whiteSpace:'nowrap' }}>
          {t === 50 ? '50% · coin flip' : `${t}%`}
        </span>
      ))}
    </div>
  );

  const verdictFor = (gap, n) => {
    // with 1-2 answers in a band, the "miss" is mostly sampling noise — say so
    if (n < 3) {
      const dir = Math.abs(gap) <= 7 ? 'on target' : gap < 0 ? `${Math.round(-gap)} pts over` : `${Math.round(gap)} pts under`;
      return { text: `${dir} · too few answers to judge`, color:'var(--ink-4)' };
    }
    if (Math.abs(gap) <= 7) return { text:'well calibrated', color:'var(--good)' };
    if (gap < 0) return { text:`overconfident by ${Math.round(-gap)} pts`, color:'var(--bad)' };
    return { text:`underconfident by ${Math.round(gap)} pts`, color:'var(--signal)' };
  };

  const Dumbbell = ({ row, bold }) => {
    const v = verdictFor(row.gap, row.n);
    const lo = clamp(Math.min(row.claimed, row.actual));
    const hi = clamp(Math.max(row.claimed, row.actual));
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
          <span className="mono" style={{ fontSize:11.5, color: bold ? 'var(--ink)' : 'var(--ink-3)', fontWeight: bold ? 700 : 500, textTransform:'uppercase', letterSpacing:'.08em' }}>
            {row.label} <span style={{ color:'var(--ink-4)', textTransform:'none', letterSpacing:0 }}>· {row.n} answer{row.n>1?'s':''}</span>
          </span>
          <span className="mono" style={{ fontSize:12, fontWeight:600, color:v.color }}>{v.text}</span>
        </div>
        <div style={{ position:'relative', height:32, background:'var(--bg-card)', border:`1px solid ${bold ? 'var(--line-2)' : 'var(--line)'}`, borderRadius:9, overflow:'hidden' }}>
          <Grid/>
          {hi - lo > 0.5 && (
            <div style={{ position:'absolute', left:`${lo}%`, width:`${hi-lo}%`, top:'50%', height:3, transform:'translateY(-50%)', background:v.color, opacity:.4 }}/>
          )}
          {/* claimed = hollow */}
          <div style={{ position:'absolute', left:`calc(${clamp(row.claimed)}% - 7px)`, top:'50%', transform:'translateY(-50%)', width:14, height:14, borderRadius:'50%', background:'var(--bg-card)', border:'2.5px solid var(--ink-3)', boxSizing:'border-box' }}/>
          {/* actual = filled */}
          <div style={{ position:'absolute', left:`calc(${clamp(row.actual)}% - 7px)`, top:'50%', transform:'translateY(-50%)', width:14, height:14, borderRadius:'50%', background:v.color, border:'2px solid #fff', boxSizing:'border-box', boxShadow:'var(--shadow-sm)' }}/>
        </div>
      </div>
    );
  };

  // lane out overlapping answer dots
  const seen = {};
  const dots = entries.map((e) => {
    const key = Math.round(e.conf / 3);
    const lane = seen[key] || 0;
    seen[key] = lane + 1;
    return { ...e, lane };
  });
  const maxLane = Math.max(...dots.map(d=>d.lane));
  const stripH = 34 + maxLane * 18;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* every answer, individually */}
      <div>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6 }}>
          every answer, placed at the confidence you gave it
        </div>
        <div style={{ position:'relative', height:stripH, background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:9, overflow:'hidden' }}>
          <Grid/>
          {dots.map((e, i) => (
            <div key={i} style={{ position:'absolute', left:`calc(${clamp(e.conf)}% - 9px)`, top: 7 + e.lane * 18,
              width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              background: e.correct ? 'var(--leaf)' : 'var(--noise)', color:'#fff', fontSize:10, fontWeight:700, border:'2px solid #fff', boxSizing:'border-box', boxShadow:'var(--shadow-sm)' }}>
              {e.correct ? '✓' : '✗'}
            </div>
          ))}
        </div>
        <Axis/>
        <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:6 }}>
          <span style={{ color:'var(--noise-2)', fontWeight:600 }}>✗ far to the right</span> is the expensive kind of wrong — you were nearly certain, and missed. Wrong answers near the coin-flip line barely count against you.
        </div>
      </div>

      {/* claim vs reality, band by band */}
      <div>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6 }}>
          claim vs. reality · <span style={{ display:'inline-block', width:9, height:9, borderRadius:9, border:'2px solid var(--ink-3)', verticalAlign:-1 }}/> what you claimed → <span style={{ display:'inline-block', width:10, height:10, borderRadius:10, background:'var(--ink-3)', verticalAlign:-1 }}/> how often you were right
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Dumbbell bold row={{ label:'All answers', n:entries.length, claimed:avgConf, actual:accuracy, gap:accuracy-avgConf }}/>
          {rows.map(r => <Dumbbell key={r.label} row={r}/>)}
        </div>
        <Axis/>
      </div>
    </div>
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

Object.assign(window, { TimeSeriesChart, CalibrationBreakdown, DotField, BrierHistory, Histogram, BeliefBar, mulberry32, gauss, genSeries, seededShuffle });
