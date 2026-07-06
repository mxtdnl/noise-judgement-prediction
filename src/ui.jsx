// ui.jsx — shared UI atoms

const Button = ({ children, variant='primary', size='md', disabled, onClick, style, icon }) => {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    fontWeight:600, letterSpacing:'-.01em',
    borderRadius:999, border:'1px solid transparent', whiteSpace:'nowrap',
    boxShadow:'var(--shadow-sm)',
    transition:'all .18s ease',
  };
  const sizes = {
    sm: { padding:'7px 14px', fontSize:13 },
    md: { padding:'11px 20px', fontSize:14.5 },
    lg: { padding:'14px 26px', fontSize:16 },
  };
  const variants = {
    primary: { background:'var(--ink)', color:'var(--bg-card)', borderColor:'var(--ink)' },
    signal:  { background:'var(--signal)', color:'#fff', borderColor:'var(--signal)' },
    noise:   { background:'var(--noise)', color:'#fff', borderColor:'var(--noise)' },
    ghost:   { background:'transparent', color:'var(--ink-2)', borderColor:'var(--line-2)' },
    soft:    { background:'var(--bg-soft)', color:'var(--ink)', borderColor:'var(--line)' },
    quiet:   { background:'transparent', color:'var(--ink-3)', borderColor:'transparent', boxShadow:'none' },
  };
  return (
    <button className="btn" disabled={disabled} onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], opacity:disabled?.45:1, cursor:disabled?'not-allowed':'pointer', ...style }}>
      {icon}{children}
    </button>
  );
};

const Panel = ({ title, eyebrow, children, style, accent }) => (
  <div className="card" style={{ padding:'28px 30px', position:'relative', ...style }}>
    {accent && <div style={{position:'absolute', top:0, left:30, right:30, height:3, background:accent, borderRadius:'0 0 4px 4px'}}/>}
    {eyebrow && <div className="mono" style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', color:'var(--ink-4)', marginBottom:10 }}>{eyebrow}</div>}
    {title && <h2 className="serif" style={{ margin:'0 0 14px', fontSize:28, lineHeight:1.1, color:'var(--ink)'}}>{title}</h2>}
    {children}
  </div>
);

const Chip = ({ children, tone='neutral', active, onClick, style }) => {
  const tones = {
    neutral: { background:'var(--bg-soft)', color:'var(--ink-2)', border:'1px solid var(--line-2)'},
    signal:  { background:'var(--signal-soft)', color:'var(--signal)', border:'1px solid color-mix(in oklab, var(--signal) 25%, transparent)'},
    noise:   { background:'var(--noise-soft)', color:'var(--noise-2)', border:'1px solid color-mix(in oklab, var(--noise) 25%, transparent)'},
    gold:    { background:'var(--gold-soft)', color:'var(--gold)', border:'1px solid color-mix(in oklab, var(--gold) 25%, transparent)'},
    leaf:    { background:'var(--leaf-soft)', color:'var(--leaf)', border:'1px solid color-mix(in oklab, var(--leaf) 25%, transparent)'},
  };
  return (
    <span onClick={onClick} role={onClick?'button':undefined}
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'4px 11px', borderRadius:999, fontSize:12.5, fontWeight:500,
        cursor:onClick?'pointer':'default',
        ...(tones[tone]),
        ...(active ? { outline:'2px solid var(--ink)', outlineOffset:2 } : {}),
        ...style
      }}>{children}</span>
  );
};

