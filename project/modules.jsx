// modules.jsx — optional teaching modules, one per station
// Each module is a click-through of 4–5 frames with illustrations + body copy.

// ─── Shared shell ──────────────────────────────────────────────────────
const TeachingModule = ({ title, intro, frames, accent, onFinish, onSkip }) => {
  const [i, setI] = React.useState(-1); // -1 = intro
  const total = frames.length;

  if (i === -1) {
    return (
      <div className="card fadeup" style={{ padding:'36px 40px' }}>
        <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.15em' }}>Concept</div>
        <h1 className="serif" style={{ margin:'6px 0 14px', fontSize:42, lineHeight:1.05, letterSpacing:'-.02em' }}>{title}</h1>
        <p style={{ fontSize:18, lineHeight:1.55, color:'var(--ink-2)', maxWidth:640, marginTop:0 }}>{intro}</p>
        <div style={{ marginTop:24, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span className="mono" style={{ fontSize:12, color:'var(--ink-3)' }}>{total} short frames · ~2 min</span>
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="ghost" onClick={onSkip}>Skip to exercise</Button>
            <Button size="lg" onClick={()=>setI(0)}>Begin learning →</Button>
          </div>
        </div>
      </div>
    );
  }

  const frame = frames[i];
  return (
    <div className="card fadeup" style={{ padding:'28px 32px' }} key={i}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.15em' }}>{title}</span>
          <span className="mono" style={{ fontSize:11, color:'var(--ink-3)' }}>frame {i+1}/{total}</span>
        </div>
        <ProgressDots total={total} current={i}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'center', minHeight:340 }}>
        <div style={{ padding:'20px', borderRadius:20, background:'var(--bg-soft)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
          {frame.illustration}
        </div>
        <div>
          <h2 className="serif" style={{ margin:'0 0 12px', fontSize:30, lineHeight:1.15, letterSpacing:'-.015em' }}>{frame.title}</h2>
          <div style={{ fontSize:16, lineHeight:1.6, color:'var(--ink-2)' }}>{frame.body}</div>
          {frame.takeaway && (
            <div style={{ marginTop:18, padding:'12px 14px', borderRadius:12, background:accent || 'var(--gold-soft)', border:'1px dashed var(--ink-3)' }}>
              <span className="mono" style={{ fontSize:10.5, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.14em' }}>takeaway</span>
              <div style={{ fontSize:14.5, color:'var(--ink)', marginTop:3, fontWeight:500 }}>{frame.takeaway}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
        <Button variant="ghost" onClick={() => i === 0 ? setI(-1) : setI(i-1)}>← Back</Button>
        {i < total - 1
          ? <Button onClick={() => setI(i+1)} size="lg">Next →</Button>
          : <Button onClick={onFinish} size="lg">Try the exercise →</Button>}
      </div>
    </div>
  );
};

// ─── Illustrations ─────────────────────────────────────────────────────
// (small reusable SVG components — abstract and metaphorical mix)

const I_TwoStories = () => {
  const rng = mulberry32(42);
  const pts = Array.from({length:25}).map((_,i) => ({ x: 20 + i*16, y: 80 + gauss(rng)*22 }));
  return (
    <svg viewBox="0 0 440 280" width="100%" style={{ maxWidth:380 }}>
      <text x="220" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">SAME DATA · TWO STORIES</text>
      {/* dots */}
      {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y+60} r="3" fill="var(--ink-3)"/>)}
      {/* story 1: trend line */}
      <path d={`M ${pts[0].x} ${pts[0].y+80} L ${pts[pts.length-1].x} ${pts[pts.length-1].y+40}`}
        stroke="var(--noise)" strokeWidth="2.5" fill="none" strokeDasharray="3 4"/>
      <text x="380" y="170" fontSize="11" fill="var(--noise-2)" className="mono">trend?</text>
      {/* story 2: flat mean */}
      <line x1="20" x2="420" y1="155" y2="155" stroke="var(--signal)" strokeWidth="2.5"/>
      <text x="40" y="148" fontSize="11" fill="var(--signal)" className="mono">no trend?</text>
    </svg>
  );
};

const I_NoisyDots = () => {
  const rng = mulberry32(7);
  return (
    <svg viewBox="0 0 280 220" width="220">
      <rect x="20" y="20" width="240" height="180" fill="none" stroke="var(--line)" strokeDasharray="3 4"/>
      {Array.from({length:60}).map((_,i)=>{
        const x = 30 + rng()*220;
        const y = 30 + rng()*160;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--noise)" opacity=".7"/>;
      })}
      <text x="140" y="216" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">pure noise — no pattern</text>
    </svg>
  );
};

const I_SignalThruNoise = () => {
  const rng = mulberry32(13);
  const pts = Array.from({length:30}).map((_,i)=>{
    const x = 20 + i*12;
    const sig = 180 - i*4;
    const y = sig + gauss(rng)*14;
    return { x, y, sig };
  });
  return (
    <svg viewBox="0 0 400 220" width="100%" style={{ maxWidth:340 }}>
      <text x="200" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">REAL SIGNAL UNDER NOISE</text>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--ink-3)" opacity=".6"/>)}
      <path d={pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.sig}`).join(' ')} fill="none" stroke="var(--signal)" strokeWidth="3"/>
    </svg>
  );
};

const I_Binoculars = () => (
  <svg viewBox="0 0 240 200" width="200">
    <circle cx="80" cy="100" r="46" fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="3"/>
    <circle cx="160" cy="100" r="46" fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="3"/>
    <circle cx="80" cy="100" r="30" fill="var(--signal-soft)"/>
    <circle cx="160" cy="100" r="30" fill="var(--signal-soft)"/>
    <path d="M 110 80 Q 120 70, 130 80" stroke="var(--ink)" strokeWidth="3" fill="none"/>
    <rect x="68" y="60" width="24" height="6" rx="2" fill="var(--ink)"/>
    <rect x="148" y="60" width="24" height="6" rx="2" fill="var(--ink)"/>
    {/* signal speck */}
    <path d="M 70 100 L 90 100 M 80 90 L 80 110" stroke="var(--noise)" strokeWidth="2.5" strokeLinecap="round"/>
    <text x="120" y="180" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">spotting through fog</text>
  </svg>
);

const I_WeatherTen = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:320 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">10 DAYS · "70% RAIN"</text>
    {Array.from({length:10}).map((_,i) => {
      const rained = i < 7;
      const x = 30 + i*32;
      return (
        <g key={i}>
          {rained ? (
            <g>
              <circle cx={x} cy="70" r="14" fill="var(--signal)"/>
              <path d={`M ${x-7} 88 L ${x-9} 96 M ${x-2} 88 L ${x-4} 96 M ${x+3} 88 L ${x+1} 96 M ${x+8} 88 L ${x+6} 96`} stroke="var(--signal)" strokeWidth="2" strokeLinecap="round"/>
            </g>
          ) : (
            <circle cx={x} cy="76" r="13" fill="var(--gold)"/>
          )}
          <text x={x} y="120" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">day {i+1}</text>
        </g>
      );
    })}
    <text x="180" y="158" textAnchor="middle" fontSize="14" fill="var(--ink)" className="serif">7 rainy / 10 days</text>
    <text x="180" y="178" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">forecaster was well calibrated</text>
  </svg>
);

const I_CalibrationCurve = () => (
  <svg viewBox="0 0 220 220" width="200">
    <line x1="20" y1="200" x2="200" y2="200" stroke="var(--ink)" strokeWidth="1.5"/>
    <line x1="20" y1="200" x2="20" y2="20"  stroke="var(--ink)" strokeWidth="1.5"/>
    <line x1="20" y1="200" x2="200" y2="20" stroke="var(--ink-4)" strokeDasharray="4 4"/>
    {/* overconfident path */}
    <path d="M 36 196 L 70 184 L 110 158 L 150 110 L 184 60" fill="none" stroke="var(--noise)" strokeWidth="2.5"/>
    {[36,70,110,150,184].map((x,i) => <circle key={i} cx={x} cy={[196,184,158,110,60][i]} r="4" fill="var(--noise)"/>)}
    <text x="105" y="216" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">stated prob →</text>
    <text x="10" y="110" fontSize="11" fill="var(--ink-3)" className="mono" transform="rotate(-90 10 110)">actual →</text>
    <text x="190" y="60" textAnchor="end" fontSize="10" fill="var(--noise)" className="mono">overconfident</text>
  </svg>
);

const I_Pit = () => (
  <svg viewBox="0 0 280 200" width="240">
    <path d="M 20 60 Q 140 220, 260 60" fill="var(--noise-soft)" stroke="var(--noise-2)" strokeWidth="2"/>
    <text x="140" y="40" textAnchor="middle" fontSize="13" fill="var(--ink)" className="serif">the overconfidence pit</text>
    <circle cx="140" cy="155" r="9" fill="var(--ink)"/>
    <text x="140" y="180" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">90% sure · right 70%</text>
  </svg>
);

const I_BrierFormula = () => (
  <svg viewBox="0 0 320 180" width="100%" style={{ maxWidth:300 }}>
    <text x="160" y="20" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">BRIER = (PROB − OUTCOME)²</text>
    <g transform="translate(160 100)">
      <rect x="-150" y="-25" width="300" height="50" rx="10" fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="2"/>
      <text x="-110" y="6" fontSize="22" fill="var(--noise-2)" className="serif">0.99</text>
      <text x="-50" y="6" fontSize="22" fill="var(--ink)" className="serif">−</text>
      <text x="-20" y="6" fontSize="22" fill="var(--good)" className="serif">0</text>
      <text x="20" y="6" fontSize="22" fill="var(--ink)" className="serif">=</text>
      <text x="60" y="6" fontSize="22" fill="var(--ink)" className="serif">0.99²</text>
      <text x="130" y="6" fontSize="22" fill="var(--bad)" className="serif">.98</text>
    </g>
    <text x="160" y="160" textAnchor="middle" fontSize="12" fill="var(--ink-3)" className="mono">confident + wrong = big penalty</text>
  </svg>
);

const I_BrierScores = () => (
  <svg viewBox="0 0 360 220" width="100%" style={{ maxWidth:320 }}>
    {[
      { p:'50%', label:'safe-but-unsharp', s:.25, c:'var(--gold)' },
      { p:'70%', label:'right & confident', s:.09, c:'var(--leaf)' },
      { p:'99%', label:'confidently right', s:.0001, c:'var(--good)' },
      { p:'99%', label:'confidently wrong', s:.98, c:'var(--bad)' },
    ].map((r,i) => (
      <g key={i} transform={`translate(0 ${30 + i*42})`}>
        <text x="14" y="20" fontSize="14" fill="var(--ink)" className="mono">{r.p}</text>
        <text x="64" y="20" fontSize="13" fill="var(--ink-3)" className="mono">{r.label}</text>
        <rect x="14" y="26" width={Math.max(8, r.s*340)} height="6" fill={r.c} rx="3"/>
        <text x={14 + Math.max(8,r.s*340) + 6} y="32" fontSize="11" fill="var(--ink-3)" className="mono">{r.s.toFixed(2)}</text>
      </g>
    ))}
  </svg>
);

const I_DotsRare = () => {
  // 10x10 grid: 1 sick (red), 5 false positive (gold), rest healthy
  return (
    <svg viewBox="0 0 240 240" width="220">
      <text x="120" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">100 PEOPLE · 1 IS SICK</text>
      {Array.from({length:100}).map((_,i) => {
        const r = Math.floor(i/10), c = i%10;
        const isSick = i === 44;
        const isFP = [12, 27, 53, 76, 89].includes(i);
        const x = 20 + c*20, y = 30 + r*20;
        return <circle key={i} cx={x} cy={y} r="7"
          fill={isSick ? 'var(--noise)' : isFP ? 'var(--gold)' : 'var(--bg-card)'}
          stroke={isSick ? 'var(--noise-2)' : isFP ? 'var(--gold)' : 'var(--line-2)'} strokeWidth={isSick||isFP?2:1}/>;
      })}
      <text x="120" y="234" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">red = true · gold = false positive</text>
    </svg>
  );
};

const I_AskOutOf = () => (
  <svg viewBox="0 0 280 200" width="240">
    <text x="140" y="30" textAnchor="middle" fontSize="14" fill="var(--ink)" className="serif">Always ask:</text>
    <text x="140" y="60" textAnchor="middle" fontSize="22" fill="var(--noise-2)" className="serif">"out of how many?"</text>
    <g transform="translate(70 90)">
      <rect x="0" y="0" width="140" height="14" rx="2" fill="var(--noise)"/>
      <rect x="0" y="22" width="140" height="14" rx="2" fill="var(--gold-soft)" stroke="var(--gold)"/>
      <text x="146" y="11" fontSize="11" fill="var(--noise-2)" className="mono">test positive</text>
      <text x="146" y="33" fontSize="11" fill="var(--gold)" className="mono">actually sick</text>
    </g>
    <text x="140" y="180" textAnchor="middle" fontSize="11" fill="var(--ink-3)" className="mono">most positives aren't real</text>
  </svg>
);

const I_Seesaw = () => (
  <svg viewBox="0 0 320 220" width="100%" style={{ maxWidth:280 }}>
    <text x="160" y="22" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">EVIDENCE TIPS THE BALANCE</text>
    <g transform="translate(160 130)">
      {/* fulcrum */}
      <polygon points="-15,40 15,40 0,15" fill="var(--ink)"/>
      <line x1="0" y1="0" x2="0" y2="40" stroke="var(--ink)" strokeWidth="2"/>
      {/* beam */}
      <line x1="-110" y1="-20" x2="110" y2="20" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
      {/* left pan */}
      <circle cx="-100" cy="-20" r="22" fill="var(--noise-soft)" stroke="var(--noise)" strokeWidth="2"/>
      <text x="-100" y="-16" textAnchor="middle" fontSize="11" fill="var(--noise-2)" className="mono">prior</text>
      {/* right pan */}
      <circle cx="100" cy="20" r="32" fill="var(--signal-soft)" stroke="var(--signal)" strokeWidth="2"/>
      <text x="100" y="16" textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">posterior</text>
      <text x="100" y="30" textAnchor="middle" fontSize="10" fill="var(--signal)" className="mono">+ evidence</text>
    </g>
  </svg>
);

const I_OddsTimes = () => (
  <svg viewBox="0 0 360 200" width="100%" style={{ maxWidth:340 }}>
    <text x="180" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">UPDATE = OLD ODDS × LIKELIHOOD RATIO</text>
    <g transform="translate(0 80)" className="serif">
      <rect x="20"  y="-22" width="76" height="44" rx="10" fill="var(--noise-soft)" stroke="var(--noise)"/>
      <text x="58"  y="6" textAnchor="middle" fontSize="22" fill="var(--noise-2)">1 : 4</text>
      <text x="58"  y="42" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">prior odds</text>

      <text x="118" y="6" fontSize="26" fill="var(--ink-2)">×</text>

      <rect x="140" y="-22" width="76" height="44" rx="10" fill="var(--gold-soft)" stroke="var(--gold)"/>
      <text x="178" y="6" textAnchor="middle" fontSize="22" fill="var(--gold)">×3</text>
      <text x="178" y="42" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">evidence LR</text>

      <text x="238" y="6" fontSize="26" fill="var(--ink-2)">=</text>

      <rect x="260" y="-22" width="76" height="44" rx="10" fill="var(--signal-soft)" stroke="var(--signal)"/>
      <text x="298" y="6" textAnchor="middle" fontSize="22" fill="var(--signal)">3 : 4</text>
      <text x="298" y="42" textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">posterior</text>
    </g>
  </svg>
);

const I_CrowdJar = () => (
  <svg viewBox="0 0 320 220" width="100%" style={{ maxWidth:300 }}>
    <text x="160" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">GALTON · OX WEIGHING · 1906</text>
    {/* truth line */}
    <line x1="160" y1="40" x2="160" y2="190" stroke="var(--noise-2)" strokeWidth="2" strokeDasharray="3 3"/>
    <text x="166" y="48" fontSize="11" fill="var(--noise-2)" className="mono">truth</text>
    {/* individual guesses */}
    {Array.from({length:50}).map((_,i) => {
      const rng = mulberry32(i + 100);
      const offset = (rng() - 0.5) * 200;
      const x = 160 + offset;
      const y = 60 + (i % 25) * 5;
      return <circle key={i} cx={x} cy={y} r="2" fill="var(--ink-3)" opacity=".55"/>;
    })}
    {/* mean marker */}
    <line x1="166" y1="200" x2="166" y2="190" stroke="var(--signal)" strokeWidth="2"/>
    <text x="166" y="216" textAnchor="middle" fontSize="11" fill="var(--signal)" className="mono">crowd median</text>
  </svg>
);

const I_AvgMath = () => (
  <svg viewBox="0 0 340 200" width="100%" style={{ maxWidth:300 }}>
    <text x="170" y="18" textAnchor="middle" fontSize="11" fill="var(--ink-4)" className="mono">UNCORRELATED ERRORS CANCEL</text>
    {[
      { who:'A', guess:1100, err:-150 },
      { who:'B', guess:1400, err:150 },
      { who:'C', guess:1200, err:-50 },
      { who:'D', guess:1300, err:50 },
    ].map((g,i) => (
      <g key={i} transform={`translate(20 ${44 + i*26})`}>
        <text x="0" y="12" fontSize="14" fill="var(--ink)" className="mono">{g.who}</text>
        <rect x="22" y="2" width="160" height="12" fill="var(--bg-soft)" stroke="var(--line)" rx="2"/>
        <rect x={102 + Math.min(g.err, 0)} y="2" width={Math.abs(g.err) * 0.4} height="12" fill={g.err < 0 ? 'var(--noise)' : 'var(--signal)'}/>
        <line x1="102" y1="0" x2="102" y2="14" stroke="var(--ink)" strokeWidth="1.5"/>
        <text x="198" y="12" fontSize="11" fill="var(--ink-3)" className="mono">{g.err > 0 ? '+' : ''}{g.err}</text>
      </g>
    ))}
    <line x1="180" y1="156" x2="280" y2="156" stroke="var(--ink)" strokeWidth="1"/>
    <text x="84" y="172" fontSize="13" fill="var(--ink)" className="mono">average error =</text>
    <text x="240" y="172" fontSize="16" fill="var(--good)" className="mono" fontWeight="600">0</text>
  </svg>
);

// ─── Module definitions ────────────────────────────────────────────────
const Modules = {
  signal: {
    title:'Signal vs. Noise',
    intro:'The world streams data at us. Most of it is noise — random variation that the brain insists on turning into a story. Real signals are repeatable; phantom patterns aren\'t.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'Same data, two stories', illustration:<I_TwoStories/>, body:<>Look at any noisy chart and your brain will draw a line through it. But a chart can support a trend story <em>and</em> a "nothing happened" story at the same time. The data alone doesn't decide which is right.</> },
      { title:'What noise looks like', illustration:<I_NoisyDots/>, body:<>"Noise" means random variation with no underlying pattern. It clusters and gaps in ways that <em>feel</em> meaningful — that's pareidolia, the same instinct that makes clouds look like faces.</>, takeaway:'Random data is lumpier than people expect.' },
      { title:'What a real signal looks like', illustration:<I_SignalThruNoise/>, body:<>A real signal is a structural relationship — a true downward trend, a step change, a cycle that repeats. The dots still scatter, but a fitted line tracks something real that you'd see again in fresh data.</> },
      { title:'The test: does it replicate?', illustration:<I_Binoculars/>, body:<>Signals persist out-of-sample. Noise doesn't. The fastest way to tell them apart is to make a prediction based on the pattern you see, then test it on data you haven't looked at yet. If it holds, it's signal.</>, takeaway:'Predict, then test. Don\'t trust patterns you only saw after the fact.' },
    ]
  },
  calibration: {
    title:'Calibration',
    intro:'Calibration is a measurable property of a forecaster. When you say "70% chance", you\'re making a claim about reality — that you\'ll be right 7 out of 10 times across all the things you say 70% about.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'The weather-forecaster test', illustration:<I_WeatherTen/>, body:<>A meteorologist who says "70% chance of rain" should be rained on roughly 7 out of every 10 such days. If they say it on 100 days, it should rain on about 70.</> },
      { title:'The calibration plot', illustration:<I_CalibrationCurve/>, body:<>Bucket all your forecasts by stated confidence. Plot stated prob (x) against actual frequency (y). Perfect calibration hugs the diagonal. Below the diagonal means overconfident — "90% sure" but right only 60% of the time.</>, takeaway:'Perfect calibration = stated probability matches actual frequency.' },
      { title:'The overconfidence pit', illustration:<I_Pit/>, body:<>Most people, on their first try, sit 15–25 points below the diagonal at high confidence. "I'm 90% sure" usually means "I'm 70% sure but want to sound certain."</> },
      { title:'How to improve', illustration:<I_Binoculars/>, body:<>Calibration improves only with feedback. Record predictions with explicit probabilities, then check them. Notice which kinds of claims you reliably overshoot on. The skill is measurable, and it transfers.</>, takeaway:'Confidence is a claim about reality. Treat it that way.' },
    ]
  },
  brier: {
    title:'Brier Score',
    intro:'Brier scoring turns probability forecasts into a number you can track over time. It rewards being right AND being sharp — and punishes confident wrongness more than mild wrongness.',
    accent:'var(--gold-soft)',
    frames:[
      { title:'Why score probabilities?', illustration:<I_BrierFormula/>, body:<>If you only score right/wrong, "90% chance" and "51% chance" get the same points when right. That's bad: it punishes you for being clear about uncertainty. Brier solves this by scoring distance from truth.</> },
      { title:'The formula', illustration:<I_BrierFormula/>, body:<>Brier = (your probability − outcome)². Outcome is 0 or 1. Lower is better. Perfect prediction (1.0 on something that happens) = 0. Confidently wrong = nearly 1.</>, takeaway:'Squared error: small misses don\'t hurt much, big misses hurt a lot.' },
      { title:'Sharp vs. safe', illustration:<I_BrierScores/>, body:<>Saying "50%" on everything gives you a Brier of 0.25 — safe but unsharp. To beat that, you have to take positions <em>and</em> be right more often than not. Brier rewards both calibration and resolution.</> },
      { title:'It\'s a proper scoring rule', illustration:<I_CalibrationCurve/>, body:<>A "proper" scoring rule is one where your best strategy is to report your true belief. Brier (and log loss) are proper. If you fudge your probabilities to game the score, you do worse on average.</>, takeaway:'Honest probabilities win in the long run.' },
    ]
  },
  baseRate: {
    title:'Base Rates',
    intro:'A base rate is the prior probability of something — how often it happens before you look at any specific evidence. Ignoring base rates is the single most common forecasting mistake.',
    accent:'var(--noise-soft)',
    frames:[
      { title:'The trap', illustration:<I_DotsRare/>, body:<>"A test is 99% accurate. You tested positive. What's the probability you have the disease?" Most people answer 99%. The truth, for a rare disease, can be under 20%.</> },
      { title:'Why?', illustration:<I_DotsRare/>, body:<>If only 1 in 100 people are sick, then in any group of 100, you'll find 1 true positive — but also several false positives among the 99 healthy people. The false positives outnumber the true ones.</>, takeaway:'Test accuracy ≠ probability the test is right about you.' },
      { title:'The fix', illustration:<I_AskOutOf/>, body:<>Before looking at evidence, ask: "out of how many?" Always count the population the evidence is filtering. The fewer of "them" there are, the more skeptical you should be of a positive flag.</> },
      { title:'Where it shows up', illustration:<I_Binoculars/>, body:<>Base-rate neglect is everywhere: airport security, medical screening, hiring ("this candidate is great!"), credit scoring, AI safety alerts. Anywhere a low-prevalence event meets a noisy filter, the false-positive parade begins.</>, takeaway:'Priors first. Evidence updates them — it doesn\'t replace them.' },
    ]
  },
  bayes: {
    title:'Bayesian Updating',
    intro:'Bayesian updating is the math of changing your mind. It says: take your current belief, multiply by how well the new evidence fits each hypothesis, and rebalance.',
    accent:'var(--signal-soft)',
    frames:[
      { title:'The seesaw', illustration:<I_Seesaw/>, body:<>Start with a prior. Add a piece of evidence. Your belief tips toward whichever hypothesis the evidence fits better. A strong piece of evidence is a heavy weight; weak evidence barely moves the balance.</> },
      { title:'Likelihood ratios', illustration:<I_OddsTimes/>, body:<>Work in odds, not probabilities. New odds = old odds × likelihood ratio. The likelihood ratio is "how much more likely this evidence is if H is true vs. if H is false." Strong evidence has LR &gt; 5 or &lt; 0.2; most real-world evidence has LR between 0.5 and 3.</>, takeaway:'Beliefs multiply with evidence, they don\'t add.' },
      { title:'Sequential updating', illustration:<I_Seesaw/>, body:<>Keep multiplying. Each new piece of evidence is another likelihood ratio applied to your current odds. Order doesn't matter (assuming the pieces are independent). The math doesn't care if your first guess was bad — it'll correct itself.</> },
      { title:'When to trust your update', illustration:<I_Pit/>, body:<>Two failure modes: (1) treating weak evidence as strong (LR inflation), and (2) double-counting correlated evidence ("three friends agree" is not three independent updates if they all read the same article).</>, takeaway:'Strong evidence multiplies. Correlated evidence overstates.' },
    ]
  },
  crowd: {
    title:'Wisdom of Crowds',
    intro:'When you average many independent guesses, the errors cancel. The aggregate is often more accurate than any single guesser — including experts. This is the statistical magic behind betting markets, ensemble forecasts, and good polls.',
    accent:'var(--leaf-soft)',
    frames:[
      { title:'The original demo', illustration:<I_CrowdJar/>, body:<>At a county fair in 1906, Francis Galton averaged 787 written guesses for an ox's weight. The median (~1,207 lb) was within 1% of the true weight (1,198 lb) — better than the cattle experts in the crowd.</> },
      { title:'Why it works', illustration:<I_AvgMath/>, body:<>If individual errors are independent (no shared bias) and the distribution is roughly centered on the truth, positive and negative errors cancel. With enough guessers, the average converges to the answer.</>, takeaway:'Uncorrelated errors cancel. Correlated errors compound.' },
      { title:'When it fails', illustration:<I_Pit/>, body:<>Three classic failures: (1) groupthink — everyone heard the same rumor; (2) systematic bias — everyone underestimates jelly beans; (3) information cascade — late guessers anchor on early ones. Diversity is the engine.</> },
      { title:'How to use it', illustration:<I_Binoculars/>, body:<>Polls, prediction markets, ensemble weather models, surveys before standups. Whenever you can collect independent guesses cheaply, aggregate them — and worry if everyone agrees too easily.</>, takeaway:'Aggregate, and check whether your aggregators were actually independent.' },
    ]
  },
};

Object.assign(window, { TeachingModule, Modules });
