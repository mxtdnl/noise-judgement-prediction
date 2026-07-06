// sims-drills.jsx — short-form simulation drills

// ─── Anchoring Lab ───────────────────────────────────────────────────────
// Show the user a "random" anchor before asking them to estimate something.
// Run 8 trials. At the end, show the correlation between anchor and guess.
const AnchorQuestions = [
  { id:1, q:'What percentage of the world\'s adults are literate?',          truth:87,   unit:'%' },
  { id:2, q:'How tall is Mt. Everest (in meters)?',                          truth:8849, unit:'m' },
  { id:3, q:'How many countries are in the African Union?',                  truth:55,   unit:'countries' },
  { id:4, q:'In what year was the first commercial cell phone sold?',        truth:1983, unit:'year' },
  { id:5, q:'How many languages are spoken globally today?',                 truth:7150, unit:'languages' },
  { id:6, q:'What was the original price of an iPod (in USD, 2001)?',        truth:399,  unit:'USD' },
  { id:7, q:'How many bones are in the adult human body?',                   truth:206,  unit:'bones' },
  { id:8, q:'How long is the Great Wall of China (in km)?',                  truth:21196,unit:'km' },
];

// Generate an "anchor" that's deliberately way too high or way too low (random per session)
const generateAnchor = (truth, seed, biasHigh) => {
  const rng = mulberry32(seed);
  // bias to either ~10% of truth or ~5x truth
  if (biasHigh) {
    return Math.round(truth * (3 + rng() * 4));
  }
  return Math.max(1, Math.round(truth * (0.05 + rng() * 0.20)));
};

// deviation of a guess from truth, on a log scale (scale-free, so it doesn't
// reward simply knowing the answer). Positive = guessed high, negative = low.
const logDev = (h) => Math.log10(Math.max(1, h.guess) / h.truth);
const meanOf = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