const ProbabilitySlider = ({ value, onChange, lowLabel='No', highLabel='Yes', accent='var(--signal)' }) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div style={{ width:'100%' }}>
      <div style={{ position:'relative', height:10, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${v}%`, background:accent, transition:'width .15s ease' }}/>
      </div>
      <input type="range" min="0" max="100" value={v} onChange={(e)=>onChange(+e.target.value)}
        style={{ marginTop:-22, position:'relative', zIndex:2 }} />
      <div className="mono" style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--ink-3)', marginTop:-2 }}>
        <span>{lowLabel}</span>
        <span style={{ color:'var(--ink)', fontWeight:600, fontSize:18 }}>{v}%</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

// Confidence interval input — low / best / high
const CIInput = ({ low, mid, high, min, max, unit='', onChange }) => {
  const range = max - min;
  const pct = (v) => ((v - min) / range) * 100;
  const fmt = (n) => {
    if (Math.abs(n) >= 1000) return (n/1000).toFixed(n>=10000?0:1) + 'k';
    return Math.round(n).toString();
  };
  return (
    <div>
      <div style={{ position:'relative', height:40, marginTop:6 }}>
        <div style={{ position:'absolute', top:18, left:0, right:0, height:4, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)' }}/>
        <div style={{ position:'absolute', top:18, left:`${pct(low)}%`, width:`${pct(high)-pct(low)}%`, height:4, borderRadius:999, background:'var(--signal)' }}/>
        {[
          { v: low, key:'low', label:'low' },
          { v: mid, key:'mid', label:'best' },
          { v: high, key:'high', label:'high' },
        ].map(h => (
          <div key={h.key} style={{ position:'absolute', top:6, left:`calc(${pct(h.v)}% - 14px)`, width:28, textAlign:'center' }}>
            <div style={{ width:18, height:28, margin:'0 auto', borderRadius:6, background:h.key==='mid'?'var(--ink)':'var(--bg-card)', border:'2px solid var(--ink)', boxShadow:'var(--shadow-sm)'}}/>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{h.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:18 }}>
        {[['low','5%'],['mid','best guess'],['high','95%']].map(([k,lbl]) => (
          <label key={k} style={{ display:'block' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4 }}>{lbl}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:10, background:'var(--bg-soft)', border:'1px solid var(--line)'}}>
              <input type="number" value={k==='low'?low:k==='mid'?mid:high}
                onChange={(e)=>{ const v = +e.target.value; onChange({ low: k==='low'?v:low, mid:k==='mid'?v:mid, high:k==='high'?v:high }) }}
                style={{ flex:1, border:0, outline:0, background:'transparent', font:'500 16px/1.2 "Geist Mono",monospace', color:'var(--ink)', width:'100%'}}/>
              {unit && <span className="mono" style={{ color:'var(--ink-3)', fontSize:13 }}>{unit}</span>}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

// ConfidenceSlider — spans [min,max] (default 0–100) with tick labels
const ConfidenceSlider = ({ value, onChange, min=0, max=100 }) => {
  const v = Math.max(min, Math.min(max, value));
  const pct = ((v - min) / (max - min)) * 100;
  const labels = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(min + f * (max - min)));
  return (
    <div>
      <div style={{ position:'relative', height:14, borderRadius:999, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:'linear-gradient(90deg, var(--signal-soft), var(--signal))', transition:'width .12s ease' }}/>
        {[20,40,60,80].map(t => (
          <div key={t} style={{ position:'absolute', left:`${t}%`, top:0, bottom:0, width:1, background:'rgba(0,0,0,.08)' }}/>
        ))}
      </div>
      <input type="range" min={min} max={max} value={v} step="1" onChange={(e)=>onChange(+e.target.value)}
        style={{ marginTop:-24, position:'relative', zIndex:2 }}/>
      <div className="mono" style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-4)', marginTop:-4, padding:'0 2px' }}>
        {labels.map((l,i) => <span key={i}>{l}%</span>)}
      </div>
      <div style={{ display:'flex', justifyContent:'center', marginTop:14 }}>
        <div style={{ padding:'8px 24px', borderRadius:999, background:'var(--ink)', color:'var(--bg-card)', fontFamily:'"Geist Mono",monospace', fontSize:28, fontWeight:600, letterSpacing:'-.02em' }}>
          {v}%
        </div>
      </div>
    </div>
  );
};

// SmallStat
const Stat = ({ label, value, sub, tone='neutral' }) => {
  const colors = {
    neutral:'var(--ink)', good:'var(--good)', bad:'var(--bad)', signal:'var(--signal)', noise:'var(--noise-2)'
  };
  return (
    <div>
      <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.12em' }}>{label}</div>
      <div className="mono" style={{ fontSize:28, fontWeight:600, color:colors[tone], marginTop:2, lineHeight:1.05 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>{sub}</div>}
    </div>
  );
};

// Toast / callout
const Callout = ({ children, tone='neutral', icon }) => {
  const tones = {
    neutral:{ background:'var(--bg-soft)', border:'1px solid var(--line)'},
    signal: { background:'var(--signal-soft)', border:'1px solid color-mix(in oklab, var(--signal) 20%, transparent)' },
    noise:  { background:'var(--noise-soft)', border:'1px solid color-mix(in oklab, var(--noise) 25%, transparent)' },
    gold:   { background:'var(--gold-soft)', border:'1px solid color-mix(in oklab, var(--gold) 25%, transparent)' },
    good:   { background:'var(--leaf-soft)', border:'1px solid color-mix(in oklab, var(--leaf) 25%, transparent)'},
  };
  return (
    <div style={{ display:'flex', gap:12, padding:'14px 16px', borderRadius:14, ...tones[tone] }}>
      {icon && <div style={{ flex:'0 0 24px', fontSize:18, lineHeight:1 }}>{icon}</div>}
      <div style={{ fontSize:14.5, lineHeight:1.55, color:'var(--ink-2)' }}>{children}</div>
    </div>
  );
};

// Progress dots
const ProgressDots = ({ total, current }) => (
  <div style={{ display:'flex', gap:6 }}>
    {Array.from({length:total}).map((_,i) => (
      <div key={i} style={{
        width: i===current? 24 : 8, height:8, borderRadius:999,
        background: i<current ? 'var(--ink)' : i===current ? 'var(--ink)' : 'var(--line-2)',
        transition:'all .25s ease'
      }}/>
    ))}
  </div>
);

// Stamp / verdict badge
const Stamp = ({ label, tone='good' }) => {
  const tones = {
    good:{ color:'var(--good)', borderColor:'var(--good)'},
    bad: { color:'var(--bad)',  borderColor:'var(--bad)'},
    gold:{ color:'var(--gold)', borderColor:'var(--gold)'},
  };
  return (
    <div className="mono" style={{
      display:'inline-block', padding:'4px 10px', borderRadius:6,
      border:`1.5px solid ${tones[tone].borderColor}`, color:tones[tone].color,
      fontSize:11, fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase',
      transform:'rotate(-2deg)'
    }}>{label}</div>
  );
};

Object.assign(window, { Button, Panel, Chip, ProbabilitySlider, ConfidenceSlider, CIInput, Stat, Callout, ProgressDots, Stamp });