const StationAnchor = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState('intro'); // intro | spin | spinning | guess | reveal | done
  const [anchor, setAnchor] = React.useState(null);
  const [guess, setGuess] = React.useState('');
  const [history, setHistory] = React.useState([]);
  // Balanced design: exactly 4 high anchors and 4 low, shuffled once per session.
  // (Coin flips could hand you 7 highs and 1 low, wrecking the comparison.)
  const [assignment] = React.useState(() => {
    const arr = [true,true,true,true,false,false,false,false];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
    return arr;
  });

  const cur = AnchorQuestions[idx];
  const biasHigh = assignment[idx];

  const startSpin = () => {
    setPhase('spinning');
    setTimeout(() => {
      const a = generateAnchor(cur.truth, idx * 47 + (biasHigh?1:0), biasHigh);
      setAnchor(a);
      setPhase('guess');
    }, 1200);
  };

  const submit = () => {
    const g = +guess;
    if (Number.isNaN(g)) return;
    setHistory([...history, { id: cur.id, anchor, biasHigh, guess: g, truth: cur.truth }]);
    setPhase('reveal');
  };

  // Anchoring effect = how much higher you guessed when anchored high vs low,
  // measured as mean log-deviation(high) − mean log-deviation(low).
  const computeEffect = (h) => {
    const dHigh = meanOf(h.filter(x=>x.biasHigh).map(logDev));
    const dLow  = meanOf(h.filter(x=>!x.biasHigh).map(logDev));
    return { dHigh, dLow, effect: dHigh - dLow };
  };

  const next = () => {
    if (idx + 1 >= AnchorQuestions.length) {
      const { effect, dHigh, dLow } = computeEffect(history);
      recordScore('anchor', { effect, dHigh, dLow, history });
      setPhase('done');
      return;
    }
    setIdx(idx + 1);
    setGuess('');
    setAnchor(null);
    setPhase('spin');
  };

  if (phase === 'intro') {
    return (
      <Panel eyebrow="Simulation · Anchoring Lab" title="A simple test of your own bias." accent="var(--gold)">
        <Callout tone="signal" icon="◔">
          You'll see a "random" number spin to a stop. Then you'll be asked an unrelated question and asked to estimate a number. We'll do this 8 times. At the end we'll show you something interesting about your own answers.
        </Callout>
        <p style={{ color:'var(--ink-2)', fontSize:15.5, marginTop:12 }}>
          Don't try to "beat" the anchor — just answer naturally each time. Behind the scenes, half of the spins are rigged high and half rigged low. If anchoring pulls you, your guesses will run higher after the high spins than the low ones — and that gap is what we measure.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" onClick={()=>setPhase('spin')}>Start spinning →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'done') {
    const { effect, dHigh, dLow } = computeEffect(history);
    const verdict = effect > 0.35 ? 'strong' : effect > 0.15 ? 'moderate' : effect > 0.05 ? 'mild' : 'anchor-resistant';
    const tone = effect > 0.35 ? 'bad' : effect > 0.15 ? 'gold' : effect > 0.05 ? 'gold' : 'good';

    // strip plot: log-deviation by anchor direction, baseline at 0 (perfect)
    const W = 460, H = 250, mid = 130, half = 96;
    const devs = history.map(logDev);
    const dMax = Math.max(0.6, ...devs.map(Math.abs));
    const yOf = (d) => mid - (d / dMax) * half;
    const colX = { low: 150, high: 330 };

    return (
      <Panel eyebrow="Simulation · Anchoring Lab · Resolved" title="How far the anchor pulled you." accent="var(--gold)">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          <div style={{ padding:'22px 24px', borderRadius:16, background:'var(--bg-card)', border:'1.5px solid var(--ink)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>anchoring effect</div>
            <div className="serif" style={{ fontSize:42, fontWeight:600, color: effect > 0.15 ? 'var(--bad)' : effect > 0.05 ? 'var(--gold)' : 'var(--good)' }}>{effect >= 0 ? '+' : ''}{effect.toFixed(2)}</div>
            <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:2 }}>{verdict} · gap in log-guess between high and low anchors</div>
          </div>
          <Callout tone={tone}>
            {effect > 0.35 ? <><strong>Strong anchoring.</strong> When the spin was high you guessed markedly higher than when it was low — even though the number was random. This happens to almost everyone. The defense is to form your own estimate BEFORE the anchor reaches you.</> :
             effect > 0.15 ? <><strong>Moderate anchoring.</strong> The rigged spins visibly moved your guesses. Tighter than many, but the pull is real.</> :
             effect > 0.05 ? <><strong>Mild anchoring.</strong> A small but detectable lean toward the anchor. Keep practicing pre-commitment.</> :
             <><strong>Anchor-resistant.</strong> Your high-anchor and low-anchor guesses were essentially the same. Either you ignored the spin or genuinely didn't let it pull you — rare.</>}
          </Callout>
        </div>

        {/* strip plot: deviation from truth, split by anchor direction */}
        <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>each dot = one guess · height = how far above/below the truth (log scale)</div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight:H }}>
            {/* perfect line (guess == truth) */}
            <line x1="40" x2={W-20} y1={mid} y2={mid} stroke="var(--ink-3)" strokeWidth="1.2" strokeDasharray="4 4"/>
            <text x={W-22} y={mid-6} textAnchor="end" fontSize="10" fill="var(--ink-4)" className="mono">exactly right</text>
            <text x="44" y={yOf(dMax)+10} fontSize="10" fill="var(--ink-4)" className="mono">guessed high ↑</text>
            <text x="44" y={yOf(-dMax)-4} fontSize="10" fill="var(--ink-4)" className="mono">guessed low ↓</text>
            {/* column labels */}
            <text x={colX.low}  y={H-8} textAnchor="middle" fontSize="12" fill="var(--ink-2)" className="mono">LOW anchor</text>
            <text x={colX.high} y={H-8} textAnchor="middle" fontSize="12" fill="var(--ink-2)" className="mono">HIGH anchor</text>
            {/* group mean bars */}
            {[['low', dLow],['high', dHigh]].map(([k,d]) => (
              <line key={k} x1={colX[k]-42} x2={colX[k]+42} y1={yOf(d)} y2={yOf(d)} stroke="var(--ink)" strokeWidth="2.5"/>
            ))}
            {/* dots */}
            {history.map((h,i) => {
              const col = h.biasHigh ? colX.high : colX.low;
              const jitter = ((i*37)%50) - 25;
              return <circle key={i} cx={col + jitter} cy={yOf(logDev(h))} r="5"
                fill={h.biasHigh ? 'var(--noise)' : 'var(--signal)'} opacity=".8"/>;
            })}
          </svg>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-3)', marginTop:6 }}>
            The thick bars are the average for each group. Anchoring shows up as the HIGH bar sitting above the LOW bar.
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <Button size="lg" onClick={onComplete}>Back to lab →</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'spin' || phase === 'spinning') {
    const spinning = phase === 'spinning';
    return (
      <Panel eyebrow={`Simulation · Anchoring Lab · ${idx+1}/${AnchorQuestions.length}`} title="Spin the wheel." accent="var(--gold)">
        <div style={{ textAlign:'center', padding:'32px 0' }}>
          <svg viewBox="0 0 240 240" width="240" style={{ display:'block', margin:'0 auto' }}>
            <circle cx="120" cy="120" r="100" fill="var(--bg-card)" stroke="var(--ink)" strokeWidth="3" style={{ transformOrigin:'120px 120px', animation: spinning ? 'spinFast .9s ease-out' : 'none' }}/>
            {Array.from({length:12}).map((_,i) => {
              const a = i * Math.PI / 6;
              return <line key={i} x1="120" y1="120" x2={120 + Math.cos(a)*100} y2={120 + Math.sin(a)*100} stroke="var(--ink-3)" strokeWidth="1"/>;
            })}
            {Array.from({length:12}).map((_,i) => {
              const a = (i + 0.5) * Math.PI / 6 - Math.PI/2;
              return <text key={i} x={120 + Math.cos(a)*72} y={120 + Math.sin(a)*72 + 4} textAnchor="middle" fontSize="12" fill="var(--ink-2)" className="mono">{Math.floor(Math.random()*99)}</text>;
            })}
            <polygon points="120,18 112,32 128,32" fill="var(--noise)"/>
          </svg>
          <style>{`@keyframes spinFast { from { transform: rotate(0deg) } to { transform: rotate(${720 + Math.random()*360}deg) } }`}</style>
        </div>
        <div style={{ textAlign:'center', marginTop:14, color:'var(--ink-3)' }}>{spinning ? 'spinning…' : 'Spin to generate a random anchor number.'}</div>
        <div style={{ display:'flex', justifyContent:'center', marginTop:18 }}>
          <Button size="lg" disabled={spinning} onClick={startSpin}>{spinning ? 'spinning…' : 'Spin the wheel →'}</Button>
        </div>
      </Panel>
    );
  }

  if (phase === 'guess') {
    return (
      <Panel eyebrow={`Simulation · Anchoring Lab · ${idx+1}/${AnchorQuestions.length}`} title="Your turn." accent="var(--gold)">
        <div style={{ padding:'22px 24px', borderRadius:16, background:'var(--gold-soft)', border:'1px solid var(--gold)', marginBottom:18 }}>
          <div className="mono" style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.14em' }}>your spun number</div>
          <div className="serif" style={{ fontSize:48, fontWeight:600, color:'var(--ink)', lineHeight:1 }}>{anchor.toLocaleString()}</div>
          <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:6, fontStyle:'italic' }}>This number was randomly generated. It has nothing to do with the question below.</div>
        </div>
        <div style={{ padding:'20px 24px', borderRadius:16, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>the question</div>
          <div className="serif" style={{ fontSize:22, lineHeight:1.3, marginTop:6 }}>{cur.q}</div>
          <div style={{ display:'flex', gap:10, marginTop:16, alignItems:'center' }}>
            <input type="number" value={guess} onChange={(e)=>setGuess(e.target.value)} placeholder="your estimate"
              style={{ flex:1, padding:'14px 18px', borderRadius:12, border:'1.5px solid var(--line-2)', background:'var(--bg-card)', fontSize:22, fontFamily:'"Geist Mono",monospace', fontWeight:600, outline:'none', color:'var(--ink)' }}/>
            <span className="mono" style={{ fontSize:14, color:'var(--ink-3)' }}>{cur.unit}</span>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
          <Button size="lg" disabled={guess === ''} onClick={submit}>Lock in →</Button>
        </div>
      </Panel>
    );
  }

  // reveal
  const last = history[history.length - 1];
  return (
    <Panel eyebrow={`Simulation · Anchoring Lab · ${idx+1}/${AnchorQuestions.length}`} title="The truth." accent="var(--gold)">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
        <div style={{ padding:'18px 20px', borderRadius:14, background:'var(--gold-soft)', border:'1px solid var(--gold)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.14em' }}>anchor (irrelevant)</div>
          <div className="mono" style={{ fontSize:28, fontWeight:600 }}>{last.anchor.toLocaleString()}</div>
        </div>
        <div style={{ padding:'18px 20px', borderRadius:14, background:'var(--noise-soft)', border:'1px solid var(--noise)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--noise-2)', textTransform:'uppercase', letterSpacing:'.14em' }}>your guess</div>
          <div className="mono" style={{ fontSize:28, fontWeight:600 }}>{last.guess.toLocaleString()}</div>
        </div>
        <div style={{ padding:'18px 20px', borderRadius:14, background:'var(--leaf-soft)', border:'1px solid var(--leaf)' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--good)', textTransform:'uppercase', letterSpacing:'.14em' }}>truth</div>
          <div className="mono" style={{ fontSize:28, fontWeight:600 }}>{last.truth.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
        <Button size="lg" onClick={next}>{idx+1 >= AnchorQuestions.length ? 'See your anchor profile →' : 'Next spin →'}</Button>
      </div>
    </Panel>
  );
};

// ─── Drift Detector ──────────────────────────────────────────────────────
// Time series with optional change point. Click to mark where you think the shift happened.
const DriftRounds = [
  { id:1, seed:11, n:50, shift:24, magnitude:14, name:'Daily app sign-ups', context:'After a marketing campaign rolled out, did sign-ups truly shift, or are we seeing noise?' },
  { id:2, seed:23, n:50, shift:null, name:'Server response times (ms)', context:'A new release went out. Did latency shift?' },
  { id:3, seed:47, n:50, shift:31, magnitude:-9, name:'Daily revenue ($k)', context:'Tax changes mid-period. Real change or noise?' },
  { id:4, seed:71, n:50, shift:null, name:'Weekly clicks-per-impression', context:'Marketing claims a 0.3% lift. Look at the data.' },
  { id:5, seed:99, n:50, shift:15, magnitude:18, name:'Patient recovery rate', context:'A new protocol started early in the window. Did outcomes shift?' },
];

const generateDriftSeries = ({ seed, n, shift, magnitude }) => {
  const rng = mulberry32(seed);
  const baseline = 50;
  const noise = 6;
  return Array.from({ length: n }, (_, i) => {
    let sig = baseline;
    if (shift !== null && shift !== undefined && i >= shift) sig += magnitude;
    return { x: i, y: sig + gauss(rng) * noise, sig };
  });
};

const StationDrift = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState('decide'); // decide | reveal
  const [mark, setMark] = React.useState(null); // null | 'none' | <index>
  const [calls, setCalls] = React.useState([]);

  const cur = DriftRounds[idx];
  const data = React.useMemo(() => generateDriftSeries(cur), [cur]);

  const submit = () => {
    const truth = cur.shift;
    const guessed = mark === 'none' ? null : mark;
    let correct = false;
    let err = null;
    if (truth === null && guessed === null) correct = true;
    if (truth !== null && guessed !== null) {
      err = Math.abs(guessed - truth);
      correct = err <= 4; // within 4 days of true shift
    }
    setCalls([...calls, { ...cur, guess: guessed, err, correct }]);
    setPhase('reveal');
  };

  const next = () => {
    if (idx + 1 >= DriftRounds.length) {
      const correct = calls.filter(c => c.correct).length;
      recordScore('drift', { correct, total: DriftRounds.length, calls });
      onComplete();
      return;
    }
    setIdx(idx + 1);
    setMark(null);
    setPhase('decide');
  };

  // chart geometry helpers
  const w = 640, h = 280;
  const pad = { l:36, r:16, t:16, b:30 };
  const ys = data.map(d=>d.y);
  const yMin = Math.min(...ys) - 4;
  const yMax = Math.max(...ys) + 4;
  const sx = (x) => pad.l + (x / (data.length - 1)) * (w - pad.l - pad.r);
  const sy = (y) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

  const handleClick = (e) => {
    if (phase !== 'decide') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = (e.clientX - rect.left) / rect.width * w;
    const x = Math.round((xPx - pad.l) / (w - pad.l - pad.r) * (data.length - 1));
    if (x < 0 || x >= data.length) return;
    setMark(x);
  };

  return (
    <Panel eyebrow={`Simulation · Drift Detector · ${idx+1}/${DriftRounds.length}`} title={cur.name} accent="var(--noise)">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <span style={{ color:'var(--ink-2)', fontSize:15 }}>{cur.context}</span>
        <ProgressDots total={DriftRounds.length} current={idx}/>
      </div>

      <div style={{ background:'var(--bg-soft)', borderRadius:18, padding:14, border:'1px solid var(--line)' }}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxHeight:h, cursor: phase === 'decide' ? 'crosshair' : 'default', userSelect:'none' }} onClick={handleClick}>
          {/* gridlines */}
          {[0,.25,.5,.75,1].map((t,i)=>(
            <line key={i} x1={pad.l} x2={w-pad.r} y1={pad.t + t*(h-pad.t-pad.b)} y2={pad.t + t*(h-pad.t-pad.b)} stroke="var(--line)" strokeDasharray={i===0||i===4?'':'2 4'}/>
          ))}
          {/* dots + line */}
          <path d={data.map((d,i) => `${i?'L':'M'} ${sx(d.x)} ${sy(d.y)}`).join(' ')} fill="none" stroke="var(--ink-2)" strokeWidth="1.5" opacity={phase==='reveal'?.5:.9}/>
          {data.map((d,i) => <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r="2.5" fill="var(--ink-2)" opacity={phase==='reveal'?.55:.9}/>)}
          {/* signal line (revealed) */}
          {phase === 'reveal' && cur.shift !== null && cur.shift !== undefined && (
            <g>
              {/* baseline */}
              <line x1={sx(0)} x2={sx(cur.shift - 1)} y1={sy(50)} y2={sy(50)} stroke="var(--signal)" strokeWidth="3"/>
              {/* shifted */}
              <line x1={sx(cur.shift)} x2={sx(data.length - 1)} y1={sy(50 + cur.magnitude)} y2={sy(50 + cur.magnitude)} stroke="var(--signal)" strokeWidth="3"/>
              {/* connector */}
              <line x1={sx(cur.shift - 0.5)} x2={sx(cur.shift - 0.5)} y1={sy(50)} y2={sy(50 + cur.magnitude)} stroke="var(--signal)" strokeWidth="3" strokeDasharray="3 3"/>
              <text x={sx(cur.shift)} y={pad.t + 12} fontSize="11" fill="var(--signal)" className="mono">true shift @ t={cur.shift}</text>
            </g>
          )}
          {phase === 'reveal' && cur.shift === null && (
            <line x1={sx(0)} x2={sx(data.length - 1)} y1={sy(50)} y2={sy(50)} stroke="var(--signal)" strokeWidth="3"/>
          )}
          {/* user's mark */}
          {typeof mark === 'number' && (
            <g>
              <line x1={sx(mark)} x2={sx(mark)} y1={pad.t} y2={h - pad.b} stroke="var(--noise-2)" strokeWidth="2"/>
              <text x={sx(mark) + 4} y={h - pad.b - 4} fontSize="11" fill="var(--noise-2)" className="mono">your mark</text>
            </g>
          )}
          {/* axis labels */}
          <text x={pad.l} y={h-8} fontSize="10" fill="var(--ink-4)" className="mono">t=0</text>
          <text x={w-pad.r} y={h-8} fontSize="10" fill="var(--ink-4)" textAnchor="end" className="mono">t={data.length-1}</text>
        </svg>
      </div>

      {phase === 'decide' && (
        <div style={{ marginTop:14 }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8 }}>
            Click the chart at the time you think the shift happened — or pick "no shift" if you see only noise.
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Button variant="ghost" onClick={()=>setMark('none')}>No shift / just noise</Button>
            <Button size="lg" disabled={mark === null} onClick={submit}>Lock in →</Button>
          </div>
        </div>
      )}

      {phase === 'reveal' && (() => {
        const last = calls[calls.length-1];
        return (
          <div className="fadeup" style={{ marginTop:14 }}>
            <Callout tone={last.correct ? 'good' : 'noise'} icon={last.correct ? '✓' : '✗'}>
              {cur.shift === null
                ? <><strong>{last.guess === null ? 'Correct — no shift.' : `Wrong — you marked t=${last.guess}, but there was no shift.`}</strong> The series was pure noise around a flat mean.</>
                : last.guess === null
                  ? <><strong>Wrong — there WAS a shift at t={cur.shift}.</strong> You called it noise, but the mean really did move by {cur.magnitude} units.</>
                  : <><strong>{last.correct ? `Close — within ${last.err} days of the true shift.` : `Off by ${last.err} days.`}</strong> True shift at t={cur.shift}, you marked t={last.guess}.</>
              }
            </Callout>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
              <span className="mono" style={{ fontSize:12, color:'var(--ink-4)' }}>{calls.filter(c=>c.correct).length}/{calls.length} correct so far</span>
              <Button onClick={next} size="lg">{idx+1 >= DriftRounds.length ? 'Finish drill →' : 'Next series →'}</Button>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
};

// ─── Versus the Crowd ────────────────────────────────────────────────────
// Question. Give your initial probability. Then see the crowd's. Optionally update. Score on both.
const CrowdQuestions = [
  { id:1, q:'More than half of the world\'s population lives in the Northern Hemisphere.', truth:true, crowd:.70, sd:.20, explain:'About 87% of people live north of the equator — nearly all of Asia, Europe and North America sit up there.' },
  { id:2, q:'The Sun is more than 100 times the mass of the Earth.',                       truth:true,  crowd:.81, sd:.20, explain:'About 333,000 times. Crowd is right.' },
  { id:3, q:'A randomly selected adult lives within 1 mile of where they grew up.',         truth:false, crowd:.34, sd:.22, explain:'~30% of US adults still live in their hometown, but only ~10% within 1 mile.' },
  { id:4, q:'Oxford University is older than the Aztec Empire.',                            truth:true,  crowd:.40, sd:.24, explain:'Teaching at Oxford dates to ~1096; the Aztec Empire formed in 1428. Oxford predates it by centuries.' },
  { id:5, q:'A typical human body contains more bacterial cells than human cells.',        truth:true,  crowd:.60, sd:.25, explain:'Recent estimates put the ratio near ~1.3:1, so bacterial cells still slightly outnumber human ones. (The old 10:1 figure was wrong.)' },
  { id:6, q:'There are more trees on Earth than stars in the Milky Way.',                  truth:true,  crowd:.45, sd:.27, explain:'~3 trillion trees vs ~100-400 billion stars in the Milky Way.' },
];

const StationCrowdVs = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState('init'); // init | reveal | update | resolved
  const [initial, setInitial] = React.useState(50);
  const [updated, setUpdated] = React.useState(50);
  const [history, setHistory] = React.useState([]);

  const cur = CrowdQuestions[idx];
  const crowdPct = Math.round(cur.crowd * 100);

  const reveal = () => {
    setUpdated(initial);
    setPhase('reveal');
  };

  const submit = () => {
    const initialBrier = Math.pow(initial/100 - (cur.truth?1:0), 2);
    const updatedBrier = Math.pow(updated/100 - (cur.truth?1:0), 2);
    setHistory([...history, { id: cur.id, initial, updated, truth: cur.truth, crowd: crowdPct, initialBrier, updatedBrier }]);
    setPhase('resolved');
  };

  const next = () => {
    if (idx + 1 >= CrowdQuestions.length) {
      const initialAvg = history.reduce((s,h)=>s+h.initialBrier,0)/history.length;
      const updatedAvg = history.reduce((s,h)=>s+h.updatedBrier,0)/history.length;
      const improved = updatedAvg < initialAvg;
      recordScore('crowdVs', { initialAvg, updatedAvg, improved, history });
      onComplete();
      return;
    }
    setIdx(idx+1);
    setInitial(50);
    setUpdated(50);
    setPhase('init');
  };

  return (
    <Panel eyebrow={`Simulation · Versus the Crowd · ${idx+1}/${CrowdQuestions.length}`} title="Forecast. See the crowd. Update?" accent="var(--leaf)">
      <div style={{ padding:'20px 24px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:18 }}>
        <div className="serif" style={{ fontSize:21, lineHeight:1.3 }}>{cur.q}</div>
      </div>

      {phase === 'init' && (
        <div>
          <div style={{ marginBottom:10, color:'var(--ink-2)', fontSize:14 }}>Your initial probability it's true:</div>
          <ProbabilitySlider value={initial} onChange={setInitial} lowLabel="false" highLabel="true"/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20 }}>
            <Button size="lg" onClick={reveal}>Reveal the crowd →</Button>
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="fadeup">
          <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-card)', border:'1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6 }}>a simulated crowd of 500 forecasters said</div>
            {/* histogram-y bar */}
            <div style={{ position:'relative', height:36, borderRadius:6, background:'var(--bg-soft)', border:'1px solid var(--line)', overflow:'hidden' }}>
              {Array.from({length:20}).map((_,i) => {
                const center = i * 5 + 2.5;
                const sd = cur.sd * 100;
                const dist = Math.exp(-Math.pow((center - crowdPct)/sd, 2));
                return <div key={i} style={{ position:'absolute', left:`${i*5}%`, bottom:0, width:'4.5%', height:`${dist*100}%`, background:'var(--leaf)' }}/>;
              })}
              <div style={{ position:'absolute', left:`${crowdPct}%`, top:0, bottom:0, width:2, background:'var(--ink)' }}/>
            </div>
            <div className="mono" style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12 }}>
              <span style={{ color:'var(--ink-3)' }}>0%</span>
              <span style={{ color:'var(--ink)', fontWeight:600 }}>crowd median: {crowdPct}%</span>
              <span style={{ color:'var(--ink-3)' }}>100%</span>
            </div>
          </div>

          <div style={{ marginTop:18, padding:'14px 18px', borderRadius:14, background:'var(--gold-soft)', border:'1px dashed var(--gold)' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.14em' }}>your initial: {initial}% · crowd: {crowdPct}%</div>
            <div style={{ marginTop:8, color:'var(--ink-2)', fontSize:14 }}>You can stick with your answer, or update toward (or away from) the crowd.</div>
          </div>

          <div style={{ marginTop:14, color:'var(--ink-2)', fontSize:14 }}>Your updated probability:</div>
          <ProbabilitySlider value={updated} onChange={setUpdated} lowLabel="false" highLabel="true"/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
            <Button size="lg" onClick={submit}>Lock in →</Button>
          </div>
        </div>
      )}

      {phase === 'resolved' && (() => {
        const last = history[history.length-1];
        const improved = last.updatedBrier < last.initialBrier;
        return (
          <div className="fadeup">
            <Callout tone={cur.truth ? 'good' : 'noise'} icon={cur.truth ? '✓' : '✗'}>
              <strong>The answer is {cur.truth ? 'true' : 'false'}.</strong> {cur.explain}
            </Callout>
            <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ padding:'14px 18px', borderRadius:12, background:'var(--bg-soft)', border:'1px solid var(--line)' }}>
                <div className="mono" style={{ fontSize:11, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em' }}>your initial</div>
                <div className="mono" style={{ fontSize:24, fontWeight:600 }}>{last.initial}% <span style={{ fontSize:13, color:'var(--ink-3)' }}>(Brier {last.initialBrier.toFixed(3)})</span></div>
              </div>
              <div style={{ padding:'14px 18px', borderRadius:12, background:improved ? 'var(--leaf-soft)':'var(--noise-soft)', border:`1px solid ${improved ? 'var(--leaf)':'var(--noise)'}` }}>
                <div className="mono" style={{ fontSize:11, color:improved ? 'var(--good)':'var(--bad)', textTransform:'uppercase', letterSpacing:'.14em' }}>your updated {improved ? '(better)':'(worse)'}</div>
                <div className="mono" style={{ fontSize:24, fontWeight:600 }}>{last.updated}% <span style={{ fontSize:13, color:'var(--ink-3)' }}>(Brier {last.updatedBrier.toFixed(3)})</span></div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
              <Button size="lg" onClick={next}>{idx+1 >= CrowdQuestions.length ? 'Finish drill →' : 'Next question →'}</Button>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
};

// ─── Forecaster's Tournament ─────────────────────────────────────────────
// 12 rapid questions across categories. Slider for P(true). Tracks Brier by category.
// Balanced 6 true / 6 false so a "just say true" strategy scores no better than chance.
const TournamentQuestions = [
  { cat:'Geography',  q:'Tokyo has a larger metro population than New York.', truth:true,  explain:'Tokyo metro ~37M vs NYC metro ~20M.' },
  { cat:'Geography',  q:'Russia is larger in area than the surface of Pluto.', truth:false, explain:'Russia is ~17.1M km²; Pluto\'s surface area is ~17.6M km². Pluto\'s surface is actually a touch bigger.' },
  { cat:'Geography',  q:'Spain is closer to Africa than to the Caribbean.',    truth:true,  explain:'The Strait of Gibraltar is ~13 km to Africa; the Caribbean is ~7,000 km away.' },
  { cat:'Science',    q:'A photon takes about 8 minutes to travel from the Sun to Earth.', truth:true,  explain:'8 minutes 20 seconds on average.' },
  { cat:'Science',    q:'Lightning never strikes the same place twice.',        truth:false, explain:'A myth — tall structures like the Empire State Building are struck dozens of times a year.' },
  { cat:'Science',    q:'A human body has roughly 10 times as many bacterial cells as human cells.', truth:false, explain:'The old 10:1 claim was overturned; modern estimates put the ratio near 1.3:1.' },
  { cat:'History',    q:'The Eiffel Tower was originally meant to be temporary.', truth:true,  explain:'Built for the 1889 World\'s Fair; it was to be dismantled after 20 years.' },
  { cat:'History',    q:'Cleopatra lived closer in time to the moon landing than to the building of the Great Pyramids.', truth:true, explain:'Pyramids ~2500 BCE, Cleopatra ~30 BCE, Apollo 1969 — she is about 500 years closer to the moon landing.' },
  { cat:'History',    q:'Napoleon was well below average height for his era.', truth:false, explain:'A myth from British propaganda and a French/English unit mix-up — he was about average for the time (~5\'6" / 1.68m).' },
  { cat:'Business',   q:'Apple\'s market cap is greater than the GDP of Italy.', truth:true,  explain:'Apple ~$3T market cap vs Italy GDP ~$2.2T.' },
  { cat:'Business',   q:'The most-watched single sporting event globally is the Super Bowl.', truth:false,  explain:'The FIFA World Cup Final routinely draws far more global viewers (~1.5B vs ~115M).' },
  { cat:'Business',   q:'Bill Gates dropped out of Stanford.',                  truth:false, explain:'He dropped out of Harvard, not Stanford.' },
];

const StationTournament = ({ onComplete, recordScore }) => {
  const [idx, setIdx] = React.useState(0);
  const [prob, setProb] = React.useState(50);
  const [phase, setPhase] = React.useState('predict'); // predict | reveal
  const [history, setHistory] = React.useState([]);

  const cur = TournamentQuestions[idx];

  const submit = () => {
    const p = prob / 100;
    const outcome = cur.truth ? 1 : 0;
    const score = Math.pow(p - outcome, 2);
    setHistory([...history, { ...cur, p, outcome, score }]);
    setPhase('reveal');
  };

  const next = () => {
    if (idx + 1 >= TournamentQuestions.length) {
      const avg = history.reduce((s,r)=>s+r.score,0) / history.length;
      // by category
      const cats = {};
      for (const h of history) {
        if (!cats[h.cat]) cats[h.cat] = { sum:0, n:0, correct:0 };
        cats[h.cat].sum += h.score;
        cats[h.cat].n++;
        if ((h.p > 0.5) === !!h.truth) cats[h.cat].correct++;
      }
      Object.keys(cats).forEach(k => cats[k].avg = cats[k].sum / cats[k].n);
      recordScore('tournament', { avg, history, cats });
      onComplete();
      return;
    }
    setIdx(idx+1);
    setProb(50);
    setPhase('predict');
  };

  const avgSoFar = history.length ? history.reduce((s,r)=>s+r.score,0) / history.length : null;

  return (
    <Panel eyebrow={`Simulation · Forecaster's Tournament · ${idx+1}/${TournamentQuestions.length}`} title="Rapid forecasting." accent="var(--gold)">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <Chip tone="gold">{cur.cat}</Chip>
        {avgSoFar != null && <span className="mono" style={{ fontSize:12, color:'var(--ink-3)'}}>avg Brier: <strong style={{ color:'var(--ink)' }}>{avgSoFar.toFixed(3)}</strong></span>}
      </div>

      <div style={{ padding:'20px 24px', borderRadius:18, background:'var(--bg-soft)', border:'1px solid var(--line)', marginBottom:18 }}>
        <div className="serif" style={{ fontSize:22, lineHeight:1.3 }}>{cur.q}</div>
      </div>

      {phase === 'predict' && (
        <div>
          <div style={{ marginBottom:8, color:'var(--ink-2)', fontSize:14 }}>P(true)?</div>
          <ProbabilitySlider value={prob} onChange={setProb} lowLabel="false" highLabel="true"/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
            <Button size="lg" onClick={submit}>Lock in →</Button>
          </div>
        </div>
      )}

      {phase === 'reveal' && (() => {
        const last = history[history.length-1];
        return (
          <div className="fadeup">
            <Callout tone={cur.truth ? 'good' : 'noise'} icon={cur.truth ? '✓' : '✗'}>
              <strong>{cur.truth ? 'True.' : 'False.'} </strong> {cur.explain}
            </Callout>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
              <Stat label="Your prob" value={`${Math.round(last.p*100)}%`}/>
              <Stat label="Brier" value={last.score.toFixed(3)} tone={last.score < 0.15 ? 'good' : last.score < 0.3 ? 'neutral' : 'bad'}/>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
              <Button size="lg" onClick={next}>{idx+1 >= TournamentQuestions.length ? 'See results →' : 'Next →'}</Button>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
};

Object.assign(window, { StationAnchor, StationDrift, StationCrowdVs, StationTournament });
